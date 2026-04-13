import { Avatar } from "@mint-vernetzt/components/src/molecules/Avatar";
import { getFullName } from "@mint-vernetzt/components/src/utils";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { hasContent } from "~/utils.shared";

function ContactPersonContainer(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-6 ring ring-neutral-200 rounded-2xl md:p-0 md:ring-0 md:ring-none">
      {props.children}
    </div>
  );
}

function ContactPerson(props: {
  academicTitle: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  locales: {
    contactPerson: string;
  };
}) {
  const { email, phone, locales } = props;
  const [emailCopiedToClipboard, setEmailCopiedToClipboard] = useState(false);
  const [phoneCopiedToClipboard, setPhoneCopiedToClipboard] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setEmailCopiedToClipboard(false);
    }, 3000);
    return () => {
      clearTimeout(timeout);
    };
  }, [emailCopiedToClipboard]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPhoneCopiedToClipboard(false);
    }, 3000);
    return () => {
      clearTimeout(timeout);
    };
  }, [phoneCopiedToClipboard]);

  const handleCopyToClipboard = (text: string, type: "email" | "phone") => {
    void navigator.clipboard.writeText(text);
    if (type === "email") {
      setEmailCopiedToClipboard(true);
    } else {
      setPhoneCopiedToClipboard(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 items-center">
        <div className="w-16 h-16">
          <Avatar size="full" {...props} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-neutral-600">
            {locales.contactPerson}
          </span>
          <span className="text-xl font-bold leading-6 text-primary-500">
            {getFullName(props)}
          </span>
        </div>
      </div>
      {hasContent(email) && hasContent(phone) && (
        <div className="flex flex-col gap-2">
          {hasContent(email) && (
            <div className="flex items-center justify-between py-3 px-4 bg-neutral-100 rounded-lg">
              <Link
                to={`mailto:${email}`}
                rel="noopener noreferrer"
                target="_blank"
                className="flex gap-4 items-center"
              >
                <span className="text-neutral-700 font-semibold">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 6.6001C0 5.80445 0.316071 5.04139 0.87868 4.47878C1.44129 3.91617 2.20435 3.6001 3 3.6001H21C21.7956 3.6001 22.5587 3.91617 23.1213 4.47878C23.6839 5.04139 24 5.80445 24 6.6001V18.6001C24 19.3957 23.6839 20.1588 23.1213 20.7214C22.5587 21.284 21.7956 21.6001 21 21.6001H3C2.20435 21.6001 1.44129 21.284 0.87868 20.7214C0.316071 20.1588 0 19.3957 0 18.6001V6.6001ZM3 5.1001C2.60218 5.1001 2.22064 5.25813 1.93934 5.53944C1.65804 5.82074 1.5 6.20227 1.5 6.6001V6.9256L12 13.2256L22.5 6.9256V6.6001C22.5 6.20227 22.342 5.82074 22.0607 5.53944C21.7794 5.25813 21.3978 5.1001 21 5.1001H3ZM22.5 8.6746L15.438 12.9121L22.5 17.2576V8.6746ZM22.449 18.9886L13.989 13.7821L12 14.9746L10.011 13.7821L1.551 18.9871C1.63624 19.3063 1.82447 19.5884 2.08648 19.7897C2.34849 19.9909 2.66962 20.1 3 20.1001H21C21.3302 20.1001 21.6512 19.9912 21.9131 19.7903C22.1751 19.5893 22.3635 19.3075 22.449 18.9886ZM1.5 17.2576L8.562 12.9121L1.5 8.6746V17.2576Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>{email}</span>
              </Link>
              <div>
                {emailCopiedToClipboard ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M13.8536 3.64645C14.0488 3.84171 14.0488 4.15829 13.8536 4.35355L6.85355 11.3536C6.75979 11.4473 6.63261 11.5 6.5 11.5C6.36739 11.5 6.24021 11.4473 6.14645 11.3536L2.64645 7.85355C2.45118 7.65829 2.45118 7.34171 2.64645 7.14645C2.84171 6.95118 3.15829 6.95118 3.35355 7.14645L6.5 10.2929L13.1464 3.64645C13.3417 3.45118 13.6583 3.45118 13.8536 3.64645Z"
                      fill="#3C4658"
                    />
                  </svg>
                ) : (
                  <button
                    onClick={() => {
                      handleCopyToClipboard(email, "email");
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M13 0H6C4.89543 0 4 0.89543 4 2C2.89543 2 2 2.89543 2 4V14C2 15.1046 2.89543 16 4 16H11C12.1046 16 13 15.1046 13 14C14.1046 14 15 13.1046 15 12V2C15 0.89543 14.1046 0 13 0ZM13 13V4C13 2.89543 12.1046 2 11 2H5C5 1.44772 5.44772 1 6 1H13C13.5523 1 14 1.44772 14 2V12C14 12.5523 13.5523 13 13 13ZM3 4C3 3.44772 3.44772 3 4 3H11C11.5523 3 12 3.44772 12 4V14C12 14.5523 11.5523 15 11 15H4C3.44772 15 3 14.5523 3 14V4Z"
                        fill="#3C4658"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
          {hasContent(phone) && (
            <div className="flex items-center justify-between py-3 px-4 bg-neutral-100 rounded-lg">
              <Link
                to={`tel:${phone}`}
                rel="noopener noreferrer"
                target="_blank"
                className="flex gap-4 items-center"
              >
                <span className="text-neutral-700 font-semibold">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.13358 2.99335C6.05388 2.89083 5.95329 2.80645 5.83848 2.7458C5.72367 2.68515 5.59726 2.64962 5.46767 2.64158C5.33807 2.63353 5.20824 2.65316 5.08681 2.69914C4.96538 2.74513 4.85513 2.81643 4.76337 2.9083L3.36751 4.30552C2.71548 4.9589 2.47519 5.88363 2.76003 6.69496C3.94224 10.0531 5.86533 13.102 8.38666 15.6155C10.9002 18.1368 13.9491 20.0599 17.3072 21.2422C18.1185 21.527 19.0432 21.2868 19.6966 20.6347L21.0925 19.2389C21.1843 19.1471 21.2556 19.0368 21.3016 18.9154C21.3476 18.794 21.3672 18.6642 21.3592 18.5346C21.3511 18.405 21.3156 18.2785 21.255 18.1637C21.1943 18.0489 21.1099 17.9483 21.0074 17.8686L17.8931 15.4468C17.7835 15.3619 17.6562 15.3029 17.5205 15.2744C17.3849 15.2458 17.2445 15.2485 17.1101 15.2821L14.1537 16.0205C13.7591 16.1192 13.3456 16.1139 12.9536 16.0053C12.5616 15.8968 12.2044 15.6885 11.9168 15.4009L8.6013 12.084C8.31345 11.7965 8.10496 11.4394 7.99613 11.0474C7.88731 10.6554 7.88186 10.2419 7.98032 9.84713L8.7201 6.89071C8.75372 6.75624 8.75637 6.6159 8.72784 6.48026C8.69931 6.34463 8.64035 6.21725 8.5554 6.10772L6.13358 2.99335ZM3.74415 1.89043C3.98039 1.65411 4.26419 1.47076 4.57672 1.35255C4.88925 1.23433 5.22336 1.18396 5.55685 1.20477C5.89034 1.22558 6.21559 1.3171 6.511 1.47326C6.80641 1.62941 7.06522 1.84662 7.27024 2.11047L9.69207 5.2235C10.1362 5.79453 10.2928 6.53836 10.1173 7.24035L9.37887 10.1968C9.3407 10.3499 9.34276 10.5103 9.38486 10.6624C9.42697 10.8145 9.50768 10.9531 9.61917 11.0648L12.936 14.3817C13.0478 14.4934 13.1867 14.5742 13.339 14.6163C13.4914 14.6585 13.6521 14.6604 13.8054 14.622L16.7604 13.8835C17.1069 13.7969 17.4684 13.7902 17.8178 13.8639C18.1672 13.9375 18.4953 14.0897 18.7773 14.3088L21.8903 16.7306C23.0094 17.6013 23.112 19.2551 22.1103 20.2554L20.7145 21.6512C19.7155 22.6502 18.2224 23.089 16.8306 22.5989C13.2684 21.3455 10.034 19.3061 7.36744 16.6321C4.69356 13.9659 2.65421 10.732 1.40062 7.17015C0.91194 5.77968 1.35068 4.28527 2.34965 3.28629L3.7455 1.89043H3.74415Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>{phone}</span>
              </Link>
              <div>
                {phoneCopiedToClipboard ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M13.8536 3.64645C14.0488 3.84171 14.0488 4.15829 13.8536 4.35355L6.85355 11.3536C6.75979 11.4473 6.63261 11.5 6.5 11.5C6.36739 11.5 6.24021 11.4473 6.14645 11.3536L2.64645 7.85355C2.45118 7.65829 2.45118 7.34171 2.64645 7.14645C2.84171 6.95118 3.15829 6.95118 3.35355 7.14645L6.5 10.2929L13.1464 3.64645C13.3417 3.45118 13.6583 3.45118 13.8536 3.64645Z"
                      fill="#3C4658"
                    />
                  </svg>
                ) : (
                  <button
                    onClick={() => {
                      handleCopyToClipboard(phone, "phone");
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M13 0H6C4.89543 0 4 0.89543 4 2C2.89543 2 2 2.89543 2 4V14C2 15.1046 2.89543 16 4 16H11C12.1046 16 13 15.1046 13 14C14.1046 14 15 13.1046 15 12V2C15 0.89543 14.1046 0 13 0ZM13 13V4C13 2.89543 12.1046 2 11 2H5C5 1.44772 5.44772 1 6 1H13C13.5523 1 14 1.44772 14 2V12C14 12.5523 13.5523 13 13 13ZM3 4C3 3.44772 3.44772 3 4 3H11C11.5523 3 12 3.44772 12 4V14C12 14.5523 11.5523 15 11 15H4C3.44772 15 3 14.5523 3 14V4Z"
                        fill="#3C4658"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

ContactPerson.Container = ContactPersonContainer;

export default ContactPerson;
