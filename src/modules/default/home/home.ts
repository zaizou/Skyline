import { api } from "lwc";
import CLIElement from "../cliElement/cliElement";
import App from "../app/app";
import { ExecuteResult } from "../app/app";

const ERROR_MESSAGES = {
  gitNotInstalled: "Git is not installed on this machine",
  notInGitDirectory: "The current working directory is not a git repository",
  sfCliNotInstalled: "The sf CLI is not installed on this machine"
};

const COMMANDS = {
  verifyGitIsInstalled: "git --version",
  verifySfCliIsInstalled: "sf --version",
  verifyInCurrentGitDir: "git status"
};

enum STAGES {
  git = "git",
  gitDir = "gitDir",
  sfCli = "sfCli",
  complete = "complete"
}

const ELEMENT_IDENTIFIER = "home";

export default class Home extends CLIElement {
  showSpinner = false;
  gitInstalled = false;
  sfCliInstalled = false;
  inGitDir = false;
  fullyVerified = false;
  hasError = false;
  errorMessage?: String;

  connectedCallback(): void {
    this.showSpinner = true;
    App.sendCommandToTerminal(
      COMMANDS.verifyGitIsInstalled,
      ELEMENT_IDENTIFIER
    );
    App.sendCommandToTerminal(
      COMMANDS.verifySfCliIsInstalled,
      ELEMENT_IDENTIFIER
    );
  }

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

  handleGitInstalledResult(result: ExecuteResult) {
    if (result.stdout) {
      this.gitInstalled = true;
      App.sendCommandToTerminal(
        COMMANDS.verifyInCurrentGitDir,
        ELEMENT_IDENTIFIER
      );
    } else {
      this.hasError = true;
      this.errorMessage = ERROR_MESSAGES.gitNotInstalled;
    }
  }

  handleInGitDirResult(result: ExecuteResult) {
    if (result.stdout) {
      this.inGitDir = true;
    } else {
      this.hasError = true;
      this.errorMessage = ERROR_MESSAGES.notInGitDirectory;
    }
  }

  handleSfCliInstalledResult(result: ExecuteResult) {
    if (result.stdout) {
      this.sfCliInstalled = true;
    } else {
      this.hasError = true;
      this.errorMessage = ERROR_MESSAGES.sfCliNotInstalled;
    }
  }

  get checkingGit() {
    return this.showSpinner && !this.gitInstalled;
  }

  get checkingInGitDir() {
    return this.showSpinner && this.gitInstalled && !this.inGitDir;
  }

  get checkingSfCli() {
    return (
      this.showSpinner &&
      this.gitInstalled &&
      this.inGitDir &&
      !this.sfCliInstalled
    );
  }

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
