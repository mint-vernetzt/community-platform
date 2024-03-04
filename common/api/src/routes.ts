/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import {
  Controller,
  ValidationService,
  FieldErrors,
  ValidateError,
  TsoaRoute,
  HttpStatusCodeLiteral,
  TsoaResponse,
  fetchMiddlewares,
} from "@tsoa/runtime";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProjectController } from "./projects/single-project-controller";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProjectsController } from "./projects/projects-controller";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProfileController } from "./profiles/single-profile-controller";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProfilesController } from "./profiles/profiles-controller";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OrganizationController } from "./organizations/single-organization-controller";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OrganizationsController } from "./organizations/organizations-controller";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EventController } from "./events/single-event-controller";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EventsController } from "./events/events-controller";
import { expressAuthentication } from "./authentication";
// @ts-ignore - no great way to install types from subpackage
import type { RequestHandler, Router } from "express";

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
  FieldErrors: {
    dataType: "refObject",
    properties: {},
    additionalProperties: {
      dataType: "nestedObjectLiteral",
      nestedProperties: {
        value: { dataType: "any" },
        message: { dataType: "string", required: true },
      },
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  "Pick_ValidateError.status-or-message-or-fields_": {
    dataType: "refAlias",
    type: {
      dataType: "nestedObjectLiteral",
      nestedProperties: {
        status: { dataType: "double", required: true },
        message: { dataType: "string", required: true },
        fields: { ref: "FieldErrors", required: true },
      },
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  "Pick_Error.message_": {
    dataType: "refAlias",
    type: {
      dataType: "nestedObjectLiteral",
      nestedProperties: { message: { dataType: "string", required: true } },
      validators: {},
    },
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const validationService = new ValidationService(models);

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: Router) {
  // ###########################################################################################################
  //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
  //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
  // ###########################################################################################################
  app.get(
    "/project/:slug",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(ProjectController),
    ...fetchMiddlewares<RequestHandler>(ProjectController.prototype.getProject),

    function ProjectController_getProject(
      request: any,
      response: any,
      next: any
    ) {
      const args = {
        request: {
          in: "request",
          name: "request",
          required: true,
          dataType: "object",
        },
        slug: { in: "path", name: "slug", required: true, dataType: "string" },
      };

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request, response);

        const controller = new ProjectController();

        const promise = controller.getProject.apply(
          controller,
          validatedArgs as any
        );
        promiseHandler(controller, promise, response, undefined, next);
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/projects",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(ProjectsController),
    ...fetchMiddlewares<RequestHandler>(
      ProjectsController.prototype.getAllProjects
    ),

    function ProjectsController_getAllProjects(
      request: any,
      response: any,
      next: any
    ) {
      const args = {
        skip: { in: "query", name: "skip", required: true, dataType: "double" },
        take: { in: "query", name: "take", required: true, dataType: "double" },
        request: {
          in: "request",
          name: "request",
          required: true,
          dataType: "object",
        },
        badRequestResponse: {
          in: "res",
          name: "400",
          required: true,
          dataType: "nestedObjectLiteral",
          nestedProperties: {
            status: { dataType: "enum", enums: [400], required: true },
            message: {
              dataType: "enum",
              enums: ["Parameter out of range"],
              required: true,
            },
            fields: {
              dataType: "nestedObjectLiteral",
              nestedProperties: {
                take: {
                  dataType: "nestedObjectLiteral",
                  nestedProperties: {
                    message: {
                      dataType: "enum",
                      enums: ["A take parameter larger than 50 is not allowed"],
                      required: true,
                    },
                  },
                  required: true,
                },
              },
              required: true,
            },
          },
        },
      };

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request, response);

        const controller = new ProjectsController();

        const promise = controller.getAllProjects.apply(
          controller,
          validatedArgs as any
        );
        promiseHandler(controller, promise, response, undefined, next);
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/profile/:username",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(ProfileController),
    ...fetchMiddlewares<RequestHandler>(ProfileController.prototype.getProfile),

    function ProfileController_getProfile(
      request: any,
      response: any,
      next: any
    ) {
      const args = {
        request: {
          in: "request",
          name: "request",
          required: true,
          dataType: "object",
        },
        username: {
          in: "path",
          name: "username",
          required: true,
          dataType: "string",
        },
      };

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request, response);

        const controller = new ProfileController();

        const promise = controller.getProfile.apply(
          controller,
          validatedArgs as any
        );
        promiseHandler(controller, promise, response, undefined, next);
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/profiles",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(ProfilesController),
    ...fetchMiddlewares<RequestHandler>(
      ProfilesController.prototype.getAllEvents
    ),

    function ProfilesController_getAllEvents(
      request: any,
      response: any,
      next: any
    ) {
      const args = {
        skip: { in: "query", name: "skip", required: true, dataType: "double" },
        take: { in: "query", name: "take", required: true, dataType: "double" },
        request: {
          in: "request",
          name: "request",
          required: true,
          dataType: "object",
        },
        badRequestResponse: {
          in: "res",
          name: "400",
          required: true,
          dataType: "nestedObjectLiteral",
          nestedProperties: {
            status: { dataType: "enum", enums: [400], required: true },
            message: {
              dataType: "enum",
              enums: ["Parameter out of range"],
              required: true,
            },
            fields: {
              dataType: "nestedObjectLiteral",
              nestedProperties: {
                take: {
                  dataType: "nestedObjectLiteral",
                  nestedProperties: {
                    message: {
                      dataType: "enum",
                      enums: ["A take parameter larger than 50 is not allowed"],
                      required: true,
                    },
                  },
                  required: true,
                },
              },
              required: true,
            },
          },
        },
      };

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request, response);

        const controller = new ProfilesController();

        const promise = controller.getAllEvents.apply(
          controller,
          validatedArgs as any
        );
        promiseHandler(controller, promise, response, undefined, next);
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/organization/:slug",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(OrganizationController),
    ...fetchMiddlewares<RequestHandler>(
      OrganizationController.prototype.getOrganization
    ),

    function OrganizationController_getOrganization(
      request: any,
      response: any,
      next: any
    ) {
      const args = {
        request: {
          in: "request",
          name: "request",
          required: true,
          dataType: "object",
        },
        slug: { in: "path", name: "slug", required: true, dataType: "string" },
      };

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request, response);

        const controller = new OrganizationController();

        const promise = controller.getOrganization.apply(
          controller,
          validatedArgs as any
        );
        promiseHandler(controller, promise, response, undefined, next);
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/organizations",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(OrganizationsController),
    ...fetchMiddlewares<RequestHandler>(
      OrganizationsController.prototype.getAllOrganizations
    ),

    function OrganizationsController_getAllOrganizations(
      request: any,
      response: any,
      next: any
    ) {
      const args = {
        skip: { in: "query", name: "skip", required: true, dataType: "double" },
        take: { in: "query", name: "take", required: true, dataType: "double" },
        request: {
          in: "request",
          name: "request",
          required: true,
          dataType: "object",
        },
        badRequestResponse: {
          in: "res",
          name: "400",
          required: true,
          dataType: "nestedObjectLiteral",
          nestedProperties: {
            status: { dataType: "enum", enums: [400], required: true },
            message: {
              dataType: "enum",
              enums: ["Parameter out of range"],
              required: true,
            },
            fields: {
              dataType: "nestedObjectLiteral",
              nestedProperties: {
                take: {
                  dataType: "nestedObjectLiteral",
                  nestedProperties: {
                    message: {
                      dataType: "enum",
                      enums: ["A take parameter larger than 50 is not allowed"],
                      required: true,
                    },
                  },
                  required: true,
                },
              },
              required: true,
            },
          },
        },
      };

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request, response);

        const controller = new OrganizationsController();

        const promise = controller.getAllOrganizations.apply(
          controller,
          validatedArgs as any
        );
        promiseHandler(controller, promise, response, undefined, next);
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/event/:slug",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(EventController),
    ...fetchMiddlewares<RequestHandler>(EventController.prototype.getEvent),

    function EventController_getEvent(request: any, response: any, next: any) {
      const args = {
        request: {
          in: "request",
          name: "request",
          required: true,
          dataType: "object",
        },
        slug: { in: "path", name: "slug", required: true, dataType: "string" },
      };

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request, response);

        const controller = new EventController();

        const promise = controller.getEvent.apply(
          controller,
          validatedArgs as any
        );
        promiseHandler(controller, promise, response, undefined, next);
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  app.get(
    "/events",
    authenticateMiddleware([{ api_key: [] }]),
    ...fetchMiddlewares<RequestHandler>(EventsController),
    ...fetchMiddlewares<RequestHandler>(
      EventsController.prototype.getAllEvents
    ),

    function EventsController_getAllEvents(
      request: any,
      response: any,
      next: any
    ) {
      const args = {
        skip: { in: "query", name: "skip", required: true, dataType: "double" },
        take: { in: "query", name: "take", required: true, dataType: "double" },
        request: {
          in: "request",
          name: "request",
          required: true,
          dataType: "object",
        },
        badRequestResponse: {
          in: "res",
          name: "400",
          required: true,
          dataType: "nestedObjectLiteral",
          nestedProperties: {
            status: { dataType: "enum", enums: [400], required: true },
            message: {
              dataType: "enum",
              enums: ["Parameter out of range"],
              required: true,
            },
            fields: {
              dataType: "nestedObjectLiteral",
              nestedProperties: {
                take: {
                  dataType: "nestedObjectLiteral",
                  nestedProperties: {
                    message: {
                      dataType: "enum",
                      enums: ["A take parameter larger than 50 is not allowed"],
                      required: true,
                    },
                  },
                  required: true,
                },
              },
              required: true,
            },
          },
        },
      };

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = getValidatedArgs(args, request, response);

        const controller = new EventsController();

        const promise = controller.getAllEvents.apply(
          controller,
          validatedArgs as any
        );
        promiseHandler(controller, promise, response, undefined, next);
      } catch (err) {
        return next(err);
      }
    }
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
    return async function runAuthenticationMiddleware(
      request: any,
      _response: any,
      next: any
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      // keep track of failed auth attempts so we can hand back the most
      // recent one.  This behavior was previously existing so preserving it
      // here
      const failedAttempts: any[] = [];
      const pushAndRethrow = (error: any) => {
        failedAttempts.push(error);
        throw error;
      };

      const secMethodOrPromises: Promise<any>[] = [];
      for (const secMethod of security) {
        if (Object.keys(secMethod).length > 1) {
          const secMethodAndPromises: Promise<any>[] = [];

          for (const name in secMethod) {
            secMethodAndPromises.push(
              expressAuthentication(request, name, secMethod[name]).catch(
                pushAndRethrow
              )
            );
          }

          // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

          secMethodOrPromises.push(
            Promise.all(secMethodAndPromises).then((users) => {
              return users[0];
            })
          );
        } else {
          for (const name in secMethod) {
            secMethodOrPromises.push(
              expressAuthentication(request, name, secMethod[name]).catch(
                pushAndRethrow
              )
            );
          }
        }
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      try {
        request["user"] = await Promise.any(secMethodOrPromises);
        next();
      } catch (err) {
        // Show most recent error as response
        const error = failedAttempts.pop();
        error.status = error.status || 401;
        next(error);
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    };
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function isController(object: any): object is Controller {
    return (
      "getHeaders" in object && "getStatus" in object && "setStatus" in object
    );
  }

  function promiseHandler(
    controllerObj: any,
    promise: any,
    response: any,
    successStatus: any,
    next: any
  ) {
    return Promise.resolve(promise)
      .then((data: any) => {
        let statusCode = successStatus;
        let headers;
        if (isController(controllerObj)) {
          headers = controllerObj.getHeaders();
          statusCode = controllerObj.getStatus() || statusCode;
        }

        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

        returnHandler(response, statusCode, data, headers);
      })
      .catch((error: any) => next(error));
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function returnHandler(
    response: any,
    statusCode?: number,
    data?: any,
    headers: any = {}
  ) {
    if (response.headersSent) {
      return;
    }
    Object.keys(headers).forEach((name: string) => {
      response.set(name, headers[name]);
    });
    if (
      data &&
      typeof data.pipe === "function" &&
      data.readable &&
      typeof data._read === "function"
    ) {
      response.status(statusCode || 200);
      data.pipe(response);
    } else if (data !== null && data !== undefined) {
      response.status(statusCode || 200).json(data);
    } else {
      response.status(statusCode || 204).end();
    }
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function responder(
    response: any
  ): TsoaResponse<HttpStatusCodeLiteral, unknown> {
    return function (status, data, headers) {
      returnHandler(response, status, data, headers);
    };
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function getValidatedArgs(args: any, request: any, response: any): any[] {
    const fieldErrors: FieldErrors = {};
    const values = Object.keys(args).map((key) => {
      const name = args[key].name;
      switch (args[key].in) {
        case "request":
          return request;
        case "query":
          return validationService.ValidateParam(
            args[key],
            request.query[name],
            name,
            fieldErrors,
            undefined,
            { noImplicitAdditionalProperties: "throw-on-extras" }
          );
        case "queries":
          return validationService.ValidateParam(
            args[key],
            request.query,
            name,
            fieldErrors,
            undefined,
            { noImplicitAdditionalProperties: "throw-on-extras" }
          );
        case "path":
          return validationService.ValidateParam(
            args[key],
            request.params[name],
            name,
            fieldErrors,
            undefined,
            { noImplicitAdditionalProperties: "throw-on-extras" }
          );
        case "header":
          return validationService.ValidateParam(
            args[key],
            request.header(name),
            name,
            fieldErrors,
            undefined,
            { noImplicitAdditionalProperties: "throw-on-extras" }
          );
        case "body":
          return validationService.ValidateParam(
            args[key],
            request.body,
            name,
            fieldErrors,
            undefined,
            { noImplicitAdditionalProperties: "throw-on-extras" }
          );
        case "body-prop":
          return validationService.ValidateParam(
            args[key],
            request.body[name],
            name,
            fieldErrors,
            "body.",
            { noImplicitAdditionalProperties: "throw-on-extras" }
          );
        case "formData":
          if (args[key].dataType === "file") {
            return validationService.ValidateParam(
              args[key],
              request.file,
              name,
              fieldErrors,
              undefined,
              { noImplicitAdditionalProperties: "throw-on-extras" }
            );
          } else if (
            args[key].dataType === "array" &&
            args[key].array.dataType === "file"
          ) {
            return validationService.ValidateParam(
              args[key],
              request.files,
              name,
              fieldErrors,
              undefined,
              { noImplicitAdditionalProperties: "throw-on-extras" }
            );
          } else {
            return validationService.ValidateParam(
              args[key],
              request.body[name],
              name,
              fieldErrors,
              undefined,
              { noImplicitAdditionalProperties: "throw-on-extras" }
            );
          }
        case "res":
          return responder(response);
      }
    });

    if (Object.keys(fieldErrors).length > 0) {
      throw new ValidateError(fieldErrors, "");
    }
    return values;
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
