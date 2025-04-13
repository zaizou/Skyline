import { LightningElement, track, api } from "lwc";
import { setGlobalIconsUri } from "../icons/icons";
import CLIElement from "../cliElement/cliElement";

export enum Pages {
  home = "Home",
  terminal = "Terminal",
  metadataExplorer = "Metadata Explorer"
}

export default class App extends LightningElement {
  private static instance?: App;
  private static vscode = eval("acquireVsCodeApi()");
  currentPage = Pages.home;

  @track iconsUri = "";
  renderApplication = false;

  constructor() {
    super();
    App.instance = this;
  }

  static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }

  static handleCommandResult(result: ExecuteResult) {
    const app = App.getInstance();
    if (result.elementId) {
      const element = app.template!.querySelector(
        `[data-handler="${result.elementId}"]`
      );
      (element as unknown as CLIElement).handleExecuteResult(result);
    }
  }

  static sendCommandToTerminal(command: string, elementId?: string) {
    App.vscode.postMessage({ command, elementId });
  }

  @api
  setIconsUri(iconsUri: string) {
    this.iconsUri = iconsUri;
    setGlobalIconsUri(iconsUri);
    this.renderApplication = true;
  }

  handlePageNavigation(event: CustomEvent) {
    this.currentPage = event.detail;
  }

  get showHome() {
    return this.currentPage === Pages.home;
  }

  get showTerminal() {
    return this.currentPage === Pages.terminal;
  }

  get showMetadataExplorer() {
    return this.currentPage === Pages.metadataExplorer;
  }
}

export interface ExecuteResult {
  command: string;
  stdout?: string;
  stderr?: string;
  elementId?: string;
}
