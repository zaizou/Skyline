import { ExecuteResult } from "../app/app";
import { track, api } from "lwc";
import { getIcons } from "../icons/icons";
import App from "../app/app";
import CliElement from "../cliElement/cliElement";

const ELEMENT_IDENTIFIER = "metadataExplorer";
const DEFAULT_TIMEZONE = "America/Los_Angeles";

const COLUMNS = [
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
  }
];

const COMMANDS = {
  orgDisplay: "sf org display --json",
  listMetadataTypes: "sf org list metadata-types --json",
  listMetadataOfType: (selectedMetadataType: string): string =>
    `sf org list metadata --metadata-type ${selectedMetadataType} --json`,
  retrieveMetadata: (
    selectedMetadataType: string,
    selectedMetadataRows: string[]
  ) => {
    const metadataStatements: string[] = [];
    for (const row of selectedMetadataRows) {
      metadataStatements.push(` --metadata "${selectedMetadataType}:${row}"`);
    }
    return `sf project retrieve start ${metadataStatements.join(
      " "
    )} --ignore-conflicts --json`;
  }
};

export default class MetadataExplorer extends CliElement {
  icons = getIcons();
  renderDropdownOptions = false;
  columns = COLUMNS;
  sortedBy = "lastModifiedDate";
  sortDirection = SortOrder.ascending;

  @track filterState = false;
  @track searchTermComponentName?: string;
  @track searchTermUserName?: string;
  @track searchTermFrom?: string;
  @track searchTermTo?: string;
  @track selectedTimeZone?: string = DEFAULT_TIMEZONE;

  @track selectedRows?: MetadataItem[];
  @track error?: string;
  @track showSpinner = true;
  @track orgConnectionInfo?: SalesforceConnectionInfo;
  @track metadataTypes?: ListMetadataTypesResponse;
  @track selectedMetadataType?: string;
  @track metadataOfSelectedType?: ListMetadataOfTypeResponse;
  @track retrieveMetadataResult?: RetrieveMetadataResponse;

  connectedCallback(): void {
    App.sendCommandToTerminal(COMMANDS.orgDisplay, ELEMENT_IDENTIFIER);
  }

  @api
  handleExecuteResult(result: ExecuteResult) {
    const command = result.command;
    switch (command) {
      case COMMANDS.orgDisplay:
        this.handleOrgDisplay(result);
        break;
      case COMMANDS.listMetadataTypes:
        this.handleMetadataTypes(result);
        break;
      case COMMANDS.listMetadataOfType(this.selectedMetadataType!):
        this.handleMetadataOfType(result);
        break;
      case COMMANDS.retrieveMetadata(
        this.selectedMetadataType!,
        this.selectedMetadataRows!
      ):
        this.handleMetadataRetrieve(result);
        break;
      default:
        break;
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
      this.metadataOfSelectedType = JSON.parse(result.stdout);
    } else if (result.stderr) {
      this.error = result.stderr;
    }
    this.showSpinner = false;
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

  updateColumnSorting(event: CustomEvent) {
    const newSortedBy = event.detail.fieldName;
    const newSortDirection = event.detail.sortDirection;
    if (this.sortedBy === newSortedBy) {
      this.sortDirection =
        this.sortDirection === SortOrder.ascending
          ? SortOrder.descending
          : SortOrder.ascending;
    } else {
      this.sortedBy = newSortedBy;
      this.sortDirection = newSortDirection;
    }
  }

  handleRowSelection(event: CustomEvent) {
    const selectedRows = event.detail.selectedRows;
    this.selectedRows = selectedRows;
  }

  handleRetrieveClick() {
    const retrieveCommand = COMMANDS.retrieveMetadata(
      this.selectedMetadataType!,
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

  get selectedMetadataRows(): string[] | undefined {
    return this.selectedRows?.map((metadataRow) => metadataRow.fullName);
  }

  get renderRetrieve() {
    if (!this.selectedRows) {
      return false;
    }
    return this.selectedRows.length > 0;
  }

  get sortedMetadataOfSelectedType() {
    if (!this.metadataOfSelectedType?.result) {
      return undefined;
    }
    const sortedMetadata = [...this.metadataOfSelectedType.result].sort(
      (a, b) => {
        const left = a[this.sortedBy as keyof MetadataItem];
        const right = b[this.sortedBy as keyof MetadataItem];
        if (left < right) {
          return this.sortDirection === SortOrder.ascending ? -1 : 1;
        } else if (left > right) {
          return this.sortDirection === SortOrder.ascending ? 1 : -1;
        }
        return 0;
      }
    );
    return this.applyFilters(sortedMetadata);
  }

  get metadataTypeOptions(): { label: string; value: string }[] | undefined {
    return this.metadataTypes?.result.metadataObjects
      .map((mType) => ({ label: mType.xmlName, value: mType.xmlName }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
}

enum SortOrder {
  ascending = "asc",
  descending = "desc"
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
  messages: any[]; // Adjust the type as needed
  files: File[];
}

interface RetrieveMetadataResponse {
  status: number;
  result: Result;
  warnings: string[];
}
