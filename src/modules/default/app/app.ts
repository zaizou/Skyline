import { LightningElement, track, api } from "lwc";
import { setGlobalIconsUri } from "../icons/icons";

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
    App.getInstance().stdout = result.stdout;
    App.getInstance().stderr = result.stderr;
  }

  static sendCommandToTerminal(command: string) {
    App.vscode.postMessage({ command });
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
interface ExecuteResult {
  stdout?: string;
  stderr?: string;
}
