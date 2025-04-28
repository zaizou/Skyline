import { api, track } from "lwc";
import { ExecuteResult } from "../app/app";
import Toast from "lightning-base-components/src/lightning/toast/toast.js";
import CliElement from "../cliElement/cliElement";
import type {
  SkylineConfig,
  SalesforceEnvironmentConfig
} from "../../../types/config";

const ELEMENT_IDENTIFIER = "repoConfig";
const CONFIGURATION_FILE_NAME = "skyline.config.json";
const TEMPLATE_PATH = "templates/skyline.config.json";

declare global {
  interface Window {
    extensionPath: string;
  }
}

export default class RepoConfig extends CliElement {
  @track configurationFileContents?: SkylineConfig;
  @track currentBranch?: string;
  @track availableBranches: string[] = [];
  @track selectedBranch?: string;
  @track error?: string;
  @track isLoading = true;
  @track isEditing = false;
  @track editedConfig?: SalesforceEnvironmentConfig;
  @track showNewBranchModal = false;

  private get commands() {
    // Normalize path separators for the current OS
    const templatePath =
      `${window.extensionPath}/dist/${TEMPLATE_PATH}`.replace(/\\/g, "/");
    return {
      findConfigurationFile: `test -f ${CONFIGURATION_FILE_NAME}`,
      openConfigurationFile: `cat ${CONFIGURATION_FILE_NAME}`,
      getCurrentBranch: "git rev-parse --abbrev-ref HEAD",
      createConfigFile: `cp "${templatePath}" ${CONFIGURATION_FILE_NAME}`,
      saveConfigFile: (content: string) =>
        `echo '${content}' > ${CONFIGURATION_FILE_NAME}`,
      getAllBranches:
        "git branch -a | grep -v HEAD | sed -e 's/^[ *]*//' -e 's#remotes/origin/##'",
      deleteBranchConfig: (branch: string, content: string) =>
        `echo '${content}' > ${CONFIGURATION_FILE_NAME}`
    };
  }

  connectedCallback(): void {
    this.sendCommandToTerminal(this.commands.findConfigurationFile);
    this.sendCommandToTerminal(this.commands.getCurrentBranch);
    this.sendCommandToTerminal(this.commands.getAllBranches);
  }

  //  ▂▃▄▅▆▇█▓▒░ Public Methods ░▒▓█▇▆▅▄▃▂

  /**
   * Handles execute results from the terminal.
   * Dispatches the result to the appropriate handler based on the command prefix.
   * @param result The execution result from the terminal.
   */
  @api
  handleExecuteResult(result: ExecuteResult) {
    const command = result.command;
    switch (command) {
      case this.commands.findConfigurationFile:
        this.handleFindConfigurationFile(result);
        break;
      case this.commands.openConfigurationFile:
        this.handleOpenConfigurationFile(result);
        break;
      case this.commands.getCurrentBranch:
        this.handleGetCurrentBranch(result);
        break;
      case this.commands.createConfigFile:
        this.handleCreateConfigFile(result);
        break;
      case this.commands.getAllBranches:
        this.handleGetAllBranches(result);
        break;
    }
    this.isLoading = false;
  }

  /**
   * Returns the unique identifier for this component.
   * This identifier is used to distinguish between different components when handling
   * command results from the terminal.
   * @returns {string} The element identifier.
   */
  getElementIdentifier() {
    return ELEMENT_IDENTIFIER;
  }

  //  ▂▃▄▅▆▇█▓▒░ Event Handlers ░▒▓█▇▆▅▄▃▂

  handleFindConfigurationFile(result: ExecuteResult) {
    if (result.errorCode) {
      // File doesn't exist, create it from template
      this.sendCommandToTerminal(this.commands.createConfigFile);
    } else {
      this.sendCommandToTerminal(this.commands.openConfigurationFile);
    }
  }

