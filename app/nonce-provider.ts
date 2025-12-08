import { createContext, useContext } from "react";

// Inspired by epic-stack: https://github.com/epicweb-dev/epic-stack/blob/main/app/utils/nonce-provider.ts
const NonceContext = createContext<string>("");
export const NonceProvider = NonceContext.Provider;
export const useNonce = () => useContext(NonceContext);
