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

function getOffers(numberOfOffers: number) {
  const offers = [];
  for (let i = 0; i < numberOfOffers; i++) {
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
      <div className="container py-12">
        <h1 className="text-primary font-black text-5xl lg:text-7xl leading-xtight mb-2">
          Willkommen,
          <br />
          Anna Schröter
        </h1>
        <p className="font-semibold mb-4 lg:mb-8">
          in Deiner MINTvernetzt-Community!
        </p>
        <p>
          <Button variant="secondary" size="small">
            Mein Profil besuchen
          </Button>
        </p>
      </div>
      <div className="container relative">
        <div className="flex mb-4 lg:mb-8 flex-nowrap items-end justify-between">
          <div className="font-bold text-gray-700 text-2xl leading-7 lg:text-5xl lg:leading-9">
            Profile
          </div>
          <div className="text-right">
            <a
              href="/explore/profiles"
              className="font-semibold text-gray-400 text-sm leading-4 lg:text-2xl lg:leading-7"
            >
              Alle Profile
            </a>
          </div>
        </div>
        <div className="flex -mx-2 md:-mx-4 mb-8">
          <div className="w-3/4 md:w-1/3 px-2 md:px-4 shrink-0">
            <ProfileCard profile={profile1} />
          </div>
          <div className="w-3/4 md:w-1/3 px-2 md:px-4 shrink-0">
            <ProfileCard profile={profile2} match={80} />
          </div>
          <div className="w-3/4 md:mr-0 md:w-1/3 px-2 md:px-4 shrink-0">
            <ProfileCard profile={profile3} />
          </div>
        </div>
      </div>
      <div className="flex gap-8 mb-8 hidden">
        <div className="w-[352px]">
          <ProfileCard profile={profile1} />
        </div>
        <div className="w-[352px]">
          <ProfileCard profile={profile2} match={80} />
        </div>
        <div className="w-[352px]">
          <ProfileCard profile={profile3} />
        </div>
      </div>
      <div className="flex gap-8 hidden">
        <div className="w-[253px]">
          <ProfileCard profile={profile1} />
        </div>
        <div className="w-[253px]">
          <ProfileCard profile={profile2} />
        </div>
        <div className="w-[253px]">
          <ProfileCard profile={profile3} />
        </div>
      </div>
    </>
  );
}
Variants.storyName = "Variants";

export function ProfileCardWithoutAreaInfo() {
  return (
    <div className="w-[352px]">
      <Card>
        <CardHeader></CardHeader>

        <h4 className="text-primary text-base leading-5 font-bold mb-0">
          Ines Kurz
        </h4>
        <p className="text-neutral-700 text-sm leading-5 font-bold">
          Projektleiterin matrix gGmbH
        </p>

        <div className="card-body p-4 pt-2 gap-0">
          <div className="text-xxs leading-4 mb-1">Aktivitätsgebiete</div>
          <div className="text-xs leading-4 mb-6 text-gray-400">
            -nicht angegeben-
          </div>

          <div className="text-xxs leading-4 mb-1">Ich biete</div>
          <div className="flex flex-wrap gap-2">
            <div className="bg-secondary-50 text-secondary-600 text-xs py-1.5 px-3 rounded-lg font-semibold">
              <span className="text-ellipsis overflow-hidden text-left">
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
  academicTitle?: string;
  firstName: string;
  lastName: string;
  position?: string;
  numberOfOrganizations: number;
  numberOfOffers: number;
};

export function ProfileCardPlayground(args: ProfileCardPlaygroundProps) {
  const { match, ...profileProps } = args;
  const memberOf = getOrganizations(args.numberOfOrganizations);
  const areaNames: string[] = [];
  const offers = getOffers(args.numberOfOffers);
  return (
    <div className="flex gap-8">
      <div className="w-[352px]">
        <ProfileCard
          match={match}
          profile={{ ...profileProps, memberOf, areaNames, offers }}
        />
      </div>
      <div className="w-[253px]">
        <ProfileCard
          match={match}
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
  academicTitle: {
    control: "select",
    options: ["Dr.", "Prof.", "Prof. Dr."],
  },
  match: {
    control: "number",
  },
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
