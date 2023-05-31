import Avatar from "../../molecules/Avatar";
import Button from "../../molecules/Button";
import { Card, CardBody, CardFooter, CardHeader } from "./Card";
import ProfileCard from "./ProfileCard";

function getOrganizations(numberOfOrganizations: number) {
  const organizations = [];
  for (let i = 0; i < numberOfOrganizations; i++) {
    organizations.push({
      name: `Organization ${i}`,
      slug: "organization-name",
      logo: i % 2 === 0 ? `https://picsum.photos/id/${i}/50/50` : undefined, // only every second organization has a logo
    });
  }
  return organizations;
}

function getRandomString(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function getRandomStrings(numberOfStrings: number) {
  const offers = [];
  for (let i = 0; i < numberOfStrings; i++) {
    offers.push(getRandomString(Math.floor(Math.random() * 30) + 6));
  }

  return offers;
}
export function EmptyProfile() {
  const profile = {
    firstName: "Sirko",
    lastName: "Kaiser",
    memberOf: [],
    areaNames: [],
    offers: [],
  };
  return (
    <div className="w-[352px]">
      <ProfileCard profile={profile} />
    </div>
  );
}
EmptyProfile.storyName = "empty profile";

export function Variants() {
  const profile1 = {
    firstName: "Sirko",
    lastName: "Kaiser",
    memberOf: [],
    areaNames: [],
    offers: [],
  };
  const profile2 = {
    firstName: "Colin",
    lastName: "König",
    position: "UX Designer",
    avatar: "https://picsum.photos/id/1084/500/500",
    background: "https://picsum.photos/id/434/500/500",
    memberOf: getOrganizations(1),
    areaNames: ["Bundesweit"],
    offers: ["Wirkungsorientierung/Qualitätsentwicklung"],
  };
  const profile3 = {
    academicTitle: "Prof. Dr.",
    firstName: "Julia",
    lastName: "Langlang-Schmittberger",
    position: "Software Engineer",
    avatar: "https://picsum.photos/id/435/500/500",
    background: "https://picsum.photos/id/436/500/500",
    memberOf: getOrganizations(4),
    areaNames: ["Hamburg", "Bundesweit", "Niedersachsen", "Schleswig-Holstein"],
    offers: [
      "Wirkungsorientierung/Qualitätsentwicklung",
      "Beratung",
      "Coaching",
      "Moderation",
    ],
  };

  return (
    <>
      <div className="mv-py-12">
        <h1 className="mv-text-primary mv-font-black mv-text-5xl lg:mv-text-7xl mv-leading-tight mv-mb-2">
          Willkommen,
          <br />
          Anna Schröter
        </h1>
        <p className="mv-font-semibold mv-mb-4 lg:mv-mb-8">
          in Deiner MINTvernetzt-Community!
        </p>
        <p>
          <Button variant="secondary" size="small">
            Mein Profil besuchen
          </Button>
        </p>
      </div>
      <div className="mv-relative">
        <div className="mv-flex mv-mb-4 lg:mv-mb-8 mv-flex-nowrap mv-items-end mv-justify-between">
          <div className="mv-font-bold mv-text-gray-700 mv-text-2xl mv-leading-7 lg:mv-text-5xl lg:mv-leading-9">
            Profile
          </div>
          <div className="mv-text-right">
            <a
              href="/explore/profiles"
              className="mv-font-semibold mv-text-gray-400 mv-text-sm mv-leading-4 lg:mv-text-2xl lg:mv-leading-7"
            >
              Alle Profile
            </a>
          </div>
        </div>
        <div className="mv-flex mv--mx-2 md:mv--mx-4 mv-mb-8">
          <div className="mv-w-3/4 md:mv-w-1/3 mv-px-2 md:mv-px-4 mv-shrink-0">
            <ProfileCard profile={profile1} />
          </div>
          <div className="mv-w-3/4 md:mv-w-1/3 mv-px-2 md:mv-px-4 mv-shrink-0">
            <ProfileCard profile={profile2} match={80} />
          </div>
          <div className="mv-w-3/4 md:mv-mr-0 md:mv-w-1/3 mv-px-2 md:mv-px-4 mv-shrink-0">
            <ProfileCard profile={profile3} />
          </div>
        </div>
      </div>
      <div className="mv-flex mv-gap-8 mv-mb-8 mv-hidden">
        <div className="mv-w-[352px]">
          <ProfileCard profile={profile1} />
        </div>
        <div className="mv-w-[352px]">
          <ProfileCard profile={profile2} match={80} />
        </div>
        <div className="mv-w-[352px]">
          <ProfileCard profile={profile3} />
        </div>
      </div>
      <div className="mv-flex mv-gap-8 mv-hidden">
        <div className="mv-w-[253px]">
          <ProfileCard profile={profile1} />
        </div>
        <div className="mv-w-[253px]">
          <ProfileCard profile={profile2} />
        </div>
        <div className="mv-w-[253px]">
          <ProfileCard profile={profile3} />
        </div>
      </div>
    </>
  );
}
Variants.storyName = "Variants";

export function ProfileCardWithoutAreaInfo() {
  return (
    <div className="mv-w-[352px]">
      <Card>
        <CardHeader></CardHeader>

        <h4 className="mv-text-primary mv-text-base mv-leading-5 mv-font-bold mv-mb-0">
          Ines Kurz
        </h4>
        <p className="mv-text-neutral-700 mv-text-sm mv-leading-5 mv-font-bold">
          Projektleiterin matrix gGmbH
        </p>

        <div className="mv-p-4 pt-2 mv-gap-0">
          <div className="mv-text-xxs mv-leading-4 mv-mb-1">
            Aktivitätsgebiete
          </div>
          <div className="mv-text-xs mv-leading-4 mv-mb-6 mv-text-gray-400">
            -nicht angegeben-
          </div>

          <div className="mv-text-xxs mv-leading-4 mv-mb-1">Ich biete</div>
          <div className="mv-flex mv-flex-wrap mv-gap-2">
            <div className="mv-bg-secondary-50 mv-text-secondary-600 mv-text-xs mv-py-1.5 mv-px-3 mv-rounded-lg mv-font-semibold">
              <span className="mv-text-ellipsis mv-overflow-hidden mv-text-left">
                Wirkungsorientierung/Qualitätsentwicklung
              </span>
            </div>
          </div>
        </div>
        <CardFooter>
          <Avatar
            name="Name"
            logo="https://picsum.photos/id/431/500/500"
            size="sm"
          />
          <Avatar
            name="Name"
            logo="https://picsum.photos/id/432/500/500"
            size="sm"
          />
        </CardFooter>
      </Card>
    </div>
  );
}
ProfileCardWithoutAreaInfo.storyName = "Keine Infos";

type ProfileCardPlaygroundProps = {
  match?: number;
  to?: string;
  academicTitle?: string;
  firstName: string;
  lastName: string;
  position?: string;
  numberOfOrganizations: number;
  numberOfOffers: number;
  numberOfAreas: number;
};

export function ProfileCardPlayground(args: ProfileCardPlaygroundProps) {
  const { match, to, ...profileProps } = args;
  const memberOf = getOrganizations(args.numberOfOrganizations);
  const areaNames = getRandomStrings(args.numberOfAreas);
  const offers = getRandomStrings(args.numberOfOffers);
  return (
    <div className="mv-flex mv-gap-8">
      <div className="mv-w-[352px]">
        <ProfileCard
          match={match}
          to={to}
          profile={{ ...profileProps, memberOf, areaNames, offers }}
        />
      </div>
      <div className="mv-w-[253px]">
        <ProfileCard
          match={match}
          to={to}
          profile={{ ...profileProps, memberOf, areaNames, offers }}
        />
      </div>
    </div>
  );
}
ProfileCardPlayground.storyName = "Playground";
ProfileCardPlayground.args = {
  firstName: "Sirko",
  lastName: "Kaiser",
  position: "Software Engineer",
  avatar: "https://picsum.photos/id/433/500/500",
  background: "https://picsum.photos/id/423/500/500",
  numberOfOrganizations: 0,
  numberOfOffers: 0,
  numberOfAreas: 0,
};
ProfileCardPlayground.argTypes = {
  background: {
    control: "text",
  },
  numberOfOrganizations: {
    control: "number",
    default: 0,
  },
  numberOfOffers: {
    control: "number",
    default: 0,
  },
  numberOfAreas: {
    control: "number",
    default: 0,
  },
  academicTitle: {
    control: "select",
    options: ["Dr.", "Prof.", "Prof. Dr."],
  },
  match: {
    control: "number",
  },
  to: { control: "text" },
};
ProfileCardPlayground.parameters = {
  controls: { disable: false },
};

export default {
  title: "Organism/Cards/ProfileCards",
  component: ProfileCard,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