  handleOpenConfigurationFile(result: ExecuteResult) {
    if (result.stdout) {
      try {
        this.configurationFileContents = JSON.parse(result.stdout);
      } catch (error) {
        this.handleError(
          "Invalid JSON in configuration file",
          "Configuration Error"
        );
      }
    } else if (result.stderr) {
      this.handleError(result.stderr, "Error reading configuration file");
    }
  }

  handleGetCurrentBranch(result: ExecuteResult) {
    if (result.stdout) {
      this.currentBranch = result.stdout.trim();
    }
  }

  handleCreateConfigFile(result: ExecuteResult) {
    if (result.stderr) {
      this.handleError(result.stderr, "Error creating configuration file");
    } else {
      this.sendCommandToTerminal(this.commands.openConfigurationFile);
    }
  }

  handleGetAllBranches(result: ExecuteResult) {
    if (result.stdout) {
      this.availableBranches = [
        ...new Set(
          result.stdout
            .split("\n")
            .map((b) => b.trim())
            .filter((b) => b)
        )
      ];
    }
  }

  handleBranchSelect(event: CustomEvent) {
    const target = event.target as HTMLElement;
    const branch = target.dataset.branch;
    this.selectedBranch = branch;
  }

  handleInputChange(event: CustomEvent) {
    const target = event.target as HTMLInputElement;
    if (!target?.dataset.field || !this.editedConfig) {
      return;
    }

    const field = target.dataset.field;
    const value =
      target.type === "number" ? Number(target.value) : target.value;

    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      if (parent === "testLevels") {
        this.editedConfig = {
          ...this.editedConfig,
          testLevels: {
            ...this.editedConfig.testLevels,
            [child]: value
          }
        };
      }
    } else {
      this.editedConfig = {
        ...this.editedConfig,
        [field]: value
      };
    }
  }

  handleMoveUp(event: CustomEvent) {
    const target = event.target as HTMLElement;
    const branch = target.dataset.branch;
    if (!branch || !this.configurationFileContents) return;

    const currentIndex =
      this.configurationFileContents.pipelineOrder.indexOf(branch);
    if (currentIndex <= 0) return;

    // Swap positions in the array
    const newOrder = [...this.configurationFileContents.pipelineOrder];
    [newOrder[currentIndex - 1], newOrder[currentIndex]] = [
      newOrder[currentIndex],
      newOrder[currentIndex - 1]
    ];

    this.configurationFileContents = {
      ...this.configurationFileContents,
      pipelineOrder: newOrder
    };

    this.saveConfig();
  }

  handleMoveDown(event: CustomEvent) {
    const target = event.target as HTMLElement;
    const branch = target.dataset.branch;
    if (!branch || !this.configurationFileContents) return;

    const currentIndex =
      this.configurationFileContents.pipelineOrder.indexOf(branch);
    if (currentIndex >= this.configurationFileContents.pipelineOrder.length - 1)
      return;

    // Swap positions in the array
    const newOrder = [...this.configurationFileContents.pipelineOrder];
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
      newOrder[currentIndex + 1],
      newOrder[currentIndex]
    ];

    this.configurationFileContents = {
      ...this.configurationFileContents,
      pipelineOrder: newOrder
    };

    this.saveConfig();
  }

  handleNewBranchClick() {
    this.showNewBranchModal = true;
  }

  handleDeleteBranchConfig() {
    if (!this.selectedBranch || !this.configurationFileContents) {
      return;
    }

    const updatedConfig = {
      ...this.configurationFileContents,
      pipelineOrder: this.configurationFileContents.pipelineOrder.filter(
        (b) => b !== this.selectedBranch
      ),
      branches: { ...this.configurationFileContents.branches }
    };
    delete updatedConfig.branches[this.selectedBranch];

    const configString = JSON.stringify(updatedConfig, null, 2).replace(
      /'/g,
      "'\\''"
    );
    this.sendCommandToTerminal(
      this.commands.deleteBranchConfig(this.selectedBranch, configString)
    );
    this.configurationFileContents = updatedConfig;
    this.selectedBranch = undefined;
  }

  handleAddNewBranch(event: CustomEvent) {
    const branch = event.detail.branch;
    if (!branch || !this.configurationFileContents) {
      return;
    }

    // Create new branch config from template
    const templateConfig = {
      label: branch,
      instanceUrl: "https://test.salesforce.com",
      consumerKey: "YOUR_CONSUMER_KEY",
      username: "user@example.com",
      secretNames: {
        keySecret: "KEY_SECRET",
        certificatePath: "CERT_PATH"
      },
      testLevels: {
        presubmit: "RunLocalTests",
        deployment: "RunLocalTests"
      }
    };

    // Add branch to the end of the pipeline
    const updatedConfig = {
      ...this.configurationFileContents,
      pipelineOrder: [...this.configurationFileContents.pipelineOrder, branch],
      branches: {
        ...this.configurationFileContents.branches,
        [branch]: templateConfig
      }
    };

    const configString = JSON.stringify(updatedConfig, null, 2).replace(
      /'/g,
      "'\\''"
    );
    this.sendCommandToTerminal(this.commands.saveConfigFile(configString));
    this.configurationFileContents = updatedConfig;
    this.selectedBranch = branch;
    this.showNewBranchModal = false;
  }

  handleEditClick() {
    this.isEditing = true;
    this.editedConfig = { ...this.currentEnvironmentConfig! };
  }

  handleSaveEdit() {
    if (!this.selectedBranch || !this.editedConfig) {
      return;
    }

    const updatedConfig = {
      ...this.configurationFileContents!,
      branches: {
        ...this.configurationFileContents!.branches,
        [this.selectedBranch]: this.editedConfig
      }
    };

    this.saveConfig(updatedConfig);
    this.isEditing = false;
    this.editedConfig = undefined;
  }

  handleCancelEdit() {
    this.isEditing = false;
    this.editedConfig = undefined;
  }

  handleModalCancel() {
    this.showNewBranchModal = false;
  }

  //  ▂▃▄▅▆▇█▓▒░ Private Methods ░▒▓█▇▆▅▄▃▂

  private handleError(error: string, label: string) {
    this.error = error;
    Toast.show({ label, message: error, variant: "error" }, this);
  }

  private saveConfig(config = this.configurationFileContents) {
    if (!config) return;

    // Ensure all branches are in the pipeline order
    const allBranches = Object.keys(config.branches);
    const missingBranches = allBranches.filter(
      (b) => !config.pipelineOrder.includes(b)
    );

    const updatedConfig = {
      ...config,
      pipelineOrder: [...config.pipelineOrder, ...missingBranches]
    };

    const configString = JSON.stringify(updatedConfig, null, 2).replace(
      /'/g,
      "'\\''"
    );
    this.sendCommandToTerminal(this.commands.saveConfigFile(configString));
    this.configurationFileContents = updatedConfig;
  }

  get orderedBranches() {
    if (!this.configurationFileContents) return [];

    return this.configurationFileContents.pipelineOrder
      .filter(
        (branchName) => this.configurationFileContents!.branches[branchName]
      )
      .map((branchName, index) => ({
        name: branchName,
        label: this.configurationFileContents!.branches[branchName].label,
        isFirst: index === 0,
        isLast:
          index === this.configurationFileContents!.pipelineOrder.length - 1
      }));
  }

  get currentEnvironmentConfig() {
    if (!this.selectedBranch || !this.configurationFileContents) {
      return undefined;
    }
    return this.configurationFileContents.branches[this.selectedBranch];
  }

  get testLevelOptions() {
    return [
      { label: "No Test Run", value: "NoTestRun" },
      { label: "Run Specified Tests", value: "RunSpecifiedTests" },
      { label: "Run Local Tests", value: "RunLocalTests" },
      { label: "Run All Tests in Org", value: "RunAllTestsInOrg" }
    ];
  }

  get isDeleteDisabled() {
    return !this.selectedBranch;
  }

  get existingBranches() {
    return this.configurationFileContents
      ? Object.keys(this.configurationFileContents.branches)
      : [];
  }
}
