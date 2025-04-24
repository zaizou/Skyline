import { ExecuteResult } from "../app/app";
import { track, api } from "lwc";
import {
  SalesforceConnectionInfo,
  ListMetadataTypesResponse,
  MetadataObjectType,
  ListMetadataOfTypeResponse,
  RetrieveMetadataResponse,
  FieldDefinitionResponse,
  COMMAND_PREFIX,
  COMMANDS
} from "./sfCli";
import {
  ICONS,
  COLUMNS,
  TableRow,
  convertMetadataObjectTypeToTableRow,
  convertMetadataItemToTableRow,
  convertFieldDefinitionRecordToTableRow
} from "./table";
import App from "../app/app";
import CliElement from "../cliElement/cliElement";

const ELEMENT_IDENTIFIER = "metadataExplorer";
const DEFAULT_TIMEZONE = "America/Los_Angeles";
const CUSTOM_OBJECT = "CustomObject";
const STANDARD_FIELD = "StandardField";
const LAST_MODIFIED_DATE = "lastModifiedDate";

const SYSTEM_FIELDS = [
  // SObject system fields
  "Id",
  "IsDeleted",
  "CreatedById",
  "CreatedDate",
  "LastModifiedById",
  "LastModifiedDate",
  "LastActivityDate",
  "LastViewedDate",
  "LastReferencedDate",
  "MasterRecordId",
  "UserRecordAccessId",
  "SystemModstamp",
  // Custom metadata type specific system fields:
  "DeveloperName",
  "MasterLabel",
  "Language",
  "NamespacePrefix",
  "Label",
  "QualifiedApiName"
];

export default class MetadataExplorer extends CliElement {
  renderDropdownOptions = false;
  columns = COLUMNS;
  sortedBy = LAST_MODIFIED_DATE;

  @track filterState = false;
  @track searchTermComponentName?: string;
  @track searchTermUserName?: string;
  @track searchTermFrom?: string;
  @track searchTermTo?: string;
  @track selectedTimeZone?: string = DEFAULT_TIMEZONE;

  @track selectedRows?: TableRow[];
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

