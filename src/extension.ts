import { execSync } from "child_process";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("lwc-dev.helloWorld", () => {
      // Create and show a new webview
      vscode.window.showInformationMessage("Hello World from lwc-dev!!!!!!");
      const panel = vscode.window.createWebviewPanel(
        "lwc-dev", // Identifies the type of the webview. Used internally
        "LWC Development", // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
          enableScripts: true
        }
      );
      panel.webview.html = getWebviewContent(
        panel.webview,
        context.extensionUri
      );
      panel.webview.onDidReceiveMessage(
        (message) => {
          execute(panel, message.command);
          // switch (message.command) {
          //   case "alert":
          //     vscode.window.showErrorMessage(message.text);
          //     vscode.window.showInformationMessage(message.text);
          //     return;
          // }
        },
        undefined,
        context.subscriptions
      );
    })
  );
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const distFolder = "dist";
  const scriptUri = getUri(webview, extensionUri, [distFolder, "index.js"]);
  const styleUri = getUri(webview, extensionUri, [
    distFolder,
    "assets",
    "styles",
    "salesforce-lightning-design-system.min.css"
  ]);
  return /*html */ `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>LWC Extension</title>
        <link
            rel="stylesheet"
            type="text/css"
            href=${styleUri}
        />
      </head>
      <body>
        <script src="${scriptUri}">
        </script>
      </body>
    </html>`;
}

function getUri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  pathList: string[]
) {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}

interface ExecuteResult {
  stdout?: string;
  stderr?: string;
}

function execute(panel: vscode.WebviewPanel, command: string): void {
  const result: ExecuteResult = {};
  try {
    const buffer = execSync(command);
    result.stdout = buffer.toString();
  } catch (error) {
    result.stderr = (error as Buffer).toString();
  }
  panel.webview.postMessage(result);
}
