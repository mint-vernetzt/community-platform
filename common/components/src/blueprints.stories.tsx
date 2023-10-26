import React from "react";
import List from "./organisms/List";
import Avatar from "./molecules/Avatar";

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

export function AutoCompleteReplacementPlayground() {
  const [results, setResults] = React.useState<typeof users>([]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (value.length > 3) {
      const filteredResults = users.filter((user) => {
        const lowercasedValue = value.toLowerCase();
        return (
          user.firstName.toLowerCase().includes(lowercasedValue) ||
          user.lastName.toLowerCase().includes(lowercasedValue) ||
          user.position.toLowerCase().includes(lowercasedValue)
        );
      });
      setResults(filteredResults);
    } else {
      setResults([]);
    }
  };

  return (
    <div className="mv-p-6">
      <input onChange={handleChange} />
      <List>
        {results.map((item) => {
          return (
            <List.Item key={item.username}>
              <Avatar
                firstName={item.firstName}
                lastName={item.lastName}
                avatar={item.avatar}
              />
              <List.Item.Title>
                {item.firstName} {item.lastName}
              </List.Item.Title>
              <List.Item.Subtitle>{item.position}</List.Item.Subtitle>
            </List.Item>
          );
        })}
      </List>
    </div>
  );
}
AutoCompleteReplacementPlayground.args = {};
AutoCompleteReplacementPlayground.argTypes = {};
AutoCompleteReplacementPlayground.storyName = "Auto Complete Replacement";
AutoCompleteReplacementPlayground.parameters = {
  controls: { disable: false },
  viewport: {
    defaultViewport: "xl",
  },
  layout: "fullscreen",
};

export default {
  title: "Blueprints",
  parameters: {
    controls: { disable: true },
    actions: {
      disable: true,
    },
  },
};
