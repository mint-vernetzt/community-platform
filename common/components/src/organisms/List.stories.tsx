import Button from "../molecules/Button";
import Avatar from "../molecules/Avatar";
import { ListItem } from "./List";

export function LinkItemPlayground() {
  return (
    <div className="mv-p-6">
      <ListItem>
        <Avatar
          firstName="Maria"
          lastName="Lupan"
          avatar="./maria-lupan-fE5IaNta2KM-unsplash.jpg"
          size="lg"
        />
        <ListItem.Info>
          <ListItem.Title>Item title</ListItem.Title>
          <ListItem.Subtitle>Item subtitle</ListItem.Subtitle>
        </ListItem.Info>
        <ListItem.Controls>
          <Button variant="outline">Edit</Button>
        </ListItem.Controls>
      </ListItem>
    </div>
  );
}
LinkItemPlayground.storyName = "item";
LinkItemPlayground.args = {};
LinkItemPlayground.argTypes = {};
LinkItemPlayground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export default {
  title: "Organism/List",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
