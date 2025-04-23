declare module "lightning-base-components/src/lightning/toast/toast.js" {
  export interface ToastOptions {
    label: string;
    labelLinks?: { url: string; label: string }[];
    message: string;
    messageLinks?: { [key: string]: { url: string; label: string } };
    mode?: string;
    variant?: string;
  }

  export default class Toast {
    static show(toastOptions: ToastOptions, element: any): void;
  }
}
