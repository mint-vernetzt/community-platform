import { Button } from "@mint-vernetzt/components";
import React from "react";

function Filter() {
  return (
    <section
      id="roadmap"
      className="bg-[linear-gradient(358.45deg,_#FFFFFF_12.78%,_rgba(255,255,255,0.4)_74.48%,_rgba(255,255,255,0.4)_98.12%)] mv-py-16 lg:mv-py-24"
    >
      <div className="mv-container mv-bg-gray-600 mv-p-16 mv-pb-64">
        <div className="filter-item-list mv-flex mv-gap-4 mv-items-start">
          <div className="filter-item mv-relative active">
            <button className="filter-select mv-flex mv-items-center mv-px-4 mv-py-1.5 mv-gap-2 mv-rounded-lg mv-bg-gray-100 mv-border mv-border-gray-100	hover:mv-text-primary-500 hover:mv-border-primary-500 mv-font-semibold">
              <span>Checkbox als BG</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                className="mv-rotate-90"
              >
                <path
                  fill="currentColor"
                  fillRule="nonzero"
                  d="M6.147 15.854a.5.5 0 0 1 0-.708L11.794 9.5 6.147 3.855a.5.5 0 1 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0v-.001Z"
                ></path>
              </svg>
            </button>

            <div className="mv-w-72 mv-absolute mv-top-[calc(100%+0.5rem)] mv-left-0"></div>
            <div className="filter-list mv-w-72 mv-mt-2 mv-bg-white mv-rounded-lg mv-py-2">
              <ul>
                <li className="mv-relative">
                  <input
                    type="checkbox"
                    id="checkbox-1-1"
                    className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                  />
                  <label
                    className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer hover:mv-bg-gray-100 mv-transition"
                    htmlFor="checkbox-1-1"
                  >
                    <span>Online-Format</span>
                    <span className="mv-ml-auto">2</span>
                    <div className="mv-w-6 mv-h-6 checkbox-replace"></div>
                  </label>
                </li>
                <li className="mv-relative">
                  <input
                    type="checkbox"
                    id="checkbox-1-2"
                    className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                  />
                  <label
                    className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer hover:mv-bg-gray-100 mv-transition"
                    htmlFor="checkbox-1-2"
                  >
                    <span>Workshop / Kurs</span>
                    <span className="mv-ml-auto">2</span>
                    <div className="mv-w-6 mv-h-6 checkbox-replace"></div>
                  </label>
                </li>
              </ul>
            </div>
          </div>

          <div className="filter-item mv-relative">
            <button className="filter-select mv-flex mv-items-center mv-px-4 mv-py-1.5 mv-gap-2 mv-rounded-lg mv-bg-gray-100 mv-border mv-border-gray-100	hover:mv-text-primary-500 hover:mv-border-primary-500 mv-font-semibold">
              <span>Checkbox als svg</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
              >
                <path
                  fill="currentColor"
                  fillRule="nonzero"
                  d="M6.147 15.854a.5.5 0 0 1 0-.708L11.794 9.5 6.147 3.855a.5.5 0 1 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0v-.001Z"
                ></path>
              </svg>
            </button>

            <div className="filter-list mv-w-72 mv-absolute mv-top-[calc(100%+0.5rem)] mv-left-0 mv-hidden">
              <ul className="mv-bg-white mv-rounded-lg mv-py-2">
                <li className="mv-relative mv-peer">
                  <input
                    type="checkbox"
                    id="checkbox-2-1"
                    className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute "
                  />
                  <label
                    className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer hover:mv-bg-gray-100 mv-items-center"
                    htmlFor="checkbox-2-1"
                  >
                    <span>Online-Format</span>
                    <span className="mv-ml-auto">2</span>
                    <div className="mv-w-5 mv-h-5 mv-relative">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="icon-unchecked"
                      >
                        <path
                          fill="currentColor"
                          d="M14 1C14.5523 1 15 1.44772 15 2V14C15 14.5523 14.5523 15 14 15H2C1.44772 15 1 14.5523 1 14V2C1 1.44772 1.44772 1 2 1H14ZM2 0C0.895431 0 0 0.895431 0 2V14C0 15.1046 0.895431 16 2 16H14C15.1046 16 16 15.1046 16 14V2C16 0.895431 15.1046 0 14 0H2Z"
                        />
                      </svg>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 16 16"
                        className="icon-checked"
                      >
                        <path
                          fill="currentColor"
                          d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12ZM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2Z"
                        />
                        <path
                          fill="currentColor"
                          d="M10.97 4.97a.75.75 0 0 1 1.071 1.05l-3.992 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.235.235 0 0 1 .02-.022Z"
                        />
                      </svg>
                    </div>
                  </label>
                </li>
              </ul>
            </div>
          </div>

          <div className="filter-item mv-relative active">
            <button className="filter-select mv-flex mv-items-center mv-px-4 mv-py-1.5 mv-gap-2 mv-rounded-lg mv-bg-gray-100 mv-border mv-border-gray-100	hover:mv-text-primary-500 hover:mv-border-primary-500 mv-font-semibold">
              <span>Radio</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                className="mv-rotate-90"
              >
                <path
                  fill="currentColor"
                  fillRule="nonzero"
                  d="M6.147 15.854a.5.5 0 0 1 0-.708L11.794 9.5 6.147 3.855a.5.5 0 1 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0v-.001Z"
                ></path>
              </svg>
            </button>

            <div className="mv-w-72 mv-absolute mv-top-[calc(100%+0.5rem)] mv-left-0"></div>
            <div className="filter-list mv-w-72 mv-mt-2">
              <ul className="mv-bg-white mv-rounded-lg mv-py-2">
                <li className="mv-relative">
                  <input
                    className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                    type="radio"
                    name="radio-example"
                    id="radio-1-1"
                  />
                  <label
                    className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer hover:mv-bg-gray-100 mv-transition"
                    htmlFor="radio-1-1"
                  >
                    <span>Online-Format</span>
                    <span className="mv-ml-auto">2</span>
                    <div className="mv-w-6 mv-h-6 checkbox-replace"></div>
                  </label>
                </li>
                <li className="mv-relative">
                  <input
                    className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                    type="radio"
                    name="radio-example"
                    id="radio-1-2"
                  />
                  <label
                    className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer hover:mv-bg-gray-100 mv-transition"
                    htmlFor="radio-1-2"
                  >
                    <span>Workshop / Kurs</span>
                    <span className="mv-ml-auto">2</span>
                    <div className="mv-w-6 mv-h-6 checkbox-replace"></div>
                  </label>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Filter;
