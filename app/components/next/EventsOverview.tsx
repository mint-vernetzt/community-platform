function EventsOverview(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col border border-neutral-200 rounded-2xl overflow-hidden">
      {props.children}
    </div>
  );
}

function Container(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col p-6 bg-white gap-6">{props.children}</div>
  );
}
type HeadlineProps = {
  children: React.ReactNode;
};

function EventName(props: HeadlineProps) {
  return (
    <h1 className="text-primary font-bold text-3xl/7 m-0 sm:mb-2">
      {props.children}
    </h1>
  );
}

EventsOverview.EventName = EventName;
EventsOverview.Container = Container;

export default EventsOverview;
