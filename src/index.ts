import { createElement } from "lwc";
import App from "./modules/default/app/app";

document.addEventListener("DOMContentLoaded", () => {
  const newParagraph = document.createElement("p");

  newParagraph.textContent =
    "This is a new paragraph dynamically added to the page.";

  document.body.appendChild(newParagraph);

  const elm = createElement("default-app", { is: App });
  document.body.appendChild(elm);
});
