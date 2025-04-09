import "@lwc/synthetic-shadow";
import { createElement } from "lwc";
import App from "./modules/default/app/app";

document.addEventListener("DOMContentLoaded", () => {
  document.body.appendChild(createElement("default-app", { is: App }));
});

window.addEventListener("message", (event) => {
  App.handleCommandResult(event.data);
});
