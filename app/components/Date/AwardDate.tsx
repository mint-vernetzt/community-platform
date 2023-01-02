import React from "react";

function AwardDate(props: { date: string }) {
  const [initialRenderDone, setInitialRenderDone] = React.useState(false);

  React.useEffect(() => {
    if (initialRenderDone === false) {
      setInitialRenderDone(true);
    }
  }, [initialRenderDone]);

  if (initialRenderDone) {
    const date = new Date(props.date);
    return (
      <p className="text-xxs text-center leading-none">{date.getFullYear()}</p>
    );
  } else {
    return <p className="text-xxs text-center leading-none">{props.date}</p>;
  }
}

export default AwardDate;
