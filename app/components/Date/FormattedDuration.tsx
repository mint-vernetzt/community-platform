import React from "react";
import { getDuration } from "~/lib/utils/time";

function FormattedDuration(props: { startDate: string; endDate: string }) {
  const [initialRenderDone, setInitialRenderDone] = React.useState(false);

  React.useEffect(() => {
    if (initialRenderDone === false) {
      setInitialRenderDone(true);
    }
  }, [initialRenderDone]);

  if (initialRenderDone) {
    const startTime = new Date(props.startDate);
    const endTime = new Date(props.endDate);
    const duration = getDuration(startTime, endTime);
    return <>{duration}</>;
  } else {
    return (
      <>
        {props.startDate} - {props.endDate}
      </>
    );
  }
}

export default FormattedDuration;
