export {};

declare global {
  interface Window {
    _paq: string[][]; // matomo async tracker command queue
  }
}
