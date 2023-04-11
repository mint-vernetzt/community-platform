import type { Meta } from "@storybook/react";
import colors from "../styles/config/colors";

type ColorProps = {
  backgroundColor: string;
};

function Color(props: ColorProps) {
  const { backgroundColor } = props;
  const color = backgroundColor.replace("bg-", "");
  const hex = colors[color as keyof typeof colors];

  return (
    <div className="w-32 text-xs">
      <div className={`rounded-[5px] w-32 h-12 mb-2 ${backgroundColor}`} />
      <div className="flex justify-between">
        <p>{color}</p>
        <p>{hex}</p>
      </div>
    </div>
  );
}

export function Colors() {
  return (
    <>
      <div className="mb-2 grid grid-flow-col auto-cols-max gap-2">
        <Color backgroundColor="bg-neutral-50" />
        <Color backgroundColor="bg-neutral-100" />
        <Color backgroundColor="bg-neutral-200" />
        <Color backgroundColor="bg-neutral-300" />
        <Color backgroundColor="bg-neutral-400" />
        <Color backgroundColor="bg-neutral-500" />
        <Color backgroundColor="bg-neutral-600" />
        <Color backgroundColor="bg-neutral-700" />
        <Color backgroundColor="bg-neutral-800" />
        <Color backgroundColor="bg-neutral-900" />
      </div>
      <div className="mb-2 grid grid-flow-col auto-cols-max gap-2">
        <Color backgroundColor="bg-primary-50" />
        <Color backgroundColor="bg-primary-100" />
        <Color backgroundColor="bg-primary-200" />
        <Color backgroundColor="bg-primary-300" />
        <Color backgroundColor="bg-primary-400" />
        <Color backgroundColor="bg-primary-500" />
        <Color backgroundColor="bg-primary-600" />
        <Color backgroundColor="bg-primary-700" />
        <Color backgroundColor="bg-primary-800" />
        <Color backgroundColor="bg-primary-900" />
      </div>
    </>
  );
}

export default {
  title: "Atoms/Colors",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
} as Meta;
