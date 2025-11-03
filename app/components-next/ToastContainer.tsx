import { Toast } from "@mint-vernetzt/components/src/molecules/Toast";
import { type Toast as ToastType } from "./../toast.server";
import { RichText } from "~/components/legacy/Richtext/RichText";

export function ToastContainer(props: { toast: ToastType }) {
  const { toast } = props;

  return (
    <div className="sticky max-h-fit w-full bottom-0 px-4 @lg:px-32 py-4 z-50 shadow-xl">
      <Toast key={toast.key} level={toast.level} delay={toast.delayInMillis}>
        {typeof toast.isRichtext !== "undefined" &&
        toast.isRichtext === true ? (
          <RichText html={toast.message} />
        ) : (
          toast.message
        )}
      </Toast>
    </div>
  );
}
