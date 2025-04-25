declare module "lightning-base-components/src/lightning/alert/alert.js" {
  export default class LightningAlert {
    /**
     * Value to use for header text in "header" variant
     * or aria-label in "headerless" variant.
     * @type {string}
     * @default "Alert" (translated accordingly)
     */
    label: string;

    /**
     * Text to display in the alert.
     */
    message: string;

    /**
     * Variant to use for alert. Valid values are
     * "header" and "headerless".
     */
    variant: "header" | "headerless";

    /**
     * Theme to use when variant is "header".
     * Valid values are "default", "shade",
     * "inverse", "alt-inverse", "success",
     * "success", "info", "warning", "error",
     * and "offline".
     */
    theme:
      | "default"
      | "shade"
      | "inverse"
      | "alt-inverse"
      | "success"
      | "info"
      | "warning"
      | "error"
      | "offline";

    /**
     * Dispatches privateclose event
     * and closes dialog
     */
    close(result: any): Promise<void>;

    /**
     * Dispatches privateclose event
     * and closes dialog
     */
    static open(options: AlertOptions): Promise<void>;
  }

  interface AlertOptions {
    message: string;
    label: string;
    theme?:
      | "default"
      | "shade"
      | "inverse"
      | "alt-inverse"
      | "success"
      | "info"
      | "warning"
      | "error"
      | "offline";
    variant?: "header" | "headerless";
  }
}
