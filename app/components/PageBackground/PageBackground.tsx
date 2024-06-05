export interface PageBackgroundProps {
  imagePath: string;
}

function PageBackground(props: PageBackgroundProps) {
  return (
    <div
      className="hidden @md:mv-block absolute h-[calc(100vh-76px)] @lg:mv-h-[calc(100vh-88px)] -inset-y-8 left-0 w-[calc(50%_-_16px)] @lg:mv-w-[calc(50%_-_104px)] @xl:mv-w-[calc(50%_-_126px)] @2xl:mv-w-[calc(50%_-_148px)] bg-center bg-cover z-0"
      style={{
        backgroundImage: `url(${props.imagePath})`,
      }}
    ></div>
  );
}

export default PageBackground;
