import { LightningElement, track } from "lwc";

export default class App extends LightningElement {
  private static instance?: App;
  private static vscode = eval("acquireVsCodeApi()");
  clickCount = 0;
  commandToExecute = "";
  @track stdout?: String;
  @track stderr?: String;

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

  sendCommand(command: string) {
    App.vscode.postMessage({ command });
  }

  handleInputChange(event: CustomEvent) {
    console.log({ value: (event.target as HTMLInputElement).value });
    this.commandToExecute = (event.target as HTMLInputElement).value;
  }

  executeCommand() {
    console.log({ commandToExecute: this.commandToExecute });

    this.sendCommand(this.commandToExecute);
  }

  static handleCommandResult(result: ExecuteResult) {
    console.log({ result: result });
    App.getInstance().stdout = result.stdout;
    App.getInstance().stderr = result.stderr;
  }

  handleClick() {
    this.clickCount++;
  }
}
interface ExecuteResult {
  stdout?: string;
  stderr?: string;
}
