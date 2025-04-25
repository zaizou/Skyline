/**
 * This module defines a base class `CliElement` for Lightning Web Components
 * that interact with a command-line interface (CLI).  It provides a common
 * interface for handling execution results from the CLI. Components extending
 * this class should implement the `handleExecuteResult` method to process
 * the output of CLI commands.
 */

import { LightningElement, api } from "lwc";
import { ExecuteResult } from "../app/app";

export default class CliElement extends LightningElement {
  /**
   * Handles the result of a CLI command execution.
   * This method must be implemented by child components to process the result.
   * @param result The execution result from the CLI.
   * @throws {Error} Throws an error if not implemented by a child component.
   */
  @api
  handleExecuteResult(result: ExecuteResult) {
    throw new Error("Method not implemented.");
  }
}
