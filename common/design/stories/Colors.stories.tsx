import type { Meta } from "@storybook/react";
import colors from "../styles/theme/colors";

type ColorProps = {
  backgroundColor: string;
};

function Color(props: ColorProps) {
  const { backgroundColor } = props;
  const color = backgroundColor.replace("bg-", "");
  const colorName = color.split("-")[0];
  const colorShape = color.split("-")[1];
  const hex = colors[colorName][colorShape];

  return (
    <div className="w-32 text-xs">
      <div className={`rounded-[5px] w-full h-12 mb-2 ${backgroundColor}`} />
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
        <Color backgroundColor="bg-gray-50" />
        <Color backgroundColor="bg-gray-100" />
        <Color backgroundColor="bg-gray-200" />
        <Color backgroundColor="bg-gray-300" />
        <Color backgroundColor="bg-gray-400" />
        <Color backgroundColor="bg-gray-500" />
        <Color backgroundColor="bg-gray-600" />
        <Color backgroundColor="bg-gray-700" />
        <Color backgroundColor="bg-gray-800" />
        <Color backgroundColor="bg-gray-900" />
      </div>
      <div className="mb-2 grid grid-flow-col auto-cols-max gap-2">
        <Color backgroundColor="bg-blue-50" />
        <Color backgroundColor="bg-blue-100" />
        <Color backgroundColor="bg-blue-200" />
        <Color backgroundColor="bg-blue-300" />
        <Color backgroundColor="bg-blue-400" />
        <Color backgroundColor="bg-blue-500" />
        <Color backgroundColor="bg-blue-600" />
        <Color backgroundColor="bg-blue-700" />
        <Color backgroundColor="bg-blue-800" />
        <Color backgroundColor="bg-blue-900" />
      </div>
      <div className="mb-2 grid grid-flow-col auto-cols-max gap-2">
        <Color backgroundColor="bg-lilac-50" />
        <Color backgroundColor="bg-lilac-100" />
        <Color backgroundColor="bg-lilac-200" />
        <Color backgroundColor="bg-lilac-300" />
        <Color backgroundColor="bg-lilac-400" />
        <Color backgroundColor="bg-lilac-500" />
        <Color backgroundColor="bg-lilac-600" />
        <Color backgroundColor="bg-lilac-700" />
        <Color backgroundColor="bg-lilac-800" />
        <Color backgroundColor="bg-lilac-900" />
      </div>
      <div className="mb-2 grid grid-flow-col auto-cols-max gap-2">
        <Color backgroundColor="bg-beige-50" />
        <Color backgroundColor="bg-beige-100" />
        <Color backgroundColor="bg-beige-200" />
        <Color backgroundColor="bg-beige-300" />
        <Color backgroundColor="bg-beige-400" />
        <Color backgroundColor="bg-beige-500" />
        <Color backgroundColor="bg-beige-600" />
        <Color backgroundColor="bg-beige-700" />
        <Color backgroundColor="bg-beige-800" />
        <Color backgroundColor="bg-beige-900" />
      </div>
      <div className="mb-2 grid grid-flow-col auto-cols-max gap-2">
        <Color backgroundColor="bg-green-50" />
        <Color backgroundColor="bg-green-100" />
        <Color backgroundColor="bg-green-200" />
        <Color backgroundColor="bg-green-300" />
        <Color backgroundColor="bg-green-400" />
        <Color backgroundColor="bg-green-500" />
        <Color backgroundColor="bg-green-600" />
        <Color backgroundColor="bg-green-700" />
        <Color backgroundColor="bg-green-800" />
        <Color backgroundColor="bg-green-900" />
      </div>
      <div className="mb-2 grid grid-flow-col auto-cols-max gap-2">
        <Color backgroundColor="bg-yellow-50" />
        <Color backgroundColor="bg-yellow-100" />
        <Color backgroundColor="bg-yellow-200" />
        <Color backgroundColor="bg-yellow-300" />
        <Color backgroundColor="bg-yellow-400" />
        <Color backgroundColor="bg-yellow-500" />
        <Color backgroundColor="bg-yellow-600" />
        <Color backgroundColor="bg-yellow-700" />
        <Color backgroundColor="bg-yellow-800" />
        <Color backgroundColor="bg-yellow-900" />
      </div>
      <div className="mb-2 grid grid-flow-col auto-cols-max gap-2">
        <Color backgroundColor="bg-salmon-50" />
        <Color backgroundColor="bg-salmon-100" />
        <Color backgroundColor="bg-salmon-200" />
        <Color backgroundColor="bg-salmon-300" />
        <Color backgroundColor="bg-salmon-400" />
        <Color backgroundColor="bg-salmon-500" />
        <Color backgroundColor="bg-salmon-600" />
        <Color backgroundColor="bg-salmon-700" />
        <Color backgroundColor="bg-salmon-800" />
        <Color backgroundColor="bg-salmon-900" />
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
