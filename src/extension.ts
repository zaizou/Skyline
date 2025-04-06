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
          enableScripts: true,
        }
      );
      panel.webview.html = getWebviewContent(
        panel.webview,
        context.extensionUri
      );
    })
  );
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const scriptUri = getUri(webview, extensionUri, ["dist", "index.js"]);
  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Cat Coding</title>
      </head>
      <body>
        <p>Hello there!</p>
        <p>scriptUri : ${scriptUri}</p>
        <p>extensionUri : ${extensionUri}</p>
        <h1 id="lines-of-code-counter">0</h1>
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