  //  ▂▃▄▅▆▇█▓▒░ Public Methods ░▒▓█▇▆▅▄▃▂

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
    if (command.startsWith(COMMAND_PREFIX.sfDataQueryFieldDefinitions)) {
      this.handleFieldQuery(result);
      return;
    }
  }

  //  ▂▃▄▅▆▇█▓▒░ Event Handlers ░▒▓█▇▆▅▄▃▂

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
      COMMANDS.queryFieldDefinitions([`'${sObjectApiName}'`]),
      ELEMENT_IDENTIFIER
    );
  }

  handleMetadataTypeSelection(event: CustomEvent) {
    this.resetMetadataItems();
    const selectedMetadataType = (event.target as HTMLInputElement).value;
    this.selectedMetadataType = this.metadataTypes?.result.metadataObjects.find(
      (metadataType) => metadataType.xmlName === selectedMetadataType
    );
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
    if (
      this.selectedMetadataType!.xmlName === CUSTOM_OBJECT &&
      this.selectedMetadataType?.childXmlNames &&
      !this.selectedMetadataType.childXmlNames.includes(STANDARD_FIELD)
    ) {
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

  //  ▂▃▄▅▆▇█▓▒░ Private Methods ░▒▓█▇▆▅▄▃▂

  private resetMetadataItems() {
    this.renderDropdownOptions = false;
    this.selectedRows = undefined;
    this.selectedMetadataType = undefined;
    this.retrieveMetadataResult = undefined;
    this.metadataItemsByType = new Map<string, ListMetadataOfTypeResponse>();
    this.standardFieldsBySObjectApiName = new Map<
      string,
      FieldDefinitionResponse
    >();
    this.currentSObjectApiName = undefined;
  }

  private handleOrgDisplay(result: ExecuteResult) {
    if (result.stdout) {
      this.orgConnectionInfo = JSON.parse(result.stdout);
      App.sendCommandToTerminal(COMMANDS.listMetadataTypes, ELEMENT_IDENTIFIER);
    } else if (result.stderr) {
      this.error = result.stderr;
    }
  }

  private handleMetadataTypes(result: ExecuteResult) {
    if (result.stdout) {
      this.metadataTypes = JSON.parse(result.stdout);
    } else if (result.stderr) {
      this.error = result.stderr;
    }
    this.showSpinner = false;
  }

  private handleMetadataOfType(result: ExecuteResult) {
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

  private getSObjectApiNames(): string[] {
    return (
      this.metadataItemsByType
        .get(CUSTOM_OBJECT)
        ?.result.map((sObject) => sObject.fullName) ?? []
    );
  }

  private extractMetadataType(command: string): string | undefined {
    const metadataPrefixRegex = new RegExp(
      COMMAND_PREFIX.sfOrgListMetadata + "\\s+(\\w+)"
    );
    const match = command.match(metadataPrefixRegex);

    if (match && match.length > 1) {
      return match[1];
    }

    return undefined;
  }

  private handleMetadataRetrieve(result: ExecuteResult) {
    this.showSpinner = false;
  }

  private handleFieldQuery(result: ExecuteResult) {
    this.showSpinner = false;
    if (result.stderr) {
      this.error = result.stderr;
      return;
    }
    if (result.stdout) {
      const queryResult = JSON.parse(result.stdout);
      this.standardFieldsBySObjectApiName.set(
        this.currentSObjectApiName!,
        queryResult
      );
      this.currentSObjectApiName = undefined;
    }
  }

  private applyTableRowFilters(rows: TableRow[]): TableRow[] {
    rows = this.applyLastModifiedDateRowFilter(rows);
    rows = this.applyComponentNameTableRowFilter(rows);
    return rows;
  }

  private applyLastModifiedDateRowFilter(rows: TableRow[]): TableRow[] {
    if (!this.searchTermFrom && !this.searchTermTo) {
      return rows;
    }

    const from = this.searchTermFrom
      ? new Date(this.searchTermFrom)
      : undefined;
    const to = this.searchTermTo ? new Date(this.searchTermTo) : undefined;

    return rows.filter((row) => {
      if (!row.lastModifiedDate) {
        return true;
      }
      const lastModifiedDate = new Date(row.lastModifiedDate);
      return (
        (!from || lastModifiedDate >= from) && (!to || lastModifiedDate <= to)
      );
    });
  }

  private applyComponentNameTableRowFilter(rows: TableRow[]): TableRow[] {
    if (!this.searchTermComponentName) {
      return rows;
    }
    return rows.filter((row) =>
      this.fuzzyMatch(row.fullName!, this.searchTermComponentName!)
    );
  }

  private fuzzyMatch(str: string, pattern: string): boolean {
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

  private getChildMetadataTableRows(
    metadataItem: TableRow
  ): TableRow[] | undefined {
    if (!this.selectedMetadataType?.childXmlNames) {
      return undefined;
    }

    const result: TableRow[] = this.selectedMetadataType.childXmlNames.flatMap(
      (childType) => {
        const childTypeRow = this.createChildTypeRow(metadataItem, childType);
        const childMetadataItemRows = this.getChildMetadataItemRows(
          metadataItem,
          childType
        );

        if (childMetadataItemRows && childMetadataItemRows.length > 0) {
          childTypeRow._children = childMetadataItemRows;
          childTypeRow.statusIcon = ICONS.complete;
          return childTypeRow;
        }

        return [];
      }
    );

    return result.length > 0 ? result : undefined;
  }

  private createChildTypeRow(
    metadataItem: TableRow,
    childType: string
  ): TableRow {
    return {
      id: `${metadataItem.fullName}.${childType}`,
      metadataType: childType,
      statusIcon: ICONS.loading,
      _children: []
    };
  }

  private getChildMetadataItemRows(
    metadataItem: TableRow,
    childType: string
  ): TableRow[] | undefined {
    if (childType === STANDARD_FIELD) {
      return this.getStandardFieldRows(metadataItem);
    } else {
      return this.getOtherChildMetadataRows(metadataItem, childType);
    }
  }

  private getStandardFieldRows(metadataItem: TableRow): TableRow[] | undefined {
    const standardFields = this.standardFieldsBySObjectApiName.get(
      metadataItem.fullName!
    );
    if (!standardFields) {
      return undefined;
    }

    return standardFields.result.records
      .map((field) =>
        convertFieldDefinitionRecordToTableRow(metadataItem.fullName!, field)
      )
      .filter(
        (record) =>
          record.label &&
          !SYSTEM_FIELDS.includes(record.label) &&
          !record.label.includes("__")
      )
      .sort((a, b) => a.label!.localeCompare(b.label!));
  }

  private getOtherChildMetadataRows(
    metadataItem: TableRow,
    childType: string
  ): TableRow[] | undefined {
    const childMetadataItems = this.metadataItemsByType.get(childType);
    if (!childMetadataItems) {
      return undefined;
    }

    return this.applyTableRowFilters(
      childMetadataItems.result.map((item) =>
        convertMetadataItemToTableRow(item)
      )
    )
      .filter((item) => item.sObjectApiName === metadataItem.fullName)
      .sort((a, b) => a.fullName!.localeCompare(b.fullName!));
  }

  private createChildRows(
    metadataItems: ListMetadataOfTypeResponse
  ): TableRow[] {
    return this.applyTableRowFilters(
      metadataItems.result.map((item) => convertMetadataItemToTableRow(item))
    )
      .sort((a, b) => a.fullName!.localeCompare(b.fullName!))
      .map((child) => ({
        ...child,
        _children: this.getChildMetadataTableRows(child)
      }));
  }

  //  ▂▃▄▅▆▇█▓▒░ Getters ░▒▓█▇▆▅▄▃▂

  get rows(): TableRow[] | undefined {
    if (!this.selectedMetadataType) {
      return undefined;
    }
    const metadataItems = this.metadataItemsByType.get(
      this.selectedMetadataType.xmlName
    );
    return [
      {
        ...convertMetadataObjectTypeToTableRow(this.selectedMetadataType),
        statusIcon: metadataItems ? ICONS.complete : ICONS.loading,
        _children: metadataItems ? this.createChildRows(metadataItems) : []
      }
    ];
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

  get selectedMetadataTypeValue(): string | undefined {
    return this.selectedMetadataType?.xmlName;
  }
}
