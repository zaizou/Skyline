import "@lwc/synthetic-shadow";
import { createElement } from "lwc";
import App from "./modules/default/app/app";

document.addEventListener("DOMContentLoaded", () => {
  const application = createElement("default-app", { is: App });
  document.body.appendChild(application);

  const appElement = document.querySelector("default-app");
  const iconsUri = document
    .querySelector('link[rel="icons"]')
    ?.getAttribute("href");

  (appElement as unknown as App).setIconsUri(iconsUri || "");
});

window.addEventListener("message", (event) => {
  App.handleCommandResult(event.data);
});
