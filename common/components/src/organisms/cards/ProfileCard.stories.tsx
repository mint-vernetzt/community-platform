import Avatar from "../../molecules/Avatar";
import { Card, CardFooter, CardHeader } from "./Card";
import ProfileCard from "./ProfileCard";

export function ProfileCardWithoutAreaInfo() {
  return (
    <div className="w-[352px]">
      <Card>
        <CardHeader></CardHeader>

        <div className="card-header px-4 pt-0 pb-6">
          <h4 className="text-primary text-base leading-5 font-bold mb-0">
            Ines Kurz
          </h4>
          <p className="text-neutral-700 text-sm leading-5 font-bold">
            Projektleiterin matrix gGmbH
          </p>
        </div>
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
};

function getOrganizations(numberOfOrganizations: number) {
  const organizations = [];
  for (let i = 0; i < numberOfOrganizations; i++) {
    organizations.push({
      name: `Organization ${i}`,
      slug: "organization-name",
      logo: i % 2 === 0 ? `https://picsum.photos/id/${i}/500/500` : undefined, // only every second organization has a logo
    });
  }
  return organizations;
}

export function ProfileCardPlayground(args: ProfileCardPlaygroundProps) {
  const { match, ...profileProps } = args;
  const memberOf = getOrganizations(args.numberOfOrganizations);
  return (
    <div className="w-[352px]">
      <ProfileCard match={match} profile={{ ...profileProps, memberOf }} />
    </div>
  );
}
ProfileCardPlayground.storyName = "Playground";
ProfileCardPlayground.args = {
  firstName: "Sirko",
  lastName: "Kaiser",
  position: "Software Engineer",
  avatar: "https://picsum.photos/id/433/500/500",
  numberOfOrganizations: 0,
};
ProfileCardPlayground.argTypes = {
  numberOfOrganizations: {
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
