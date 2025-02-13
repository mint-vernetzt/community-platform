import React from "react";
import { List } from "./organisms/List";
import { Avatar } from "./molecules/Avatar";
import { Button } from "./molecules/Button";
import { Toast } from "./molecules/Toast";

const defaultUsers = [
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

// TODO: fix type issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reducer(state: typeof defaultUsers, action: any) {
  switch (action.type) {
    case "remove":
      return state.filter((user) => {
        return user.username !== action.payload;
      });
    default:
      return state;
  }
}

export function AutoCompleteReplacementPlayground() {
  const [results, setResults] = React.useState<typeof users>(() => []);
  const [users, dispatch] = React.useReducer(reducer, defaultUsers);
  const [removedUser, setRemovedUser] = React.useState<
    (typeof users)[0] | null
  >(null);

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

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const { value } = event.currentTarget;
    const [action, username] = value.split("_");
    dispatch({ type: action, payload: username });
  };

  const handleHide = () => {
    setRemovedUser(null);
  };

  React.useEffect(() => {
    const userToRemove = results.find((result) => {
      const user = users.find((user) => {
        return user.username === result.username;
      });

      return typeof user === "undefined";
    });
    const filteredResults = results.filter((result) => {
      const user = users.find((user) => {
        return user.username === result.username;
      });
      return typeof user !== "undefined";
    });
    if (typeof userToRemove !== "undefined") {
      setRemovedUser(userToRemove);
    }
    setResults(filteredResults);
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mv-p-6 mv-flex mv-flex-col mv-gap-4">
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
              <List.Item.Controls>
                <Button
                  value={`remove_${item.username}`}
                  variant="outline"
                  onClick={handleClick}
                >
                  Remove
                </Button>
              </List.Item.Controls>
            </List.Item>
          );
        })}
      </List>
      {removedUser !== null && (
        <Toast onHide={handleHide}>
          {removedUser.firstName} {removedUser.lastName} remove!
        </Toast>
      )}
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
