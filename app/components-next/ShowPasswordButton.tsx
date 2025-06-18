export function ShowPasswordButton(
  props: React.PropsWithChildren & React.HTMLAttributes<HTMLButtonElement>
) {
  const { children, ...buttonProps } = props;

  return (
    <button
      type="button"
      className="mv-w-full mv-h-full mv-grid mv-grid-cols-1 mv-grid-rows-1 mv-place-items-center mv-py-2 mv-px-[10px] mv-rounded-lg mv-border mv-border-gray-300 hover:mv-bg-neutral-50 focus:mv-bg-neutral-50 active:mv-bg-neutral-100 peer-focus:mv-border-blue-400 peer-focus:mv-ring-2 peer-focus:mv-ring-blue-500 mv-cursor-pointer"
      {...buttonProps}
    >
      {children}
    </button>
  );
}
