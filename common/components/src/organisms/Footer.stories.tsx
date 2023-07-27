import Footer from "./Footer";

export function FooterPlayground() {
  return <Footer />;
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
