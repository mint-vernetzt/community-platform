function SectionDetailHeaderEventImage(props: { children: React.ReactNode }) {
  return (
    <div className="hidden @md:block">
      <div className="relative overflow-hidden w-full aspect-[31/10]">
        {props.children}
      </div>
    </div>
  );
}

export default SectionDetailHeaderEventImage;
