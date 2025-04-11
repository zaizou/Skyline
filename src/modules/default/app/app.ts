import { LightningElement, track, api } from "lwc";
import { setGlobalIconsUri } from "../icons/icons";
import CLIElement from "../cliElement/cliElement";

export default class App extends LightningElement {
  private static instance?: App;
  private static vscode = eval("acquireVsCodeApi()");

  @track stdout?: String;
  @track stderr?: String;
  @track iconsUri = "";
  commandToExecute = "";
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
    app.stdout = result.stdout;
    app.stderr = result.stderr;
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

  sendCommand(command: string) {
    App.sendCommandToTerminal(command);
  }

  handleInputChange(event: CustomEvent) {
    this.commandToExecute = (event.target as HTMLInputElement).value;
  }

  executeCommand() {
    this.sendCommand(this.commandToExecute);
  }
}
export interface ExecuteResult {
  command: string;
  stdout?: string;
  stderr?: string;
  elementId?: string;
}
