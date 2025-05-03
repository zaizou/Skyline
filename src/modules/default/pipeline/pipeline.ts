import { track } from "lwc";
import type { SkylineConfig } from "../../../types/config";
import CliElement from "../cliElement/cliElement";
import { ExecuteResult } from "../app/app";
import Toast from "lightning-base-components/src/lightning/toast/toast.js";

const CONFIGURATION_FILE_NAME = "skyline.config.json";
const ELEMENT_IDENTIFIER = "pipeline";

interface PullRequestFile {
  path: string;
  status: string; // "added", "modified", "removed", etc.
  isAdded: boolean;
  isModified: boolean;
  isRemoved: boolean;
}

interface PullRequest {
  number: number;
  title: string;
  body: string;
  baseRefName: string;
  url: string;
  files: PullRequestFile[];
  bodySectionName?: string;
  filesSectionName?: string;
  createdAt: string;
  state: string;
  closedAt?: string;
  stateBadgeClass: string;
}

interface BranchConfig {
  label: string;
  instanceUrl: string;
  username: string;
}

interface GroupedPR {
  key: string; // branch name
  value: PullRequest[];
  isOrderedBranch: boolean;
  containerClass: string;
  label?: string; // org label from config
  branchIcon: string;
  orgIcon: string;
}

export default class Pipeline extends CliElement {
  @track searchTerm = "";
  @track configurationFileContents?: SkylineConfig;
  @track isLoading = true;
  @track searchMessage = "";
  @track pullRequests: PullRequest[] = [];
  @track activeSections: string[] = [];
  @track orderedBranches: string[] = [];

  get groupedPullRequests(): GroupedPR[] {
    const groups = this.pullRequests.reduce(
      (groups: { [key: string]: PullRequest[] }, pr) => {
        if (!groups[pr.baseRefName]) {
          groups[pr.baseRefName] = [];
        }
        groups[pr.baseRefName].push(pr);
        return groups;
      },
      {}
    );

    // Create ordered groups first
    const orderedGroups = this.orderedBranches.map((branch) => {
      const branchConfig = this.configurationFileContents?.branches?.[branch];
      return {
        key: branch,
        value: groups[branch] || [],
        isOrderedBranch: true,
        containerClass: "slds-box slds-box_x-small slds-m-bottom_medium",
        label: branchConfig?.label || "No Salesforce Org",
        branchIcon: "standard:environment_hub",
        orgIcon: "utility:salesforce1"
      };
    });

    // Find unordered branches and add them to the end
    const unorderedBranches = Object.keys(groups).filter(
      (branch) => !this.orderedBranches.includes(branch)
    );

    const unorderedGroups = unorderedBranches.map((branch) => {
      const branchConfig = this.configurationFileContents?.branches?.[branch];
      return {
        key: branch,
        value: groups[branch],
        isOrderedBranch: false,
        containerClass:
          "slds-box slds-box_x-small slds-m-bottom_medium slds-theme_shade slds-theme_alert-texture",
        label: branchConfig?.label || "No Salesforce Org",
        branchIcon: "standard:environment_hub",
        orgIcon: "utility:salesforce1"
      };
    });

    return [...orderedGroups, ...unorderedGroups];
  }

  get hasResults(): boolean {
    return this.pullRequests.length > 0;
  }

  connectedCallback() {
    this.loadConfiguration();
  }

  get searchIsDisabled() {
    return !this.searchTerm;
  }

  private get commands() {
    return {
      openConfigurationFile: `cat ${CONFIGURATION_FILE_NAME}`,
      searchPullRequests: `gh pr list --json number,title,body,baseRefName,url,files,createdAt,state,closedAt --search "${this.searchTerm}" --state all`
    };
  }

  private loadConfiguration() {
    this.sendCommandToTerminal(this.commands.openConfigurationFile);
  }

  getElementIdentifier(): string {
    return ELEMENT_IDENTIFIER;
  }

  handleExecuteResult(result: ExecuteResult): void {
    if (result.command === this.commands.openConfigurationFile) {
      this.handleOpenConfigurationFile(result);
    } else if (result.command === this.commands.searchPullRequests) {
      this.handleSearchResults(result);
    }
  }

  handleOpenConfigurationFile(result: ExecuteResult) {
    this.isLoading = false;
    if (result.stdout) {
      try {
        this.configurationFileContents = JSON.parse(result.stdout);
        this.orderedBranches =
          this.configurationFileContents?.pipelineOrder || [];
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.handleError("Error parsing configuration file:", errorMessage);
      }
    }
  }

  handleTicketIdChange(event: CustomEvent) {
    this.searchTerm = event.detail.value;
  }

  handleSearch() {
    this.sendCommandToTerminal(this.commands.searchPullRequests);
  }

  handleSearchResults(result: ExecuteResult) {
    if (result.stdout) {
      try {
        const pullRequests = JSON.parse(result.stdout);
        if (pullRequests.length === 0) {
          this.searchMessage = `No changes found matching "${this.searchTerm}"`;
          this.pullRequests = [];
        } else {
          this.searchMessage = "";
          // Sort PRs by state (OPEN first) and then by createdAt date
          this.pullRequests = pullRequests
            .sort((a: PullRequest, b: PullRequest) => {
              // First compare by state
              if (a.state === "OPEN" && b.state !== "OPEN") return -1;
              if (a.state !== "OPEN" && b.state === "OPEN") return 1;

              // If states are the same, sort by date (newest first)
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            })
            .map((pr: PullRequest) => ({
              ...pr,
              bodySectionName: `${pr.number}_body`,
              filesSectionName: `${pr.number}_files`,
              stateBadgeClass:
                pr.state === "OPEN"
                  ? "slds-badge slds-theme_success"
                  : "slds-badge"
            }));
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.handleError("Error parsing search results:", errorMessage);
      }
    } else if (result.stderr) {
      this.handleError("Error searching pull requests:", result.stderr);
    }
  }

  private async handleError(error: string, label: string) {
    Toast.show({ label: label, message: error, variant: "error" }, this);
  }

  handleSectionToggle(event: CustomEvent) {
    this.activeSections = event.detail.openSections;
  }
}
