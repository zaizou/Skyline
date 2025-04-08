import { LightningElement, track } from "lwc";

export default class App extends LightningElement {
  private static instance?: App;
  private static vscode = eval("acquireVsCodeApi()");

  @track stdout?: String;
  @track stderr?: String;
  commandToExecute = "";

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
