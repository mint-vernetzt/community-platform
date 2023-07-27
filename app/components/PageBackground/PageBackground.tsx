export interface PageBackgroundProps {
  imagePath: string;
}

function PageBackground(props: PageBackgroundProps) {
  return (
    <div
      className="hidden md:block absolute inset-y-0 left-0 w-[calc(50%_-_16px)] lg:w-[calc(50%_-_104px)] xl:w-[calc(50%_-_126px)] 2xl:w-[calc(50%_-_148px)] bg-center bg-cover z-0"
      style={{
        backgroundImage: `url(${props.imagePath})`,
      }}
    ></div>
  );
}

export default PageBackground;
