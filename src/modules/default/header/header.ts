import { LightningElement, api } from "lwc";
import { Pages } from "../app/app";

export default class Header extends LightningElement {
  showNavigation = false;
  pages = Object.values(Pages);
  @api
  currentPage?: Pages;

  handlePageClick(event: CustomEvent) {
    this.showNavigation = false;
    const value = (event.target as HTMLInputElement).dataset.page;
    this.dispatchEvent(
      new CustomEvent("pagenavigation", {
        detail: value
      })
    );
  }

  handleNavigationClick() {
    this.showNavigation = !this.showNavigation;
  }
}
