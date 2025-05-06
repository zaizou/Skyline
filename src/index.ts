/**
 * This is the entry point for the LWC application running within the VS Code webview.
 * It initializes the main application component (`s-app`) and sets up
 * message handling to receive command execution results from the VS Code extension.
 */
import "@lwc/synthetic-shadow";
import { createElement } from "lwc";
import App from "./modules/s/app/app";

// Wait for the DOM to fully load before initializing the LWC application
document.addEventListener("DOMContentLoaded", () => {
  const application = createElement("s-app", { is: App });
  document.body.appendChild(application);
});

// Listen for messages from the VS Code extension
window.addEventListener("message", (event) => {
  App.handleCommandResult(event.data);
});
