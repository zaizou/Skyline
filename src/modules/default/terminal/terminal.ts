/**
 * This component implements a simple terminal emulator within the application.
 * It allows users to enter and execute commands, displaying the standard output (stdout)
 * and standard error (stderr) from the executed commands. It leverages the `CliElement`
 * base class for handling command execution results.
 */
import { ExecuteResult } from "../app/app";
import { track, api } from "lwc";
import App from "../app/app";
import CliElement from "../cliElement/cliElement";

/**
 * A constant string identifier for this component. Used for message targeting.
 */
const ELEMENT_IDENTIFIER = "terminal";

export default class Terminal extends CliElement {
  @track stdout?: String;
  @track stderr?: String;
  commandToExecute = "";

  /**
   * Handles the execution result from a CLI command.
   * Updates the stdout and stderr properties with the received result.
   * @param result The execution result from the CLI, containing stdout and stderr.
   */
  @api
  handleExecuteResult(result: ExecuteResult) {
    this.stdout = result.stdout;
    this.stderr = result.stderr;
  }

  /**
   * Sends a command to the application's main process for execution.
   * @param command The CLI command string to execute.
   */
  sendCommand(command: string) {
    App.sendCommandToTerminal(command);
  }

  /**
   * Handles changes to the input field, updating the commandToExecute property.
   * @param event The input change event.
   */
  handleInputChange(event: CustomEvent) {
    this.commandToExecute = (event.target as HTMLInputElement).value;
  }

  /**
   * Executes the command currently entered in the input field.
   * Sends the command to the application's main process, specifying this component
   * as the target for the execution result.
   */
  executeCommand() {
    App.sendCommandToTerminal(this.commandToExecute, ELEMENT_IDENTIFIER);
  }
}
