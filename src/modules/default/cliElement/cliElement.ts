/**
 * This module defines a base class `CliElement` for Lightning Web Components
 * that interact with a command-line interface (CLI).  It provides a common
 * interface for handling execution results from the CLI. Components extending
 * this class should implement the `handleExecuteResult` method to process
 * the output of CLI commands.
 */

import { LightningElement, api } from "lwc";
import { ExecuteResult } from "../app/app";
import App from "../app/app";

export default class CliElement extends LightningElement {
  /**
   * Executes a command and returns a promise that resolves with the result.
   * @param command The command to execute.
   * @returns A promise that resolves with the command execution result.
   */
  async executeCommand(command: string): Promise<ExecuteResult> {
    return App.executeCommand(command);
  }

  /**
   * Checks if debug mode is enabled in configuration.
   * @returns {boolean} True if debug mode is enabled.
   */
  get isDebugMode(): boolean {
    return App.isDebugMode();
  }

  /**
   * Gets the current configuration settings.
   * @returns {any} The configuration object.
   */
  get config(): any {
    return App.getConfig();
  }
}
