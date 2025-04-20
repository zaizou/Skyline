import { ExecuteResult } from "../app/app";
import { track, api } from "lwc";
import App from "../app/app";
import CliElement from "../cliElement/cliElement";

const ELEMENT_IDENTIFIER = "metadataExplorer";
const DEFAULT_TIMEZONE = "America/Los_Angeles";

enum ICONS {
  loading = "utility:spinner",
  complete = "utility:check"
}

const COLUMNS = [
  { label: "Metadata Type", fieldName: "metadataType", sortable: true },
  { label: "Full Name", fieldName: "fullName", sortable: true },
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
  sfProjectRetrieveStart: "sf project retrieve start"
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
  @track selectedMetadataType?: string;
  @track metadataOfSelectedType?: ListMetadataOfTypeResponse;
  @track retrieveMetadataResult?: RetrieveMetadataResponse;
  @track metadataItemsByType = new Map<string, ListMetadataOfTypeResponse>();
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
      this.metadataOfSelectedType = metadataOfSelectedType;
      this.metadataItemsByType.set(
        selectedMetadataType,
        metadataOfSelectedType
      );
    } else if (result.stderr) {
      this.error = result.stderr;
    }
    this.showSpinner = false;
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

  handleMetadataTypeSelection(event: CustomEvent) {
    const selectedMetadataType = (event.target as HTMLInputElement).value;
    this.selectedMetadataType = selectedMetadataType;
    this.renderDropdownOptions = false;
    this.showSpinner = true;
    App.sendCommandToTerminal(
      COMMANDS.listMetadataOfType(this.selectedMetadataType!),
      ELEMENT_IDENTIFIER
    );
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

  get treeGridRows(): TreeGridMetadataObjectType[] | undefined {
    if (!this.selectedMetadataType) {
      return undefined;
    }
    const treeGridMetadataType: TreeGridMetadataObjectType = {
      metadataType: this.selectedMetadataType,
      id: this.selectedMetadataType,
      statusIcon: ICONS.loading,
      _children: []
    };
    if (!this.metadataOfSelectedType?.result) {
      return [treeGridMetadataType];
    }
    const filteredMetadata = this.applyFilters(
      this.metadataOfSelectedType.result
    );
    for (const metadataItem of filteredMetadata!.sort((a, b) => {
      return a.fullName.localeCompare(b.fullName);
    })) {
      const treeGridMetadataItem: TreeGridMetadataItem = {
        ...metadataItem,
        id: metadataItem.fullName
      };
      treeGridMetadataType._children!.push(treeGridMetadataItem);
    }
    treeGridMetadataType.statusIcon = ICONS.complete;
    return [treeGridMetadataType];
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
}
