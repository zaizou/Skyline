import { ExecuteResult } from "../app/app";
import { track, api } from "lwc";
import App from "../app/app";
import CliElement from "../cliElement/cliElement";

const ELEMENT_IDENTIFIER = "metadataExplorer";
const DEFAULT_TIMEZONE = "America/Los_Angeles";
const CUSTOM_OBJECT = "CustomObject";
const STANDARD_FIELD = "StandardField";

enum ICONS {
  loading = "utility:spinner",
  complete = "utility:check",
  empty = "standard:empty"
}

const COLUMNS = [
  { label: "Metadata Type", fieldName: "metadataType", sortable: true },
  { label: "Full Name", fieldName: "label", sortable: true },
  {
    label: "Last Modified By",
    fieldName: "lastModifiedByName",
    sortable: true
  },
  {
    label: "Last Modified Date",
    fieldName: "lastModifiedDate",
    type: "date",
    typeAttributes: {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    },
    sortable: true
  },
  {
    fieldName: "status",
    label: "Status",
    cellAttributes: { iconName: { fieldName: "statusIcon" } }
  }
];

const COMMAND_PREFIX = {
  sfOrgDisplay: "sf org display --json",
  sfOrgListMetadataTypes: "sf org list metadata-types --json",
  sfOrgListMetadata: "sf org list metadata --metadata-type",
  sfProjectRetrieveStart: "sf project retrieve start",
  sfDataQueryFields: `sf data query --query "SELECT QualifiedApiName, LastModifiedDate FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName IN `
};

const COMMANDS = {
  orgDisplay: COMMAND_PREFIX.sfOrgDisplay,
  listMetadataTypes: COMMAND_PREFIX.sfOrgListMetadataTypes,
  listMetadataOfType: (selectedMetadataType: string): string =>
    `${COMMAND_PREFIX.sfOrgListMetadata} ${selectedMetadataType} --json`,
  retrieveMetadata: (selectedMetadataRows: string[]) => {
    const metadataStatements: string[] = [];
    for (const row of selectedMetadataRows) {
      metadataStatements.push(` --metadata "${row}"`);
    }
    return `${COMMAND_PREFIX.sfProjectRetrieveStart}${metadataStatements.join(
      " "
    )} --ignore-conflicts --json`;
  },
  queryFields: (sObjectApiNames: string[]) => {
    return `${COMMAND_PREFIX.sfDataQueryFields} (${sObjectApiNames.join(
      ", "
    )})" --json`;
  }
};

export default class MetadataExplorer extends CliElement {
  renderDropdownOptions = false;
  columns = COLUMNS;
  sortedBy = "lastModifiedDate";

  @track filterState = false;
  @track searchTermComponentName?: string;
  @track searchTermUserName?: string;
  @track searchTermFrom?: string;
  @track searchTermTo?: string;
  @track selectedTimeZone?: string = DEFAULT_TIMEZONE;

  @track selectedRows?: TreeGridMetadataItem[];
  @track error?: string;
  @track showSpinner = true;
  @track orgConnectionInfo?: SalesforceConnectionInfo;
  @track metadataTypes?: ListMetadataTypesResponse;
  @track selectedMetadataType?: MetadataObjectType;
  @track retrieveMetadataResult?: RetrieveMetadataResponse;
  @track metadataItemsByType = new Map<string, ListMetadataOfTypeResponse>();
  @track standardFieldsBySObjectApiName = new Map<
    string,
    FieldDefinitionResponse
  >();
  @track currentSObjectApiName?: string;
  @track processedMetadataTypes: string[] = [];

  connectedCallback(): void {
    App.sendCommandToTerminal(COMMANDS.orgDisplay, ELEMENT_IDENTIFIER);
  }

  @api
  handleExecuteResult(result: ExecuteResult) {
    const command = result.command;
    if (command.startsWith(COMMAND_PREFIX.sfOrgDisplay)) {
      this.handleOrgDisplay(result);
      return;
    }
    if (command.startsWith(COMMAND_PREFIX.sfOrgListMetadataTypes)) {
      this.handleMetadataTypes(result);
      return;
    }
    if (command.startsWith(COMMAND_PREFIX.sfOrgListMetadata)) {
      this.handleMetadataOfType(result);
      return;
    }
    if (command.startsWith(COMMAND_PREFIX.sfProjectRetrieveStart)) {
      this.handleMetadataRetrieve(result);
      return;
    }
    if (command.startsWith(COMMAND_PREFIX.sfDataQueryFields)) {
      this.handleFieldQuery(result);
    }
  }

  handleOrgDisplay(result: ExecuteResult) {
    if (result.stdout) {
      this.orgConnectionInfo = JSON.parse(result.stdout);
      App.sendCommandToTerminal(COMMANDS.listMetadataTypes, ELEMENT_IDENTIFIER);
    } else if (result.stderr) {
      this.error = result.stderr;
    }
  }

