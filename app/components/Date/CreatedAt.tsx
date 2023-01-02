import React from "react";

function CreatedAt(props: { createdAt: string }) {
  const [initialRenderDone, setInitialRenderDone] = React.useState(false);

  React.useEffect(() => {
    if (initialRenderDone === false) {
      setInitialRenderDone(true);
    }
  }, [initialRenderDone]);

  if (initialRenderDone) {
    const date = new Date(props.createdAt).toLocaleDateString("de-De", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return (
      <p className="text-xs mb-4 text-center">Profil besteht seit dem {date}</p>
    );
  } else {
    return (
      <p className="text-xs mb-4 text-center">
        Profil besteht seit dem {props.createdAt}
      </p>
    );
  }
}

export default CreatedAt;
