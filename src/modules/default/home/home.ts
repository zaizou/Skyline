import { api } from "lwc";
import CLIElement from "../cliElement/cliElement";
import App from "../app/app";
import { ExecuteResult } from "../app/app";

const ERROR_MESSAGES = {
  gitNotInstalled: "Git is not installed on this machine",
  sfCliNotInstalled: "The sf CLI is not installed on this machine"
};

const COMMANDS = {
  verifyGitIsInstalled: "git --version",
  verifySfCliIsInstalled: "sf --version",
  verifyInCurrentGitDir: "git status"
};

const ELEMENT_IDENTIFIER = "home";

export default class Home extends CLIElement {
  showSpinner = false;
  gitInstalled = false;
  sfCliInstalled = false;
  inGitDir = false;
  fullyVerified = false;

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
    }
  }

  handleSfCliInstalledResult(result: ExecuteResult) {
    if (result.stdout) {
      this.sfCliInstalled = true;
    }
  }

  handleInGitDirResult(result: ExecuteResult) {
    if (result.stdout) {
      this.inGitDir = true;
    }
  }
}
