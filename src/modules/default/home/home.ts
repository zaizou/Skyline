/**
 * This component serves as the home page of the application.  It performs
 * initial checks to verify that the necessary prerequisites (Git, Salesforce CLI,
 * and a Git repository) are met before the user can proceed with other functionalities.
 * It displays loading indicators and error messages as appropriate.
 */
import { api } from "lwc";
import CLIElement from "../cliElement/cliElement";
import App from "../app/app";
import { ExecuteResult } from "../app/app";

/**
 * Error messages displayed to the user if prerequisites are not met.
 */
const ERROR_MESSAGES = {
  gitNotInstalled: "Git is not installed on this machine",
  notInGitDirectory: "The current working directory is not a git repository",
  sfCliNotInstalled: "The sf CLI is not installed on this machine"
};

/**
 * CLI commands used to verify prerequisites.
 */
const COMMANDS = {
  verifyGitIsInstalled: "git --version",
  verifySfCliIsInstalled: "sf --version",
  verifyInCurrentGitDir: "git status"
};

/**
 * Enum representing the different stages of the verification process.
 */
enum STAGES {
  git = "git",
  gitDir = "gitDir",
  sfCli = "sfCli",
  complete = "complete"
}

/**
 * Identifier used for communication between components.
 */
const ELEMENT_IDENTIFIER = "home";

export default class Home extends CLIElement {
  showSpinner = false;
  gitInstalled = false;
  sfCliInstalled = false;
  inGitDir = false;
  fullyVerified = false;
  hasError = false;
  errorMessage?: String;

  /**
   * Called when the component is connected to the DOM.
   * Initiates the verification process.
   */
  connectedCallback(): void {
    this.showSpinner = true;
    this.sendCommandToTerminal(COMMANDS.verifyGitIsInstalled);
    this.sendCommandToTerminal(COMMANDS.verifySfCliIsInstalled);
  }

  /**
   * Handles the execution result from the terminal.
   * Updates the verification flags and displays error messages if necessary.
   * @param result The result of the executed command.
   */
  @api
  handleExecuteResult(result: ExecuteResult) {
    this.showSpinner = false;
    const command = result.command;
    switch (command) {
      case COMMANDS.verifyGitIsInstalled:
        this.handleGitInstalledResult(result);
        break;
      case COMMANDS.verifySfCliIsInstalled:
        this.handleSfCliInstalledResult(result);
        break;
      case COMMANDS.verifyInCurrentGitDir:
        this.handleInGitDirResult(result);
        break;
      default:
        break;
    }
    if (this.gitInstalled && this.sfCliInstalled && this.inGitDir) {
      this.fullyVerified = true;
      this.showSpinner = false;
    }
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

  /**
   * Handles the result of the Git installation check.
   * @param result The execution result.
   */
  handleGitInstalledResult(result: ExecuteResult) {
    if (result.stdout) {
      this.gitInstalled = true;
      this.sendCommandToTerminal(COMMANDS.verifyInCurrentGitDir);
    } else {
      this.hasError = true;
      this.errorMessage = ERROR_MESSAGES.gitNotInstalled;
    }
  }

  /**
   * Handles the result of the Git repository check.
   * @param result The execution result.
   */
  handleInGitDirResult(result: ExecuteResult) {
    if (result.stdout) {
      this.inGitDir = true;
    } else {
      this.hasError = true;
      this.errorMessage = ERROR_MESSAGES.notInGitDirectory;
    }
  }

  /**
   * Handles the result of the Salesforce CLI installation check.
   * @param result The execution result.
   */
  handleSfCliInstalledResult(result: ExecuteResult) {
    if (result.stdout) {
      this.sfCliInstalled = true;
    } else {
      this.hasError = true;
      this.errorMessage = ERROR_MESSAGES.sfCliNotInstalled;
    }
  }

  /**
   * Getter to determine whether to display the "Checking Git" message.
   * @returns True if Git is being checked and not yet installed, false otherwise.
   */
  get checkingGit() {
    return this.showSpinner && !this.gitInstalled;
  }

  /**
   * Getter to determine whether to display the "Checking Git Directory" message.
   * @returns True if Git is installed and the directory check is in progress, false otherwise.
   */
  get checkingInGitDir() {
    return this.showSpinner && this.gitInstalled && !this.inGitDir;
  }

  /**
   * Getter to determine whether to display the "Checking Salesforce CLI" message.
   * @returns True if Git, Git directory checks are complete, and Salesforce CLI check is in progress, false otherwise.
   */
  get checkingSfCli() {
    return (
      this.showSpinner &&
      this.gitInstalled &&
      this.inGitDir &&
      !this.sfCliInstalled
    );
  }

  /**
   * Determines the current step of the verification process.
   * @returns The current stage of verification.
   */
  get currentStep() {
    if (this.fullyVerified) {
      return STAGES.complete;
    } else if (!this.gitInstalled) {
      return STAGES.git;
    } else if (!this.inGitDir) {
      return STAGES.gitDir;
    } else {
      return STAGES.sfCli;
    }
  }
}
