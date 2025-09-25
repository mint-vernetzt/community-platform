export function ShowPasswordButton(
  props: React.PropsWithChildren & React.HTMLAttributes<HTMLButtonElement>
) {
  const { children, ...buttonProps } = props;

  return (
    <button
      type="button"
      className="w-full h-full grid grid-cols-1 grid-rows-1 place-items-center py-2 px-[10px] rounded-lg border border-gray-300 hover:bg-neutral-50 focus:bg-neutral-50 active:bg-neutral-100 peer-focus:border-blue-400 peer-focus:ring-2 peer-focus:ring-blue-500 cursor-pointer"
      {...buttonProps}
    >
      {children}
    </button>
  );
}
