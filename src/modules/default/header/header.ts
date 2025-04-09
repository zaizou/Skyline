import { LightningElement, api } from "lwc";

export default class Header extends LightningElement {
  @api iconsUri = "";

  get backIcon(): string {
    return `${this.iconsUri}/utility/back.svg`;
  }

  get appIcon(): string {
    return `${this.iconsUri}/utility/builder.svg`;
  }

  get pageIcon(): string {
    return `${this.iconsUri}/utility/page.svg`;
  }

  get chevronDownIcon(): string {
    return `${this.iconsUri}/utility/chevrondown.svg`;
  }

  get settingsIcon(): string {
    return `${this.iconsUri}/utility/settings.svg`;
  }

  get helpIcon(): string {
    return `${this.iconsUri}/utility/help.svg`;
  }
}
