import "react-router";
declare module "react-router" {
  interface AppLoadContext {
    nonce: `${string}-${string}-${string}-${string}-${string}`;
  }
}
