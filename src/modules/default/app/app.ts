import { LightningElement, track, api } from "lwc";
import { setGlobalIconsUri } from "../icons/icons";
import CLIElement from "../cliElement/cliElement";

export default class App extends LightningElement {
  private static instance?: App;
  private static vscode = eval("acquireVsCodeApi()");

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

  @api
  setIconsUri(iconsUri: string) {
    this.iconsUri = iconsUri;
    setGlobalIconsUri(iconsUri);
    this.renderApplication = true;
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
}
export interface ExecuteResult {
  command: string;
  stdout?: string;
  stderr?: string;
  elementId?: string;
}
