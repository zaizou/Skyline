/**
 * This module defines the main application component and related types.
 * It manages the application state, including the current page,
 * and handles communication with the VS Code extension through message passing.
 * It also provides a mechanism for dispatching command execution results
 * to the appropriate child components.
 */

import { LightningElement } from "lwc";
import CLIElement from "../cliElement/cliElement";

/**
 * Enum representing the different pages within the application.
 */
export enum Pages {
  home = "Home",
  repoConfig = "Project Configuration",
  metadataExplorer = "Metadata Explorer"
}

/**
 * Interface representing the result of a command execution.
 */
export interface ExecuteResult {
  command: string;
  stdout?: string;
  stderr?: string;
  elementId?: string;
  errorCode?: number;
}

/**
 * The main application component. Manages the application state and handles
 * communication with the VS Code extension.
 */
export default class App extends LightningElement {
  private static instance?: App;
  private static vscode = eval("acquireVsCodeApi()");
  currentPage = Pages.home;

  /**
   * Constructor for the App component. Sets the singleton instance.
   */
  constructor() {
    super();
    App.instance = this;
  }

  /**
   * Retrieves the singleton instance of the App component.
   * @returns The singleton instance.
   */
  static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }

  /**
   * Handles command results received from the VS Code extension.
   * Dispatches the result to the appropriate child component based on the elementId.
   * @param result The command execution result.
   */
  static handleCommandResult(result: ExecuteResult) {
    const app = App.getInstance();
    if (result.elementId) {
      const element = app.template!.querySelector(
        `[data-handler="${result.elementId}"]`
      );
      (element as unknown as CLIElement).handleExecuteResult(result);
    }
  }

  /**
   * Sends a command to the VS Code extension for execution.
   * @param command The command to execute.
   * @param elementId The ID of the component that initiated the command.
   */
  static sendCommandToTerminal(command: string, elementId?: string) {
    App.vscode.postMessage({ command, elementId });
  }

  /**
   * Handles page navigation events.
   * Updates the current page based on the event detail.
   * @param event The page navigation event.
   */
  handlePageNavigation(event: CustomEvent) {
    this.currentPage = event.detail;
  }

  /**
   * Getter to determine if the Home page should be displayed.
   * @returns True if the current page is Home, false otherwise.
   */
  get showHome() {
    return this.currentPage === Pages.home;
  }

  /**
   * Getter to determine if the Metadata Explorer page should be displayed.
   * @returns True if the current page is Metadata Explorer, false otherwise.
   */
  get showMetadataExplorer() {
    return this.currentPage === Pages.metadataExplorer;
  }

  /**
   * Getter to determine if the Repo Config page should be displayed.
   * @returns True if the current page is Repo Config, false otherwise.
   */
  get showRepoConfig() {
    return this.currentPage === Pages.repoConfig;
  }
}
