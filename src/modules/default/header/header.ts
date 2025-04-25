/**
 * This component represents the header of the application. It displays the
 * application title and provides a navigation menu for switching between different
 * pages within the application. The navigation menu can be toggled on and off.
 */
import { LightningElement, api } from "lwc";
import { Pages } from "../app/app";

export default class Header extends LightningElement {
  showNavigation = false;
  pages = Object.values(Pages);
  @api
  currentPage?: Pages;

  /**
   * Handles page clicks in the navigation menu.
   * Emits a 'pagenavigation' event with the selected page value.
   * @param event The custom click event.
   */
  handlePageClick(event: CustomEvent) {
    this.showNavigation = false; // Hide navigation after click
    const value = (event.target as HTMLInputElement).dataset.page;
    this.dispatchEvent(
      new CustomEvent("pagenavigation", {
        detail: value
      })
    );
  }

  /**
   * Handles clicks on the navigation button.
   * Toggles the visibility of the navigation menu.
   */
  handleNavigationClick() {
    this.showNavigation = !this.showNavigation;
  }
}
