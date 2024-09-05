import { Toast } from "@mint-vernetzt/components";
import { type Toast as ToastType } from "./toast.server";

export function ToastContainer(props: { toast: ToastType }) {
  const { toast } = props;

  return (
    <div className="mv-sticky mv-max-h-fit mv-w-full mv-bottom-0 mv-px-4 @lg:mv-px-32 mv-py-4 mv-z-50">
      <Toast key={toast.key} level={toast.level} delay={5_000}>
        {toast.message}
      </Toast>
    </div>
  );
}