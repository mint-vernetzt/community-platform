import {
  Avatar,
  Button,
  CircleButton,
  Controls,
  Image,
  type ImageProps,
  Status,
} from "./../../index";
import Header from "./Header";

type HeaderPlaygroundProps = {
  status: boolean;
  image: boolean;
  imageResizeType: ImageProps["resizeType"];
  avatar: boolean;
  controls: boolean;
  body: boolean;
  bodyControls: boolean;
  footer: boolean;
  footerControls: boolean;
  footerText: boolean;
};

export function Playground(props: HeaderPlaygroundProps) {
  return (
    <Header>
      {props.status && <Status>Entwurf</Status>}
      {props.image && (
        <Image
          src="./error-music-project.jpg"
          blurredSrc="./error-music-project-blurred.jpg"
          alt='Die sieben verantwortlichen Personen vom Projekt "Error Music - don`t delete!"'
          resizeType={props.imageResizeType || "fill"}
        />
      )}
      {props.avatar && (
        <Avatar
          name='Logo vom Projekt "Error Music - don`t delete!"'
          logo="./error-music-project-logo.jpg"
          size="full"
          textSize="xl"
        />
      )}
      {props.controls && (
        <Controls>
          <CircleButton variant="outline">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.1464 0.146447C12.3417 -0.0488155 12.6583 -0.0488155 12.8536 0.146447L15.8536 3.14645C16.0488 3.34171 16.0488 3.65829 15.8536 3.85355L5.85355 13.8536C5.80567 13.9014 5.74857 13.9391 5.6857 13.9642L0.685695 15.9642C0.499987 16.0385 0.287878 15.995 0.146446 15.8536C0.00501511 15.7121 -0.0385219 15.5 0.0357614 15.3143L2.03576 10.3143C2.06091 10.2514 2.09857 10.1943 2.14645 10.1464L12.1464 0.146447ZM11.2071 2.5L13.5 4.79289L14.7929 3.5L12.5 1.20711L11.2071 2.5ZM12.7929 5.5L10.5 3.20711L4 9.70711V10H4.5C4.77614 10 5 10.2239 5 10.5V11H5.5C5.77614 11 6 11.2239 6 11.5V12H6.29289L12.7929 5.5ZM3.03165 10.6755L2.92612 10.781L1.39753 14.6025L5.21902 13.0739L5.32454 12.9683C5.13495 12.8973 5 12.7144 5 12.5V12H4.5C4.22386 12 4 11.7761 4 11.5V11H3.5C3.2856 11 3.10271 10.865 3.03165 10.6755Z"
                fill="#454C5C"
              />
            </svg>
          </CircleButton>
        </Controls>
      )}
      {props.body && (
        <Header.Body>
          {props.bodyControls && (
            <Controls>
              <div className="mv-flex mv-content-center mv-items-center mv-nowrap mv-cursor-pointer mv-text-primary">
                <svg
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mv-fill-neutral-600"
                >
                  <path d="M14.9 3.116a.423.423 0 0 0-.123-.299l-1.093-1.093a.422.422 0 0 0-.598 0l-.882.882 1.691 1.69.882-.882a.423.423 0 0 0 .123-.298Zm-3.293.087 1.69 1.69v.001l-5.759 5.76a.422.422 0 0 1-.166.101l-2.04.68a.211.211 0 0 1-.267-.267l.68-2.04a.423.423 0 0 1 .102-.166l5.76-5.76ZM2.47 14.029a1.266 1.266 0 0 1-.37-.895V3.851a1.266 1.266 0 0 1 1.265-1.266h5.486a.422.422 0 0 1 0 .844H3.366a.422.422 0 0 0-.422.422v9.283a.422.422 0 0 0 .422.422h9.284a.422.422 0 0 0 .421-.422V8.07a.422.422 0 0 1 .845 0v5.064a1.266 1.266 0 0 1-1.267 1.266H3.367c-.336 0-.658-.133-.895-.37Z" />
                </svg>
                <span className="mv-ml-2">Bild ändern</span>
              </div>
            </Controls>
          )}
          {/* // TODO: Implement styled Heading: <H1 as="h3" className="mv-mb-0">Error Music - don't delete!</H1> */}
          <h1>Error Music - don't delete!</h1>
          <p className="mv-text-base md:mv-text-2xl">
            Sound x Tech Format für Mädchen*, trans*, inter* und non-binäre
            Jugendliche ab 12 Jahren.
          </p>
        </Header.Body>
      )}
      {props.footer && (
        <Header.Footer>
          {props.footerText &&
            "Hier steht beim Veranstaltungs Header ein Text."}
          {props.footerControls && (
            <Controls>
              <Button>Projekt bearbeiten</Button>
              <Button variant="outline">Veröffentlichen</Button>
            </Controls>
          )}
        </Header.Footer>
      )}
    </Header>
  );
}
Playground.storyName = "Header Playground";
Playground.args = {
  status: true,
  image: true,
  imageResizeType: "fill",
  controls: true,
  body: true,
  avatar: true,
  bodyControls: true,
  footer: true,
  footerControls: true,
  footerText: false,
};
Playground.argTypes = {
  status: { control: "boolean" },
  image: { control: "boolean" },
  imageResizeType: {
    control: "select",
    options: ["fill", "fit"],
  },
  controls: { control: "boolean" },
  body: { control: "boolean" },
  avatar: { control: "boolean", if: { arg: "body" } },
  bodyControls: { control: "boolean", if: { arg: "body" } },
  footer: { control: "boolean" },
  footerControls: { control: "boolean", if: { arg: "footer" } },
  footerText: { control: "boolean", if: { arg: "footer" } },
};
Playground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "lg",
  },
};

export default {
  title: "Organism/Header",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
