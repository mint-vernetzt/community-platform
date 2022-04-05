import imageFile from "./default_kitchen.jpg";

export interface PageBackgroundProps {}

function PageBackground(props: PageBackgroundProps) {
  return (
    <div
      className="fixed inset-y-0 left-0 h-screen w-[calc(50%_-_16px)] lg:w-[calc(50%_-_104px)] xl:w-[calc(50%_-_126px)] 2xl:w-[calc(50%_-_148px)] bg-center bg-cover z-0"
      style={{
        backgroundImage: `url(${imageFile})`,
      }}
    ></div>
  );
}

export default PageBackground;
