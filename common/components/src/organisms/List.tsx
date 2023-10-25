import Button from "../molecules/Button";
import Avatar from "../molecules/Avatar";

function List() {
  return <>List</>;
}

export function ListItem() {
  return (
    <li className="mv-flex mv-flex-row mv-items-center mv-no-wrap mv-p-4 mv-gap-2 mv-border mv-rounded-lg">
      <Avatar
        firstName="Maria"
        lastName="Lupan"
        avatar="./maria-lupan-fE5IaNta2KM-unsplash.jpg"
        size="lg"
      />
      <div className="mv-flex-1">
        <p className="mv-text-primary mv-font-bold mv-line-clamp-1">
          Maria Lupan
        </p>
        <p className="mv-text-neutral-700 mv-font-bold mv-text-sm mv-line-clamp-1">
          Admin
        </p>
      </div>
      <Button variant="outline">Edit</Button>
    </li>
  );
}

List.Item = ListItem;

export default List;
