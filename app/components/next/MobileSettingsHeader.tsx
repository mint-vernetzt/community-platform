import { Children, isValidElement } from "react";

// Design:
// Name: Header
// Source: https://www.figma.com/design/EcsrhGDlDkVEYRAI1qmcD6/MINTvernetzt?node-id=10460-7441&t=tfQdYMN5AFhmqikL-4
function MobileSettingsHeader(props: { children: React.ReactNode }) {
  const { children } = props;

  const childrenArray = Children.toArray(children);

  const close = childrenArray.find((child) => {
    return isValidElement(child) && child.type === Close;
  });

  const back = childrenArray.find((child) => {
    return isValidElement(child) && child.type === Back;
  });

  const otherChildren = childrenArray.filter((child) => {
    return child !== close && child !== back;
  });

  return (
    <div className="flex xl:hidden items-center p-4 justify-between gap-2">
      {typeof back !== "undefined" ? back : <div className="w-10 h-10"></div>}
      {otherChildren}
      {typeof close !== "undefined" ? close : <div className="w-10 h-10"></div>}
    </div>
  );
}

function Close(props: { children: React.ReactNode }) {
  const { children } = props;

  return <>{children}</>;
}

function CloseIcon() {
  return (
    <div className="flex items-center justify-center w-10 h-10">
      <svg
        width="35"
        height="36"
        viewBox="0 0 35 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10.1631 10.4536C10.2647 10.3488 10.3854 10.2657 10.5183 10.209C10.6512 10.1522 10.7936 10.123 10.9375 10.123C11.0814 10.123 11.2238 10.1522 11.3567 10.209C11.4896 10.2657 11.6103 10.3488 11.7119 10.4536L17.5 16.4093L23.2881 10.4536C23.3898 10.349 23.5105 10.266 23.6434 10.2094C23.7763 10.1528 23.9187 10.1236 24.0625 10.1236C24.2063 10.1236 24.3487 10.1528 24.4816 10.2094C24.6145 10.266 24.7352 10.349 24.8369 10.4536C24.9386 10.5582 25.0192 10.6823 25.0743 10.819C25.1293 10.9557 25.1576 11.1021 25.1576 11.2501C25.1576 11.398 25.1293 11.5445 25.0743 11.6811C25.0192 11.8178 24.9386 11.942 24.8369 12.0466L19.0466 18.0001L24.8369 23.9536C24.9386 24.0582 25.0192 24.1823 25.0743 24.319C25.1293 24.4557 25.1576 24.6021 25.1576 24.7501C25.1576 24.898 25.1293 25.0445 25.0743 25.1811C25.0192 25.3178 24.9386 25.442 24.8369 25.5466C24.7352 25.6512 24.6145 25.7341 24.4816 25.7907C24.3487 25.8473 24.2063 25.8765 24.0625 25.8765C23.9187 25.8765 23.7763 25.8473 23.6434 25.7907C23.5105 25.7341 23.3898 25.6512 23.2881 25.5466L17.5 19.5908L11.7119 25.5466C11.6102 25.6512 11.4895 25.7341 11.3566 25.7907C11.2237 25.8473 11.0813 25.8765 10.9375 25.8765C10.7937 25.8765 10.6513 25.8473 10.5184 25.7907C10.3855 25.7341 10.2648 25.6512 10.1631 25.5466C10.0614 25.442 9.98077 25.3178 9.92573 25.1811C9.8707 25.0445 9.84237 24.898 9.84237 24.7501C9.84237 24.6021 9.8707 24.4557 9.92573 24.319C9.98077 24.1823 10.0614 24.0582 10.1631 23.9536L15.9534 18.0001L10.1631 12.0466C10.0613 11.9421 9.98046 11.8179 9.92532 11.6812C9.87018 11.5446 9.8418 11.398 9.8418 11.2501C9.8418 11.1021 9.87018 10.9556 9.92532 10.8189C9.98046 10.6822 10.0613 10.5581 10.1631 10.4536Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}

function Back(props: { children: React.ReactNode }) {
  const { children } = props;

  return <>{children}</>;
}

function BackIcon() {
  return (
    <div className="flex items-center justify-center w-10 h-10">
      <svg
        width="11"
        height="19"
        viewBox="0 0 11 19"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.1001 9.18933L9.18918 1.09995"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M1.1001 9.18994L9.36493 17.0997"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

MobileSettingsHeader.Close = Close;
MobileSettingsHeader.CloseIcon = CloseIcon;
MobileSettingsHeader.Back = Back;
MobileSettingsHeader.BackIcon = BackIcon;

export default MobileSettingsHeader;