  handleMetadataTypes(result: ExecuteResult) {
    if (result.stdout) {
      this.metadataTypes = JSON.parse(result.stdout);
    } else if (result.stderr) {
      this.error = result.stderr;
    }
    this.showSpinner = false;
  }

  handleMetadataOfType(result: ExecuteResult) {
    if (result.stdout) {
      const selectedMetadataType = this.extractMetadataType(result.command);
      if (!selectedMetadataType) {
        return;
      }
      this.processedMetadataTypes.push(selectedMetadataType);
      const metadataOfSelectedType = JSON.parse(result.stdout);
      this.metadataItemsByType.set(
        selectedMetadataType,
        metadataOfSelectedType
      );
    } else if (result.stderr) {
      this.error = result.stderr;
    }
    this.showSpinner = false;
  }

  getSObjectApiNames(): string[] {
    return (
      this.metadataItemsByType
        .get(CUSTOM_OBJECT)
        ?.result.map((sObject) => sObject.fullName) ?? []
    );
  }

  extractMetadataType(command: string): string | undefined {
    const metadataPrefixRegex = new RegExp(
      COMMAND_PREFIX.sfOrgListMetadata + "\\s+(\\w+)"
    );
    const match = command.match(metadataPrefixRegex);

    if (match && match.length > 1) {
      return match[1];
    }

    return undefined;
  }

  handleMetadataRetrieve(result: ExecuteResult) {
    this.showSpinner = false;
  }

  handleToggle(event: CustomEvent) {
    const sObjectApiName = event.detail.name;
    if (
      this.selectedMetadataType?.xmlName !== CUSTOM_OBJECT ||
      !this.getSObjectApiNames().includes(sObjectApiName)
    ) {
      return;
    }
    this.showSpinner = true;
    this.currentSObjectApiName = sObjectApiName;
    App.sendCommandToTerminal(
      COMMANDS.queryFields([`'${sObjectApiName}'`]),
      ELEMENT_IDENTIFIER
    );
  }

  handleFieldQuery(result: ExecuteResult) {
    this.showSpinner = false;
    if (result.stderr) {
      this.error = result.stderr;
      return;
    }
    if (result.stdout) {
      const queryResult: FieldDefinitionResponse = JSON.parse(result.stdout);
      this.standardFieldsBySObjectApiName.set(
        this.currentSObjectApiName!,
        queryResult
      );
      this.currentSObjectApiName = undefined;
    }
  }

  handleMetadataTypeSelection(event: CustomEvent) {
    const selectedMetadataType = (event.target as HTMLInputElement).value;
    this.selectedRows = [];
    this.selectedMetadataType = this.metadataTypes?.result.metadataObjects.find(
      (metadataType) => metadataType.xmlName === selectedMetadataType
    );
    this.renderDropdownOptions = false;
    this.showSpinner = true;
    App.sendCommandToTerminal(
      COMMANDS.listMetadataOfType(this.selectedMetadataType!.xmlName),
      ELEMENT_IDENTIFIER
    );
    if (this.selectedMetadataType!.childXmlNames) {
      for (const childMetadataType of this.selectedMetadataType!.childXmlNames.filter(
        // TODO (#2): Investigate why list view retrieval doesn't always work.
        (childType) => childType !== "ListView"
      )) {
        App.sendCommandToTerminal(
          COMMANDS.listMetadataOfType(childMetadataType),
          ELEMENT_IDENTIFIER
        );
      }
    }
    if (this.selectedMetadataType!.xmlName === CUSTOM_OBJECT) {
      this.selectedMetadataType!.childXmlNames.push(STANDARD_FIELD);
    }
  }

  handleDropdownClick(event: CustomEvent) {
    this.renderDropdownOptions = !this.renderDropdownOptions;
  }

  handleRowSelection(event: CustomEvent) {
    const selectedRows = event.detail.selectedRows;
    this.selectedRows = selectedRows;
  }

  handleRetrieveClick() {
    const retrieveCommand = COMMANDS.retrieveMetadata(
      this.selectedMetadataRows!
    );
    this.showSpinner = true;
    App.sendCommandToTerminal(retrieveCommand, ELEMENT_IDENTIFIER);
  }

  handleComponentNameChange(event: CustomEvent) {
    this.searchTermComponentName = event.detail.value;
  }

  handleUserNameChange(event: CustomEvent) {
    this.searchTermUserName = event.detail.value;
  }

  handleFromChange(event: CustomEvent) {
    this.searchTermFrom = event.detail.value;
  }

  handleToChange(event: CustomEvent) {
    this.searchTermTo = event.detail.value;
  }

  handleTimeZoneChange(event: CustomEvent) {
    this.selectedTimeZone = event.detail;
  }

