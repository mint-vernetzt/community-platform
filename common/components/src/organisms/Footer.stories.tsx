import { languageModuleMap } from "~/locales/.server";
import { Footer } from "./Footer";

export function FooterPlayground() {
  const locales = languageModuleMap["de"]["root"];
  return (
    <div className="mv-mt-8">
      <Footer locales={locales} />
    </div>
  );
}
FooterPlayground.storyName = "Playground";
FooterPlayground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export default {
  title: "Organism/Footer",
  component: Footer,
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
