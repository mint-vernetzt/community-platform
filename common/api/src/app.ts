import express, { json, urlencoded } from "express";
import { RegisterRoutes } from "../build/routes";
import swaggerUI from "swagger-ui-express";
import swaggerDocument from "../build/swagger.json";

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
