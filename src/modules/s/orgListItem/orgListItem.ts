import { LightningElement, api } from "lwc";
import type { OrgInfo } from "../orgManager/orgManager";

export default class OrgListItem extends LightningElement {
  @api org!: OrgInfo;
  @api isLoading = false;
  @api showExpiration = false;

  handleRemoveOrg(event: CustomEvent) {
    const removeEvent = new CustomEvent("removeorg", {
      detail: this.org.alias,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(removeEvent);
  }

  handleOpenOrg(event: CustomEvent) {
    const openEvent = new CustomEvent("openorg", {
      detail: this.org.alias,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(openEvent);
  }
}
