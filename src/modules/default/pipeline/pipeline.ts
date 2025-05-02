import { LightningElement, track } from "lwc";
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
}

interface GroupedPR {
  key: string; // branch name
  value: PullRequest[];
}

export default class Pipeline extends CliElement {
  @track ticketId = "";
  @track isSearchEnabled = false;
  @track configurationFileContents?: SkylineConfig;
  @track isLoading = true;
  @track searchMessage = "";
  @track pullRequests: PullRequest[] = [];
  @track activeSections: string[] = [];

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

    return Object.entries(groups).map(([key, value]) => ({
      key,
      value
    }));
  }

  get hasResults(): boolean {
    return this.pullRequests.length > 0;
  }

  connectedCallback() {
    this.loadConfiguration();
  }

  get searchIsDisabled() {
    return !this.isSearchEnabled || !this.ticketId;
  }

  private get commands() {
    return {
      openConfigurationFile: `cat ${CONFIGURATION_FILE_NAME}`,
      searchPullRequests: `gh pr list --json number,title,body,baseRefName,url,files --search "${this.ticketId}" --state all`
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
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        this.handleError("Error parsing configuration file:", errorMessage);
      }
    }
  }

  handleTicketIdChange(event: CustomEvent) {
    this.ticketId = event.detail.value;
    this.validateTicketId();
  }

  validateTicketId() {
    if (!this.configurationFileContents?.ticketing?.ticketIdRegex) {
      this.isSearchEnabled = false;
      return;
    }

    try {
      const regex = new RegExp(
        this.configurationFileContents.ticketing.ticketIdRegex
      );
      this.isSearchEnabled = regex.test(this.ticketId);
    } catch (error) {
      this.isSearchEnabled = false;
    }
  }

  handleSearch() {
    this.sendCommandToTerminal(this.commands.searchPullRequests);
  }

  handleSearchResults(result: ExecuteResult) {
    if (result.stdout) {
      try {
        const pullRequests = JSON.parse(result.stdout);
        if (pullRequests.length === 0) {
          this.searchMessage = `No changes found with reference to ticket ${this.ticketId}`;
          this.pullRequests = [];
        } else {
          this.searchMessage = "";
          this.pullRequests = pullRequests.map((pr: PullRequest) => ({
            ...pr,
            bodySectionName: `${pr.number}_body`,
            filesSectionName: `${pr.number}_files`
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

  get expectedRegexPattern(): string {
    return (
      this.configurationFileContents?.ticketing?.ticketIdRegex ||
      "No regex pattern configured"
    );
  }

  handleSectionToggle(event: CustomEvent) {
    this.activeSections = event.detail.openSections;
  }
}
