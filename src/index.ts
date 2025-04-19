import "@lwc/synthetic-shadow";
import { createElement } from "lwc";
import App from "./modules/default/app/app";

document.addEventListener("DOMContentLoaded", () => {
  const application = createElement("default-app", { is: App });
  document.body.appendChild(application);
});

window.addEventListener("message", (event) => {
  App.handleCommandResult(event.data);
});