  handleFilterButtonClick() {
    this.filterState = !this.filterState;
    this.searchTermComponentName = undefined;
    this.searchTermUserName = undefined;
    this.searchTermFrom = undefined;
    this.searchTermTo = undefined;
    this.selectedTimeZone = DEFAULT_TIMEZONE;
  }

  applyFilters(metadataItems: MetadataItem[]): MetadataItem[] {
    metadataItems = this.applyComponentNameFilters(metadataItems);
    metadataItems = this.applyLastModifiedDateFilters(metadataItems);
    return metadataItems;
  }

  applyLastModifiedDateFilters(metadataItems: MetadataItem[]): MetadataItem[] {
    if (!this.searchTermFrom && !this.searchTermTo) {
      return metadataItems;
    }

    const from = this.searchTermFrom
      ? new Date(this.searchTermFrom)
      : undefined;
    const to = this.searchTermTo ? new Date(this.searchTermTo) : undefined;

    return metadataItems.filter((item) => {
      const lastModifiedDate = new Date(item.lastModifiedDate);
      return (
        (!from || lastModifiedDate >= from) && (!to || lastModifiedDate <= to)
      );
    });
  }

  applyComponentNameFilters(metadataItems: MetadataItem[]): MetadataItem[] {
    if (!this.searchTermComponentName) {
      return metadataItems;
    }
    return metadataItems.filter((metadataItem) =>
      this.fuzzyMatch(metadataItem.fullName, this.searchTermComponentName!)
    );
  }

