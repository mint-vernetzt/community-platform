/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import {
  TsoaRoute,
  fetchMiddlewares,
  ExpressTemplateService,
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
import type {
  Request as ExRequest,
  Response as ExResponse,
  RequestHandler,
  Router,
} from "express";

const expressAuthenticationRecasted = expressAuthentication as (
  req: ExRequest,
  securityName: string,
  scopes?: string[],
  res?: ExResponse
) => Promise<any>;

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
const templateService = new ExpressTemplateService(models, {
  noImplicitAdditionalProperties: "throw-on-extras",
  bodyCoercion: true,
});

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
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      const args: Record<string, TsoaRoute.ParameterSchema> = {
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
        validatedArgs = templateService.getValidatedArgs({
          args,
          request,
          response,
        });

        const controller = new ProjectController();

        templateService.apiHandler({
          methodName: "getProject",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
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
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      const args: Record<string, TsoaRoute.ParameterSchema> = {
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
        validatedArgs = templateService.getValidatedArgs({
          args,
          request,
          response,
        });

        const controller = new ProjectsController();

        templateService.apiHandler({
          methodName: "getAllProjects",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
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
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      const args: Record<string, TsoaRoute.ParameterSchema> = {
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
        validatedArgs = templateService.getValidatedArgs({
          args,
          request,
          response,
        });

        const controller = new ProfileController();

        templateService.apiHandler({
          methodName: "getProfile",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
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
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      const args: Record<string, TsoaRoute.ParameterSchema> = {
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
        validatedArgs = templateService.getValidatedArgs({
          args,
          request,
          response,
        });

        const controller = new ProfilesController();

        templateService.apiHandler({
          methodName: "getAllEvents",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
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
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      const args: Record<string, TsoaRoute.ParameterSchema> = {
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
        validatedArgs = templateService.getValidatedArgs({
          args,
          request,
          response,
        });

        const controller = new OrganizationController();

        templateService.apiHandler({
          methodName: "getOrganization",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
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
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      const args: Record<string, TsoaRoute.ParameterSchema> = {
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
        validatedArgs = templateService.getValidatedArgs({
          args,
          request,
          response,
        });

        const controller = new OrganizationsController();

        templateService.apiHandler({
          methodName: "getAllOrganizations",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
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

    function EventController_getEvent(
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      const args: Record<string, TsoaRoute.ParameterSchema> = {
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
        validatedArgs = templateService.getValidatedArgs({
          args,
          request,
          response,
        });

        const controller = new EventController();

        templateService.apiHandler({
          methodName: "getEvent",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
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
      request: ExRequest,
      response: ExResponse,
      next: any
    ) {
      const args: Record<string, TsoaRoute.ParameterSchema> = {
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
        validatedArgs = templateService.getValidatedArgs({
          args,
          request,
          response,
        });

        const controller = new EventsController();

        templateService.apiHandler({
          methodName: "getAllEvents",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
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
      response: any,
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
              expressAuthenticationRecasted(
                request,
                name,
                secMethod[name],
                response
              ).catch(pushAndRethrow)
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
              expressAuthenticationRecasted(
                request,
                name,
                secMethod[name],
                response
              ).catch(pushAndRethrow)
            );
          }
        }
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      try {
        request["user"] = await Promise.any(secMethodOrPromises);

        // Response was sent in middleware, abort
        if (response.writableEnded) {
          return;
        }

        next();
      } catch (err) {
        // Show most recent error as response
        const error = failedAttempts.pop();
        error.status = error.status || 401;

        // Response was sent in middleware, abort
        if (response.writableEnded) {
          return;
        }
        next(error);
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    };
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
