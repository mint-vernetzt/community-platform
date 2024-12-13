import { Button } from "../molecules/Button";
import { Avatar } from "../molecules/Avatar";
import { List, ListItem } from "./List";

export function Workspace() {
  return (
    <ListItem>
      <ListItem.Preview />
    </ListItem>
  );
}

export function ListItemPlayground() {
  return (
    <div className="mv-p-6 mv-flex mv-flex-col mv-gap-4">
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
      <ListItem size="sm" interactive noBorder>
        <a href="#">
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
        </a>
      </ListItem>
    </div>
  );
}
ListItemPlayground.storyName = "Playground (item)";
ListItemPlayground.args = {};
ListItemPlayground.argTypes = {};
ListItemPlayground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

const users = [
  {
    firstName: "Maria",
    lastName: "Lupan",
    username: "marialupan",
    avatar: "./maria-lupan-fE5IaNta2KM-unsplash.jpg",
    position: "Head of Development",
  },
  {
    firstName: "Jonas",
    lastName: "Kakaroto",
    username: "jonaskakaroto",
    avatar: "./jonas-kakaroto-KIPqvvTOC1s-unsplash.jpg",
    position: "Frontend-Developer",
  },
  {
    firstName: "Toa",
    lastName: "Heftiba",
    username: "toaheftiba",
    avatar: "./toa-heftiba-O3ymvT7Wf9U-unsplash.jpg",
    position: "Backend-Developer",
  },
  {
    firstName: "Behrouz",
    lastName: "Sasani",
    username: "behrouzsasani",
    avatar: "./behrouz-sasani-XYY5KE1NH84-unsplash.jpg",
    position: "UX-Designer",
  },
];

export function ListPlayground() {
  return (
    <>
      <div className="mv-p-6">
        <List>
          {users.map((item) => {
            return (
              <List.Item key={item.username}>
                <Avatar
                  firstName={item.firstName}
                  lastName={item.lastName}
                  avatar={item.avatar}
                  size="lg"
                />
                <ListItem.Info>
                  <ListItem.Title>
                    {item.firstName} {item.lastName}
                  </ListItem.Title>
                  <ListItem.Subtitle>{item.position}</ListItem.Subtitle>
                </ListItem.Info>
                <ListItem.Controls>
                  <Button variant="outline">Edit</Button>
                </ListItem.Controls>
              </List.Item>
            );
          })}
        </List>
      </div>
      <div className="mv-p-6">
        <List maxColumns={2}>
          {users.map((item) => {
            return (
              <List.Item key={item.username} interactive noBorder>
                <a href="#">
                  <Avatar
                    firstName={item.firstName}
                    lastName={item.lastName}
                    avatar={item.avatar}
                    size="lg"
                  />
                  <ListItem.Info>
                    <ListItem.Title>
                      {item.firstName} {item.lastName}
                    </ListItem.Title>
                    <ListItem.Subtitle>{item.position}</ListItem.Subtitle>
                  </ListItem.Info>
                </a>
              </List.Item>
            );
          })}
        </List>
      </div>
    </>
  );
}
ListPlayground.storyName = "Playground (list)";
ListPlayground.args = {};
ListPlayground.argTypes = {};
ListPlayground.parameters = {
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
