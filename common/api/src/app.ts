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
import matomoMiddleware from "./middlewares/express-matomo-middleware";

export const app = express();

app.use(
  matomoMiddleware({
    siteId: parseInt(process.env.MATOMO_SITE_ID ?? "") || 0,
    piwikUrl: `${process.env.MATOMO_URL ?? ""}piwik.php`,
    baseUrl: process.env.MATOMO_BASE_URL ?? "",
    piwikToken: process.env.MATOMO_TOKEN ?? "",
  })
);

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

// Global not found handler (see https://tsoa-community.github.io/docs/error-handling.html)
app.use(function notFoundHandler(_req, res: ExResponse) {
  res.status(404).send({
    message: "Not Found",
  });
});

// Global express error handler (see https://tsoa-community.github.io/docs/error-handling.html)
app.use(function errorHandler(
  err: unknown,
  req: ExRequest,
  res: ExResponse,
  next: NextFunction
): ExResponse | void {
  console.log(err);
  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
    if (err.fields.access_token !== undefined) {
      return res.status(401).json({
        status: 401,
        message: err.message || "Authentication Failed",
        fields: err?.fields,
      });
    } else {
      return res.status(err.status || 422).json({
        status: err.status || 422,
        message: err.message || "Validation Failed",
        fields: err?.fields,
      });
    }
  }
  if (err instanceof Error) {
    return res.status(500).json({
      status: 500,
      message: err.message || "Internal Server Error",
    });
  }

  next();
});
