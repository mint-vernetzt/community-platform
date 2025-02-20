import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("./routes/index.tsx"),
  route("*", "./routes/$.tsx"),
  route("/status", "./routes/status.tsx"),
  route("/imprint", "./routes/imprint.tsx"),
  route("/help", "./routes/help.tsx"),
  route("/goodbye", "./routes/goodbye.tsx"),
  route("/error", "./routes/error.tsx"),
  route("/dashboard", "./routes/dashboard.tsx"),
  route("/accept-terms", "./routes/accept-terms.tsx"),
  route("/upload/delete", "./routes/upload/delete.tsx"),
  route("/upload/image", "./routes/upload/image.tsx"),
  route("/search", "./routes/search.tsx", [
    index("./routes/search/index.tsx"),
    route("/search/profiles", "./routes/search/profiles.tsx"),
    route("/search/organizations", "./routes/search/organizations.tsx"),
    route("/search/events", "./routes/search/events.tsx"),
    route("/search/projects", "./routes/search/projects.tsx"),
    route("/search/fundings", "./routes/search/fundings.tsx"),
  ]),
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
  route("/my/organizations", "./routes/my/organizations.tsx", [
    route(
      "/my/organizations/get-organizations-to-add",
      "./routes/my/organizations/get-organizations-to-add.tsx"
    ),
    route("/my/organizations/quit", "./routes/my/organizations/quit.tsx"),
    route(
      "/my/organizations/requests",
      "./routes/my/organizations/requests.tsx"
    ),
  ]),
  route("/my/projects", "./routes/my/projects.tsx", [
    route("/my/projects/quit", "./routes/my/projects/quit.tsx"),
  ]),
  route("/logout", "./routes/logout/index.tsx"),
  route("/login", "./routes/login/index.tsx"),
  route("/explore", "./routes/explore.tsx", [
    index("./routes/explore/index.tsx"),
    route("/explore/profiles", "./routes/explore/profiles.tsx"),
    route("/explore/organizations", "./routes/explore/organizations.tsx"),
    route("/explore/events", "./routes/explore/events.tsx"),
    route("/explore/projects", "./routes/explore/projects.tsx"),
    route("/explore/fundings", "./routes/explore/fundings.tsx"),
  ]),
  route("/event/create", "./routes/event/create.tsx"),
  route(
    "/event/:slug/documents-download",
    "./routes/event/$slug/documents-download.tsx"
  ),
  route("/event/:slug/ics-download", "./routes/event/$slug/ics-download.tsx"),
  route("/event/:slug", "./routes/event/$slug/index.tsx"),
  route("/event/:slug/settings", "./routes/event/$slug/settings.tsx", [
    index("./routes/event/$slug/settings/index.tsx"),
    route(
      "/event/:slug/settings/admins",
      "./routes/event/$slug/settings/admins.tsx",
      [
        route(
          "/event/:slug/settings/admins/add-admin",
          "./routes/event/$slug/settings/admins/add-admin.tsx"
        ),
        route(
          "/event/:slug/settings/admins/remove-admin",
          "./routes/event/$slug/settings/admins/remove-admin.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/csv-download",
      "./routes/event/$slug/settings/csv-download.tsx"
    ),
    route(
      "/event/:slug/settings/delete",
      "./routes/event/$slug/settings/delete.tsx"
    ),
    route(
      "/event/:slug/settings/documents",
      "./routes/event/$slug/settings/documents.tsx"
    ),
    route(
      "/event/:slug/settings/events",
      "./routes/event/$slug/settings/events.tsx",
      [
        route(
          "/event/:slug/settings/events/add-child",
          "./routes/event/$slug/settings/events/add-child.tsx"
        ),
        route(
          "/event/:slug/settings/events/cancel",
          "./routes/event/$slug/settings/events/cancel.tsx"
        ),
        route(
          "/event/:slug/settings/events/publish",
          "./routes/event/$slug/settings/events/publish.tsx"
        ),
        route(
          "/event/:slug/settings/events/remove-child",
          "./routes/event/$slug/settings/events/remove-child.tsx"
        ),
        route(
          "/event/:slug/settings/events/set-parent",
          "./routes/event/$slug/settings/events/set-parent.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/general",
      "./routes/event/$slug/settings/general.tsx"
    ),
    route(
      "/event/:slug/settings/organizations",
      "./routes/event/$slug/settings/organizations.tsx",
      [
        route(
          "/event/:slug/settings/organizations/add-organization",
          "./routes/event/$slug/settings/organizations/add-organization.tsx"
        ),
        route(
          "/event/:slug/settings/organizations/remove-organization",
          "./routes/event/$slug/settings/organizations/remove-organization.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/participants",
      "./routes/event/$slug/settings/participants.tsx",
      [
        route(
          "/event/:slug/settings/participants/add-participant",
          "./routes/event/$slug/settings/participants/add-participant.tsx"
        ),
        route(
          "/event/:slug/settings/participants/remove-participant",
          "./routes/event/$slug/settings/participants/remove-participant.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/speakers",
      "./routes/event/$slug/settings/speakers.tsx",
      [
        route(
          "/event/:slug/settings/speakers/add-speaker",
          "./routes/event/$slug/settings/speakers/add-speaker.tsx"
        ),
        route(
          "/event/:slug/settings/speakers/remove-speaker",
          "./routes/event/$slug/settings/speakers/remove-speaker.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/team",
      "./routes/event/$slug/settings/team.tsx",
      [
        route(
          "/event/:slug/settings/team/add-member",
          "./routes/event/$slug/settings/team/add-member.tsx"
        ),
        route(
          "/event/:slug/settings/team/remove-member",
          "./routes/event/$slug/settings/team/remove-member.tsx"
        ),
      ]
    ),
    route(
      "/event/:slug/settings/waiting-list",
      "./routes/event/$slug/settings/waiting-list.tsx",
      [
        route(
          "/event/:slug/settings/waiting-list/add-to-waiting-list",
          "./routes/event/$slug/settings/waiting-list/add-to-waiting-list.tsx"
        ),
        route(
          "/event/:slug/settings/waiting-list/move-to-participants",
          "./routes/event/$slug/settings/waiting-list/move-to-participants.tsx"
        ),
        route(
          "/event/:slug/settings/waiting-list/remove-from-waiting-list",
          "./routes/event/$slug/settings/waiting-list/remove-from-waiting-list.tsx"
        ),
      ]
    ),
  ]),
  route("/auth/confirm", "./routes/auth/confirm.tsx"),
  route("/auth/keycloak", "./routes/auth/keycloak.tsx"),
  route("/auth/keycloak/callback", "./routes/auth/keycloak.callback.tsx"),
  route("/auth/verify", "./routes/auth/verify.tsx"),
] satisfies RouteConfig;
