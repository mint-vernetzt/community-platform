import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("./routes/index.tsx"),
  route("*", "./routes/$.tsx"),
  route("/robots.txt", "./routes/robots.txt.tsx"),
  route("/status", "./routes/status.tsx"),
  route("/resources", "./routes/resources.tsx"),
  route("/imprint", "./routes/imprint.tsx"),
  route("/privacy-policy", "./routes/privacy-policy.tsx"),
  route("/terms-of-use", "./routes/terms-of-use.tsx"),
  route("/help", "./routes/help.tsx"),
  route("/goodbye", "./routes/goodbye.tsx"),
  route("/error", "./routes/error.tsx"),
  route("/dashboard", "./routes/dashboard.tsx"),
  route("/csp-reports", "./routes/csp-reports.ts"),
  route("/accept-terms", "./routes/accept-terms.tsx"),
  route("/accessibility-statement", "./routes/accessibility-statement.tsx"),
  route("/reset", "./routes/reset/index.tsx"),
  route("/reset/set-password", "./routes/reset/set-password.tsx"),
  route("/register", "./routes/register/index.tsx"),
  route("/project/create", "./routes/project/create.tsx"),
  route("/project/:slug", "./routes/project/$slug/index.tsx"),
  route("/project/:slug/detail", "./routes/project/$slug/detail.tsx", [
    index("./routes/project/$slug/detail/index.tsx"),
    route(
      "/project/:slug/detail/about",
      "./routes/project/$slug/detail/about.tsx"
    ),
    route(
      "/project/:slug/detail/attachments",
      "./routes/project/$slug/detail/attachments.tsx",
      [
        route(
          "/project/:slug/detail/attachments/download",
          "./routes/project/$slug/detail/attachments/download.tsx"
        ),
      ]
    ),
    route(
      "/project/:slug/detail/requirements",
      "./routes/project/$slug/detail/requirements.tsx"
    ),
  ]),
  route("/project/:slug/settings", "./routes/project/$slug/settings.tsx", [
    index("./routes/project/$slug/settings/index.tsx"),
    route(
      "/project/:slug/settings/admins",
      "./routes/project/$slug/settings/admins.tsx"
    ),
    route(
      "/project/:slug/settings/attachments",
      "./routes/project/$slug/settings/attachments.tsx",
      [
        route(
          "/project/:slug/settings/attachments/download",
          "./routes/project/$slug/settings/attachments/download.tsx"
        ),
      ]
    ),
    route(
      "/project/:slug/settings/danger-zone",
      "./routes/project/$slug/settings/danger-zone.tsx",
      [
        index("./routes/project/$slug/settings/danger-zone/index.tsx"),
        route(
          "/project/:slug/settings/danger-zone/change-url",
          "./routes/project/$slug/settings/danger-zone/change-url.tsx"
        ),
        route(
          "/project/:slug/settings/danger-zone/delete",
          "./routes/project/$slug/settings/danger-zone/delete.tsx"
        ),
      ]
    ),
    route(
      "/project/:slug/settings/details",
      "./routes/project/$slug/settings/details.tsx"
    ),
    route(
      "/project/:slug/settings/general",
      "./routes/project/$slug/settings/general.tsx"
    ),
    route(
      "/project/:slug/settings/requirements",
      "./routes/project/$slug/settings/requirements.tsx"
    ),
    route(
      "/project/:slug/settings/responsible-orgs",
      "./routes/project/$slug/settings/responsible-orgs.tsx"
    ),
    route(
      "/project/:slug/settings/team",
      "./routes/project/$slug/settings/team.tsx"
    ),
    route(
      "/project/:slug/settings/web-social",
      "./routes/project/$slug/settings/web-social.tsx"
    ),
  ]),
  route("/profile/:username", "./routes/profile/$username/index.tsx"),
  route(
    "/profile/:username/settings",
    "./routes/profile/$username/settings.tsx",
    [
      index("./routes/profile/$username/settings/index.tsx"),
      route(
        "/profile/:username/settings/delete",
        "./routes/profile/$username/settings/delete.tsx"
      ),
      route(
        "/profile/:username/settings/general",
        "./routes/profile/$username/settings/general.tsx"
      ),
      route(
        "/profile/:username/settings/notifications",
        "./routes/profile/$username/settings/notifications.tsx"
      ),
      route(
        "/profile/:username/settings/security",
        "./routes/profile/$username/settings/security.tsx"
      ),
    ]
  ),
  route("/organization/create", "./routes/organization/create.tsx"),
  route("/organization/:slug", "./routes/organization/$slug/index.tsx"),
  route(
    "/organization/:slug/detail",
    "./routes/organization/$slug/detail.tsx",
    [
      index("./routes/organization/$slug/detail/index.tsx"),
      route(
        "/organization/:slug/detail/about",
        "./routes/organization/$slug/detail/about.tsx"
      ),
      route(
        "/organization/:slug/detail/events",
        "./routes/organization/$slug/detail/events.tsx"
      ),
      route(
        "/organization/:slug/detail/network",
        "./routes/organization/$slug/detail/network.tsx"
      ),
      route(
        "/organization/:slug/detail/projects",
        "./routes/organization/$slug/detail/projects.tsx"
      ),
      route(
        "/organization/:slug/detail/team",
        "./routes/organization/$slug/detail/team.tsx"
      ),
    ]
  ),
  route(
    "/organization/:slug/settings",
    "./routes/organization/$slug/settings.tsx",
    [
      index("./routes/organization/$slug/settings/index.tsx"),
      route(
        "/organization/:slug/settings/admins",
        "./routes/organization/$slug/settings/admins.tsx"
      ),
      route(
        "/organization/:slug/settings/danger-zone",
        "./routes/organization/$slug/settings/danger-zone.tsx",
        [
          index("./routes/organization/$slug/settings/danger-zone/index.tsx"),
          route(
            "/organization/:slug/settings/danger-zone/change-url",
            "./routes/organization/$slug/settings/danger-zone/change-url.tsx"
          ),
          route(
            "/organization/:slug/settings/danger-zone/delete",
            "./routes/organization/$slug/settings/danger-zone/delete.tsx"
          ),
        ]
      ),
      route(
        "/organization/:slug/settings/general",
        "./routes/organization/$slug/settings/general.tsx"
      ),
      route(
        "/organization/:slug/settings/manage",
        "./routes/organization/$slug/settings/manage.tsx"
      ),
      route(
        "/organization/:slug/settings/team",
        "./routes/organization/$slug/settings/team.tsx"
      ),
      route(
        "/organization/:slug/settings/web-social",
        "./routes/organization/$slug/settings/web-social.tsx"
      ),
    ]
  ),
  route("/my", "./routes/my/index.tsx"),
  route("/my/events", "./routes/my/events.tsx"),
  route("/my/organizations", "./routes/my/organizations.tsx"),
  route("/my/projects", "./routes/my/projects.tsx"),
  route("/logout", "./routes/logout/index.tsx"),
  route("/login", "./routes/login/index.tsx"),
  route("/explore", "./routes/explore.tsx", [
    index("./routes/explore/index.tsx"),
    route("/explore/all", "./routes/explore/all.tsx"),
    route("/explore/profiles", "./routes/explore/profiles.tsx"),
    route("/explore/organizations", "./routes/explore/organizations.tsx", [
      index("./routes/explore/organizations/index.tsx"),
      route(
        "/explore/organizations/map",
        "./routes/explore/organizations/map.tsx"
      ),
      route(
        "/explore/organizations/list",
        "./routes/explore/organizations/list.tsx"
      ),
    ]),
    route("/explore/events", "./routes/explore/events.tsx"),
    route("/explore/projects", "./routes/explore/projects.tsx"),
    route("/explore/fundings", "./routes/explore/fundings.tsx"),
  ]),
  route("/event/create", "./routes/event/create.tsx"),
  route("/event/:slug", "./routes/event/$slug/index.tsx"),
  route("/event/:slug/settings", "./routes/event/$slug/settings.tsx", [
    index("./routes/event/$slug/settings/index.tsx"),
    route(
      "/event/:slug/settings/admins",
      "./routes/event/$slug/settings/admins.tsx",
      [
        index("./routes/event/$slug/settings/admins/index.tsx"),
        route(
          "/event/:slug/settings/admins/list",
          "./routes/event/$slug/settings/admins/list.tsx"
        ),
        route(
          "/event/:slug/settings/admins/add",
          "./routes/event/$slug/settings/admins/add.tsx"
        ),
        route(
          "/event/:slug/settings/admins/invites",
          "./routes/event/$slug/settings/admins/invites.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/danger-zone",
      "./routes/event/$slug/settings/danger-zone.tsx",
      [
        index("./routes/event/$slug/settings/danger-zone/index.tsx"),
        route(
          "/event/:slug/settings/danger-zone/change-url",
          "./routes/event/$slug/settings/danger-zone/change-url.tsx"
        ),
        route(
          "/event/:slug/settings/danger-zone/cancel",
          "./routes/event/$slug/settings/danger-zone/cancel.tsx"
        ),
        route(
          "/event/:slug/settings/danger-zone/delete",
          "./routes/event/$slug/settings/danger-zone/delete.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/details",
      "./routes/event/$slug/settings/details.tsx",
      [
        index("./routes/event/$slug/settings/details/index.tsx"),
        route(
          "/event/:slug/settings/details/info",
          "./routes/event/$slug/settings/details/info.tsx"
        ),
        route(
          "/event/:slug/settings/details/background",
          "./routes/event/$slug/settings/details/background.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/documents",
      "./routes/event/$slug/settings/documents.tsx",
      [
        index("./routes/event/$slug/settings/documents/index.tsx"),
        route(
          "/event/:slug/settings/documents/list",
          "./routes/event/$slug/settings/documents/list.tsx"
        ),
        route(
          "/event/:slug/settings/documents/add",
          "./routes/event/$slug/settings/documents/add.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/location",
      "./routes/event/$slug/settings/location.tsx"
    ),
    route(
      "/event/:slug/settings/participants",
      "./routes/event/$slug/settings/participants.tsx",
      [
        index("./routes/event/$slug/settings/participants/index.tsx"),
        route(
          "/event/:slug/settings/participants/list",
          "./routes/event/$slug/settings/participants/list.tsx"
        ),
        route(
          "/event/:slug/settings/participants/list-download",
          "./routes/event/$slug/settings/participants/list-download.tsx"
        ),
        route(
          "/event/:slug/settings/participants/waiting-list",
          "./routes/event/$slug/settings/participants/waiting-list.tsx"
        ),
        route(
          "/event/:slug/settings/participants/add",
          "./routes/event/$slug/settings/participants/add.tsx"
        ),
        route(
          "/event/:slug/settings/participants/invites",
          "./routes/event/$slug/settings/participants/invites.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/registration",
      "./routes/event/$slug/settings/registration.tsx",
      [
        index("./routes/event/$slug/settings/registration/index.tsx"),
        route(
          "/event/:slug/settings/registration/access",
          "./routes/event/$slug/settings/registration/access.tsx"
        ),
        route(
          "/event/:slug/settings/registration/period",
          "./routes/event/$slug/settings/registration/period.tsx"
        ),
        route(
          "/event/:slug/settings/registration/limit",
          "./routes/event/$slug/settings/registration/limit.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/related-events",
      "./routes/event/$slug/settings/related-events.tsx",
      [
        index("./routes/event/$slug/settings/related-events/index.tsx"),
        route(
          "/event/:slug/settings/related-events/parent-event",
          "./routes/event/$slug/settings/related-events/parent-event.tsx"
        ),
        route(
          "/event/:slug/settings/related-events/child-events",
          "./routes/event/$slug/settings/related-events/child-events.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/responsible-orgs",
      "./routes/event/$slug/settings/responsible-orgs.tsx",
      [
        index("./routes/event/$slug/settings/responsible-orgs/index.tsx"),
        route(
          "/event/:slug/settings/responsible-orgs/list",
          "./routes/event/$slug/settings/responsible-orgs/list.tsx"
        ),
        route(
          "/event/:slug/settings/responsible-orgs/add",
          "./routes/event/$slug/settings/responsible-orgs/add.tsx"
        ),
        route(
          "/event/:slug/settings/responsible-orgs/invites",
          "./routes/event/$slug/settings/responsible-orgs/invites.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/speakers",
      "./routes/event/$slug/settings/speakers.tsx",
      [
        index("./routes/event/$slug/settings/speakers/index.tsx"),
        route(
          "/event/:slug/settings/speakers/list",
          "./routes/event/$slug/settings/speakers/list.tsx"
        ),
        route(
          "/event/:slug/settings/speakers/add",
          "./routes/event/$slug/settings/speakers/add.tsx"
        ),
        route(
          "/event/:slug/settings/speakers/invites",
          "./routes/event/$slug/settings/speakers/invites.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/team",
      "./routes/event/$slug/settings/team.tsx",
      [
        index("./routes/event/$slug/settings/team/index.tsx"),
        route(
          "/event/:slug/settings/team/list",
          "./routes/event/$slug/settings/team/list.tsx"
        ),
        route(
          "/event/:slug/settings/team/add",
          "./routes/event/$slug/settings/team/add.tsx"
        ),
        route(
          "/event/:slug/settings/team/invites",
          "./routes/event/$slug/settings/team/invites.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/time-period",
      "./routes/event/$slug/settings/time-period.tsx"
    ),
  ]),
  route(
    "/event/:slug/documents-download",
    "./routes/event/$slug/documents-download.tsx"
  ),
  route("/event/:slug/detail", "./routes/event/$slug/detail.tsx", [
    index("./routes/event/$slug/detail/index.tsx"),
    route("/event/:slug/detail/about", "./routes/event/$slug/detail/about.tsx"),
    route(
      "/event/:slug/detail/participants",
      "./routes/event/$slug/detail/participants.tsx"
    ),
    route(
      "/event/:slug/detail/child-events",
      "./routes/event/$slug/detail/child-events.tsx"
    ),
  ]),
  route("/event/:slug/ics-download", "./routes/event/$slug/ics-download.tsx"),
  route("/auth/confirm", "./routes/auth/confirm.tsx"),
  route("/auth/keycloak", "./routes/auth/keycloak.tsx"),
  route("/auth/keycloak/callback", "./routes/auth/keycloak.callback.tsx"),
  route("/auth/request-confirmation", "./routes/auth/request-confirmation.tsx"),
  route("/auth/verify", "./routes/auth/verify.tsx"),
  route("/map", "./routes/map.tsx"),
  route("/map-proxy", "./routes/map-proxy.ts"),
  route("/map-style", "./routes/map-style.ts"),
] satisfies RouteConfig;
