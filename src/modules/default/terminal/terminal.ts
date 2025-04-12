import { ExecuteResult } from "../app/app";
import { track, api } from "lwc";
import App from "../app/app";
import CliElement from "../cliElement/cliElement";

const ELEMENT_IDENTIFIER = "terminal";

export default class Terminal extends CliElement {
  @track stdout?: String;
  @track stderr?: String;
  commandToExecute = "";

  @api
  handleExecuteResult(result: ExecuteResult) {
    this.stdout = result.stdout;
    this.stderr = result.stderr;
  }

  sendCommand(command: string) {
    App.sendCommandToTerminal(command);
  }

  handleInputChange(event: CustomEvent) {
    this.commandToExecute = (event.target as HTMLInputElement).value;
  }

  executeCommand() {
    App.sendCommandToTerminal(this.commandToExecute, ELEMENT_IDENTIFIER);
  }
}
