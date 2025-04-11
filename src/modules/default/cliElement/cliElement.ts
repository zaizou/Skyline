import { LightningElement, api } from "lwc";
import { ExecuteResult } from "../app/app";

export default class CliElement extends LightningElement {
  @api
  handleExecuteResult(result: ExecuteResult) {
    throw new Error("Method not implemented.");
  }
}
