import React from "react";
import { Link, LoaderFunction, useLoaderData } from "remix";
import { badRequest, notFound } from "remix-utils";
import { getUserByRequest } from "~/auth.server";
import { H1 } from "~/components/Heading/Heading";
import ImageCropper from "~/components/ImageCropper/ImageCropper";
import Modal from "~/components/Modal/Modal";
import { getImageURL } from "~/images.server";
import { checkFeatureAbilitiesOrThrow } from "~/lib/utils/application";
import { getPublicURL } from "~/storage.server";
import { deriveMode, getProjectBySlugOrThrow } from "./utils.server";

type LoaderData = {
  mode: Awaited<ReturnType<typeof deriveMode>>;
  project: NonNullable<Awaited<ReturnType<typeof getProjectBySlugOrThrow>>>;
  abilities: Awaited<ReturnType<typeof checkFeatureAbilitiesOrThrow>>;
};

export const loader: LoaderFunction = async (args) => {
  const { request, params } = args;
  const { slug } = params;

  if (slug === undefined || typeof slug !== "string") {
    throw badRequest({ message: '"slug" missing' });
  }

  const project = await getProjectBySlugOrThrow(slug);

  if (project === null) {
    throw notFound({ message: `Project not found` });
  }

  const currentUser = await getUserByRequest(request);

  const mode = await deriveMode(project, currentUser);

  const abilities = await checkFeatureAbilitiesOrThrow(request, "projects");

  if (project.logo !== null) {
    const publicURL = getPublicURL(project.logo);
    project.logo = getImageURL(publicURL, {
      resize: { type: "fit", width: 144, height: 144 },
    });
  }

  if (project.background !== null) {
    const publicURL = getPublicURL(project.background);
    project.background = getImageURL(publicURL, {
      resize: { type: "fit", width: 1488, height: 480 },
    });
  }

  project.teamMembers = project.teamMembers.map((item) => {
    if (item.profile.avatar !== null) {
      const publicURL = getPublicURL(item.profile.avatar);
      item.profile.avatar = getImageURL(publicURL, {
        resize: { type: "fit", width: 64, height: 64 },
      });
    }
    return item;
  });

  project.responsibleOrganizations = project.responsibleOrganizations.map(
    (item) => {
      if (item.organization.logo !== null) {
        const publicURL = getPublicURL(item.organization.logo);
        item.organization.logo = getImageURL(publicURL, {
          resize: { type: "fit", width: 64, height: 64 },
        });
      }
      return item;
    }
  );

  project.awards = project.awards.map((item) => {
    if (item.award.logo !== null) {
      const publicURL = getPublicURL(item.award.logo);
      item.award.logo = getImageURL(publicURL, {
        resize: { type: "fit", width: 64, height: 64 },
      });
    }
    return item;
  });

  return { mode, slug, project, abilities };
};

function Index() {
  const loaderData = useLoaderData<LoaderData>();

  const Background = React.useCallback(
    () => (
      <div className="w-full bg-yellow-500 rounded-md overflow-hidden">
        {loaderData.project.background ? (
          <img
            src={loaderData.project.background}
            alt={`Aktuelles Hintergrundbild`}
          />
        ) : (
          <div className="w-[336px] min-h-[108px]" />
        )}
      </div>
    ),
    [loaderData.project.background]
  );

  return (
    <>
      <H1>Background</H1>
      <section className="container mt-6">
        <div className="rounded-3xl overflow-hidden w-full relative">
          <div className="hidden md:block">
            <div className="relative overflow-hidden bg-yellow-500 w-full aspect-[31/10]">
              <div className="w-full h-full">
                {loaderData.project.background !== undefined && (
                  <img
                    src={
                      loaderData.project.background ||
                      "/images/default-project-background.jpg"
                    }
                    alt={loaderData.project.name}
                  />
                )}
              </div>
              {loaderData.mode === "owner" &&
                loaderData.abilities.projects.hasAccess && (
                  <div className="absolute bottom-6 right-6">
                    <label
                      htmlFor="modal-background-upload"
                      className="btn btn-primary modal-button"
                    >
                      Bild ändern
                    </label>

                    <Modal id="modal-background-upload">
                      <ImageCropper
                        headline="Hintergrundbild"
                        subject="event"
                        id="modal-background-upload"
                        uploadKey="background"
                        image={loaderData.project.background || undefined}
                        aspect={31 / 10}
                        minCropWidth={620}
                        minCropHeight={62}
                        maxTargetWidth={1488}
                        maxTargetHeight={480}
                        slug={loaderData.project.slug}
                        csrfToken={"92014sijdaf02"}
                        redirect={`/project/${loaderData.project.slug}`}
                      >
                        <Background />
                      </ImageCropper>
                    </Modal>
                  </div>
                )}
            </div>
          </div>
        </div>
      </section>
      <H1 like="h0">{loaderData.project.name}</H1>
      {loaderData.mode === "owner" && loaderData.abilities.projects.hasAccess && (
        <div className="bg-accent-white p-8 pb-0">
          <p className="font-bold text-right">
            <Link
              className="btn btn-outline btn-primary ml-4"
              to={`/project/${loaderData.project.slug}/settings`}
            >
              Projekt bearbeiten
            </Link>
          </p>
        </div>
      )}
    </>
  );
}

export default Index;
