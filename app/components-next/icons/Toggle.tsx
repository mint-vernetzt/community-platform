// Design:
// Name: toggle-on and toggle-off
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=1731-6501&m=dev
// TODO: fill color, width and height differ from component instance in usage

export function Toggle(
  options: React.SVGProps<SVGSVGElement> & { active: boolean }
) {
  const { active, ...svgProps } = options;

  return active ? (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...svgProps}
    >
      <path
        d="M10 6C4.47715 6 0 10.4772 0 16C0 21.5228 4.47715 26 10 26H22C27.5228 26 32 21.5228 32 16C32 10.4772 27.5228 6 22 6H10ZM22 24C17.5817 24 14 20.4183 14 16C14 11.5817 17.5817 8 22 8C26.4183 8 30 11.5817 30 16C30 20.4183 26.4183 24 22 24Z"
        fill="#154194"
      />
    </svg>
  ) : (
    <svg
      width="32"
      height="32"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...svgProps}
    >
      <path
        d="M11 4C13.2091 4 15 5.79086 15 8C15 10.2091 13.2091 12 11 12H8.00049C9.21466 11.0878 10 9.6356 10 8C10 6.3644 9.21466 4.91223 8.00049 4H11ZM5 12C2.79086 12 1 10.2091 1 8C1 5.79086 2.79086 4 5 4C7.20914 4 9 5.79086 9 8C9 10.2091 7.20914 12 5 12ZM0 8C0 10.7614 2.23858 13 5 13H11C13.7614 13 16 10.7614 16 8C16 5.23858 13.7614 3 11 3H5C2.23858 3 0 5.23858 0 8Z"
        fill="#3C4658"
      />
    </svg>
  );
}
