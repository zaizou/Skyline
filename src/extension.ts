/**
 * This is the VS Code extension's main entry point.
 * It registers a command that creates a webview panel displaying the LWC application.
 * The extension handles messages from the webview, executing commands and sending
 * the results back to the webview.
 */
import { exec } from "child_process";
import * as vscode from "vscode";

/**
 * Activates the extension. Registers the "lwc-dev.helloWorld" command.
 * @param context The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("lwc-dev.helloWorld", () => {
      const panel = vscode.window.createWebviewPanel(
        "lwc-dev", // Identifies the type of the webview. Used internally
        "LWC Development", // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
          enableScripts: true,
          retainContextWhenHidden: true
        }
      );
      panel.webview.html = getWebviewContent(
        panel.webview,
        context.extensionUri
      );
      panel.webview.onDidReceiveMessage(
        (message) => {
          execute(panel, message.command, message.elementId);
        },
        undefined,
        context.subscriptions
      );
    })
  );
}

/**
 * Generates the HTML content for the webview.
 * @param webview The webview instance.
 * @param extensionUri The URI of the extension.
 * @returns The HTML content string.
 */
function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const distFolder = "dist";
  const scriptUri = getUri(webview, extensionUri, [distFolder, "index.js"]);
  const styleUri = getUri(webview, extensionUri, [
    distFolder,
    "assets",
    "styles",
    "salesforce-lightning-design-system.min.css"
  ]);
  const iconUri = getUri(webview, extensionUri, [
    distFolder,
    "assets",
    "icons"
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
        <link
            rel="icons"
            href=${iconUri}
        />
      </head>
      <body>
        <script src="${scriptUri}">
        </script>
      </body>
    </html>`;
}

/**
 * Constructs a webview URI for a given file path.
 * @param webview The webview instance.
 * @param extensionUri The URI of the extension.
 * @param pathList The path segments of the file.
 * @returns The webview URI.
 */
function getUri(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  pathList: string[]
) {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}

/**
 * Executes a command and sends the result back to the webview.
 * @param panel The webview panel.
 * @param command The command to execute.
 * @param elementId The ID of the element that initiated the command.
 */
function execute(
  panel: vscode.WebviewPanel,
  command: string,
  elementId?: string
): void {
  const result: ExecuteResult = {
    command,
    elementId
  };
  exec(command, (error, stdout, stderr) => {
    if (error) {
      result.stderr = stderr;
    } else {
      result.stdout = stdout;
    }
    panel.webview.postMessage(result);
  });
}

/**
 * Interface representing the result of a command execution.
 */
interface ExecuteResult {
  command: string;
  stdout?: string;
  stderr?: string;
  elementId?: string;
}