  fuzzyMatch(str: string, pattern: string): boolean {
    pattern = pattern.toLowerCase();
    str = str.toLowerCase();
    let patternIdx = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === pattern[patternIdx]) {
        patternIdx++;
      }
      if (patternIdx === pattern.length) {
        return true;
      }
    }
    return false;
  }

  getObjectNameFromFileName(fileName: string): string {
    const firstSlashIndex = fileName.indexOf("/");
    if (firstSlashIndex === -1) {
      return ""; // Or handle this case as needed, maybe return fileName?
    }
    const firstDotAfterSlashIndex = fileName.indexOf(".", firstSlashIndex + 1);
    if (firstDotAfterSlashIndex === -1) {
      return fileName.substring(firstSlashIndex + 1);
    }
    return fileName.substring(firstSlashIndex + 1, firstDotAfterSlashIndex);
  }

  get treeGridRows(): TreeGridMetadataObjectType[] | undefined {
    if (!this.selectedMetadataType) {
      return undefined;
    }

    const treeGridMetadataType: TreeGridMetadataObjectType = {
      metadataType: this.selectedMetadataType.xmlName,
      id: this.selectedMetadataType.xmlName,
      statusIcon: ICONS.loading,
      _children: []
    };

    const metadataItems = this.metadataItemsByType.get(
      this.selectedMetadataType.xmlName
    );
    if (!metadataItems) {
      return [treeGridMetadataType];
    }

    const filteredMetadata = this.applyFilters(metadataItems.result).sort(
      (a, b) => a.fullName.localeCompare(b.fullName)
    );

    treeGridMetadataType._children = filteredMetadata
      .map((metadataItem) => {
        const children = this.getChildMetadataItems(metadataItem);
        if (
          this.selectedMetadataType!.childXmlNames.length === 0 ||
          (children && children.length > 0) ||
          this.selectedMetadataType!.xmlName === CUSTOM_OBJECT
        ) {
          const treeGridMetadataItem: TreeGridMetadataItem = {
            ...metadataItem,
            label: metadataItem.fullName,
            id: metadataItem.fullName,
            _children: children
          };
          return treeGridMetadataItem;
        }
        return undefined;
      })
      .filter(Boolean) as TreeGridMetadataItem[];

    treeGridMetadataType.statusIcon = ICONS.complete;
    return [treeGridMetadataType];
  }

  private getChildMetadataItems(
    metadataItem: MetadataItem
  ): TreeGridMetadataObjectType[] | undefined {
    if (!this.selectedMetadataType?.childXmlNames) {
      return undefined;
    }

    return this.selectedMetadataType.childXmlNames
      .map((childType) => {
        const childTypeRow: TreeGridMetadataObjectType = {
          metadataType: childType,
          id: `${metadataItem.type}.${metadataItem.fullName}.${childType}`,
          statusIcon: ICONS.loading,
          _children: []
        };

        const childMetadataItems =
          childType === STANDARD_FIELD
            ? this.standardFieldMetadataItems
            : this.metadataItemsByType.get(childType);

        if (childMetadataItems) {
          const filteredChildren = this.applyFilters(
            childMetadataItems.result
              .filter(
                (childItem) =>
                  this.getObjectNameFromFileName(childItem.fileName) ===
                  metadataItem.fullName
              )
              .map((childItem) => ({
                ...childItem,
                label: childItem.fullName.replace(
                  `${this.getObjectNameFromFileName(childItem.fileName)}.`,
                  ""
                ),
                id: `${metadataItem.type}.${metadataItem.fullName}.${childType}.${childItem.fullName}`
              }))
          );

          if (filteredChildren.length > 0) {
            childTypeRow._children = filteredChildren;
            childTypeRow.statusIcon = ICONS.complete;
            return childTypeRow;
          } else {
            childTypeRow.statusIcon = ICONS.empty;
            return;
          }
        }
        return;
      })
      .filter(Boolean) as TreeGridMetadataObjectType[] | undefined;
  }

  get standardFieldMetadataItems(): ListMetadataOfTypeResponse {
    const result: MetadataItem[] = [];

    for (const [sObjectApiName, standardFields] of this
      .standardFieldsBySObjectApiName) {
      if (standardFields) {
        result.push(
          ...standardFields.result.records
            .filter((field) => !field.QualifiedApiName.includes("__"))
            .map((field) => ({
              createdById: "",
              createdByName: "",
              createdDate: "",
              fileName: `/${sObjectApiName}.`,
              fullName: `${sObjectApiName}.${field.QualifiedApiName}`,
              id: "",
              lastModifiedById: "",
              lastModifiedByName: "",
              lastModifiedDate: field.LastModifiedDate!,
              manageableState: "",
              type: "CustomField"
            }))
        );
      }
    }

    return { status: 0, result, warnings: [] };
  }

  get selectedMetadataRows(): string[] | undefined {
    return this.selectedRows
      ?.filter((metadataRow) => metadataRow.fullName)
      ?.map((metadataRow) => `${metadataRow.type}:${metadataRow.fullName}`);
  }

  get renderRetrieve() {
    if (!this.selectedRows) {
      return false;
    }
    return this.selectedRows.length > 0;
  }

  get metadataTypeOptions(): { label: string; value: string }[] | undefined {
    return this.metadataTypes?.result.metadataObjects
      .map((mType) => ({ label: mType.xmlName, value: mType.xmlName }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
}

interface SalesforceConnectionInfo {
  status: number;
  result: {
    id: string;
    devHubId: string;
    apiVersion: string;
    accessToken: string;
    instanceUrl: string;
    username: string;
    clientId: string;
    status: string;
    expirationDate: string;
    createdBy: string;
    edition: string;
    orgName: string;
    createdDate: string;
    signupUsername: string;
    alias: string;
  };
  warnings: string[];
}

interface MetadataObjectType {
  directoryName: string;
  inFolder: boolean;
  metaFile: boolean;
  suffix: string;
  xmlName: string;
  childXmlNames: string[];
}

interface MetadataResult {
  metadataObjects: MetadataObjectType[];
  organizationNamespace: string;
  partialSaveAllowed: boolean;
  testRequired: boolean;
}

interface ListMetadataTypesResponse {
  status: number;
  result: MetadataResult;
  warnings: string[];
}

interface MetadataItem {
  createdById: string;
  createdByName: string;
  createdDate: string;
  fileName: string;
  fullName: string;
  id: string;
  lastModifiedById: string;
  lastModifiedByName: string;
  lastModifiedDate: string;
  manageableState: string;
  type: string;
}

interface ListMetadataOfTypeResponse {
  status: number;
  result: MetadataItem[];
  warnings: string[];
}

interface FileProperty {
  createdById: string;
  createdByName: string;
  createdDate: string;
  fileName: string;
  fullName: string;
  id: string;
  lastModifiedById: string;
  lastModifiedByName: string;
  lastModifiedDate: string;
  manageableState: string;
  type: string;
}

interface File {
  fullName: string;
  type: string;
  state: string;
  filePath: string;
}

interface Result {
  done: boolean;
  fileProperties: FileProperty[];
  id: string;
  status: string;
  success: boolean;
  messages: any[];
  files: File[];
}

interface RetrieveMetadataResponse {
  status: number;
  result: Result;
  warnings: string[];
}

interface TreeGridMetadataObjectType {
  metadataType: string;
  id: string;
  _children?: MetadataItem[];
  statusIcon?: string;
}

interface TreeGridMetadataItem extends MetadataItem {
  id: string;
  label: string;
  _children?: TreeGridMetadataObjectType[];
}

interface FieldDefinitionAttribute {
  type: string;
  url: string;
}

interface FieldDefinitionRecord {
  attributes: FieldDefinitionAttribute;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  QualifiedApiName: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  LastModifiedDate: string | null;
}

interface FieldDefinitionResult {
  records: FieldDefinitionRecord[];
  totalSize: number;
  done: boolean;
}

interface FieldDefinitionResponse {
  status: number;
  result: FieldDefinitionResult;
  warnings: any[]; // Or a more specific type if the structure of warnings is known.
}
