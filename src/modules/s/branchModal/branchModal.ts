import { LightningElement, api } from "lwc";

export default class BranchModal extends LightningElement {
  @api availableBranches: string[] = [];
  @api existingBranches: string[] = [];
  selectedBranch?: string;

  handleBranchSelect(event: CustomEvent) {
    this.selectedBranch = event.detail.value;
  }

  handleCancel() {
    this.dispatchEvent(new CustomEvent("cancel"));
  }

  handleSave() {
    if (!this.selectedBranch) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("save", {
        detail: { branch: this.selectedBranch }
      })
    );
  }

  get branchOptions() {
    return this.availableBranches
      .filter((branch) => !this.existingBranches.includes(branch))
      .map((branch) => ({
        label: branch,
        value: branch
      }));
  }
}
