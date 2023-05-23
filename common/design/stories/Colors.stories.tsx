import type { Meta } from "@storybook/react";
import { aliases as colors } from "../styles/theme/colors";

const shapes = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
] as const;

type ShapeNumber = typeof shapes[number];

function Shape(props: {
  colorName: keyof typeof colors;
  shapeNumber: ShapeNumber;
}) {
  const { colorName, shapeNumber } = props;
  const hex = colors[colorName][shapeNumber];

  return (
    <div className="mv-w-32 mv-text-xs">
      <div
        className={`mv-rounded-[5px] mv-w-full mv-h-12 mv-mb-2 mv-bg-${colorName}-${shapeNumber}`}
      />
      <div className="mv-flex mv-justify-between">
        <p>
          mv-{colorName}-{shapeNumber}
        </p>
        <p>{hex}</p>
      </div>
    </div>
  );
}

function Color(props: { colorName: keyof typeof colors }) {
  const { colorName } = props;

  return (
    <div className="mv-mb-2 mv-grid mv-grid-flow-col mv-auto-cols-max mv-gap-2">
      {shapes.map((shapeNumber) => {
        return (
          <Shape
            key={`${colorName}-${shapeNumber}`}
            colorName={colorName}
            shapeNumber={shapeNumber as ShapeNumber}
          />
        );
      })}
    </div>
  );
}

export function Colors() {
  return (
    <>
      {Object.keys(colors).map((colorName) => {
        return (
          <Color key={colorName} colorName={colorName as keyof typeof colors} />
        );
      })}
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
