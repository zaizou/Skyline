import { createElement } from "lwc";
import App from "./modules/default/app/app";

document.addEventListener("DOMContentLoaded", () => {
  const elm = createElement("default-app", { is: App });
  document.body.appendChild(elm);
});
