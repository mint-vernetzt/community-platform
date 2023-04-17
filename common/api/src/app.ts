import express, { json, urlencoded } from "express";
import type {
  Response as ExResponse,
  Request as ExRequest,
  NextFunction,
} from "express";
import { RegisterRoutes } from "../build/routes";
import swaggerUI from "swagger-ui-express";
import swaggerDocument from "../build/swagger.json";
import { ValidateError } from "tsoa";

export const app = express();

// Use body parser to read sent json payloads
app.use(
  urlencoded({
    extended: true,
  })
);
app.use(json());
app.use(
  "/docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerDocument, { explorer: true })
);

RegisterRoutes(app);

// Global express error handler (see https://tsoa-community.github.io/docs/error-handling.html)
app.use(function errorHandler(
  err: unknown,
  req: ExRequest,
  res: ExResponse,
  next: NextFunction
): ExResponse | void {
  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
    return res.status(422).json({
      message: "Validation Failed",
      details: err?.fields,
    });
  }
  if (err instanceof Error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }

  next();
});
