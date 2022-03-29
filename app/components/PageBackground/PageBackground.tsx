import imageFile from './default_kitchen.jpg';

export interface PageBackgroundProps {}

function PageBackground(props: PageBackgroundProps) {
  return (
    <div className="fixed inset-y-0 left-0 h-screen w-[calc(50%_-_151px)] bg-center bg-cover z-0"
      style={{
        backgroundImage: `url(${imageFile})`
      }}  
    >          
    </div>
  );
}

export default PageBackground;
