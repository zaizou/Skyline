declare module "lightning-base-components/src/lightning/toast/toast.js" {
  export interface ToastOptions {
    label: string;
    message: string;
    labelLinks?: { url: string; label: string }[];
    messageLinks?: { [key: string]: { url: string; label: string } };
    mode?: "dismissible" | "sticky";
    variant?: "info" | "warning" | "success" | "error";
  }

  export default class Toast {
    static show(toastOptions: ToastOptions, element: any): void;
  }
}
