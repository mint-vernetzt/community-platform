import { createCookieSessionStorage } from "remix";
import { Authenticator } from "remix-auth";

export const SESSION_NAME = "sb";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: SESSION_NAME,
  },
});

export const authenticator = new Authenticator(sessionStorage);
