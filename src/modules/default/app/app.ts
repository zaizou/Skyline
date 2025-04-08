import { LightningElement } from "lwc";

export default class App extends LightningElement {
  clickCount = 0;

  handleClick() {
    this.clickCount++;
  }
}
