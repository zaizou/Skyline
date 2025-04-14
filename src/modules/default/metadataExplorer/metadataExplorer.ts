import { ExecuteResult } from "../app/app";
import { track, api } from "lwc";
import { getIcons } from "../icons/icons";
import App from "../app/app";
import CliElement from "../cliElement/cliElement";

const ELEMENT_IDENTIFIER = "metadataExplorer";

const COMMANDS = {
  orgDisplay: "sf org display --json",
  listMetadataTypes: "sf org list metadata-types --json",
  listMetadataOfType: (selectedMetadataType: string): string =>
    `sf org list metadata --metadata-type ${selectedMetadataType} --json`,
  retrieveMetadata: (
    selectedMetadataType: string,
    selectedMetadataRow: string
  ) =>
    `sf project retrieve start --metadata "${selectedMetadataType}:${selectedMetadataRow}" --json`
};

export default class MetadataExplorer extends CliElement {
  icons = getIcons();
  renderDropdownOptions = false;
  @track error?: string;
  @track showSpinner = true;
  @track orgConnectionInfo?: SalesforceConnectionInfo;
  @track metadataTypes?: ListMetadataTypesResponse;
  @track selectedMetadataType?: string;
  @track metadataOfSelectedType?: ListMetadataOfTypeResponse;
  @track selectedMetadataRow?: string;
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
        this.selectedMetadataRow!
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
      console.log({
        metadataOfSelectedType: JSON.stringify(this.metadataOfSelectedType)
      });
    } else if (result.stderr) {
      this.error = result.stderr;
    }
    this.showSpinner = false;
  }

  handleMetadataRetrieve(result: ExecuteResult) {}

  handleMetadataTypeSelection(event: CustomEvent) {
    const selectedMetadataType = (event.target as HTMLInputElement).dataset
      .metadataType;
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

  get metadataTypeOptions(): string[] | undefined {
    if (!this.metadataTypes) {
      return undefined;
    }
    const result: string[] = [];
    for (const mType of this.metadataTypes.result.metadataObjects) {
      result.push(mType.xmlName);
    }
    result.sort();
    return result;
  }

  get metadataOfTheSelectedType(): MetadataItem[] | undefined {
    if (!this.metadataOfSelectedType) {
      return undefined;
    }
    const result = [...this.metadataOfSelectedType.result];
    return result.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  get dropdownContainerClass() {
    const prefix =
      "slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click";
    return this.renderDropdownOptions ? `${prefix} slds-is-open` : prefix;
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
  messages: any[]; // Adjust the type as needed
  files: File[];
}

interface RetrieveMetadataResponse {
  status: number;
  result: Result;
  warnings: string[];
}
