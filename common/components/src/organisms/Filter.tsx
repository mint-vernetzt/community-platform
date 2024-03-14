import { Button } from "@mint-vernetzt/components";
import React from "react";

function Filter() {
  return (
    <section className="mv-py-16 lg:mv-py-24">
      <div className="mv-container  mv-p-16 mv-pb-64">
        <div className="list-of-filter mv-flex mv-gap-4 mv-items-start">
          {/* Beginn einzelener Filter */}
          <div className="mv-group/filter">
            {/* 
              Label zum Schliessen der Filterliste
              Dieses Label wird nur angezeigt, wenn die Checkbox zum Öffnen der Filter-Item-List aktiviert ist. 
              Dann breitet sich das Label über die gesamte Seite unterhalb der Filter-Item-List aus. 
              Bei Klick auf das Label wird die checkbox wieder unchecked und sowohl die Filter-Item-List als auch das Label selbt werden ausgblendet.
              Somt haben wir eine Element, das bei Klick ausserhalb der Liste diese wieder schliesst.
              
              Achtung... Das ganze Konstrukt funktioniert nur, wenn die Select-Komponente selbst nicht in einem Container, Div etc liegt, der ein position:relative hat. 
              Hat ein umgebenes Element ein position:relative, kann sich das Label nicht über die gesamte Seite legen.

              htmlFor muss mit der ID der Chekcbox mit der Klasse mv-checkbox-filtergroup übereinstimmen.
            */}
            <label
              htmlFor="checkbox-filtergroup-1"
              className="mv-absolute mv-h-dvh mv-w-full mv-hidden mv-inset-0 group-has-[.checkbox-filtergroup:checked]/filter:mv-block group-has-[.checkbox-filtergroup:checked]/filter:mv-z-10"
            ></label>
            <div className="mv-relative">
              <label
                htmlFor="checkbox-filtergroup-1"
                className="mv-peer mv-group filter-select mv-inline-flex mv-items-center mv-px-4 mv-py-1.5 mv-gap-2 mv-rounded-lg mv-bg-gray-100 mv-border mv-border-gray-100 mv-font-semibold	
                hover:mv-text-primary-500 hover:mv-border-primary-500
                has-[:checked]:mv-text-primary-500 has-[:checked]:mv-border-primary-500"
              >
                <input
                  type="checkbox"
                  id="checkbox-filtergroup-1"
                  className="mv-checkbox-filtergroup mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                />
                <span>Projektformat</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  className="mv-rotate-90 group-has-[:checked]:-mv-rotate-90"
                >
                  <path
                    fill="currentColor"
                    fillRule="nonzero"
                    d="M6.147 15.854a.5.5 0 0 1 0-.708L11.794 9.5 6.147 3.855a.5.5 0 1 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0v-.001Z"
                  ></path>
                </svg>
              </label>

              <div className="filter-item-list mv-w-72 mv-bg-white mv-rounded-lg mv-py-2 mv-absolute mv-top-[calc(100%+0.5rem)] mv-left-0 mv-hidden mv-shadow-xl group-has-[.checkbox-filtergroup:checked]/filter:mv-block group-has-[.checkbox-filtergroup:checked]/filter:mv-z-20">
                <ul>
                  <li>
                    <label
                      className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer mv-items-center
                      mv-group
                      hover:mv-bg-gray-100 mv-transition"
                      htmlFor="checkbox-1-1"
                    >
                      <input
                        type="checkbox"
                        id="checkbox-1-1"
                        className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                      />

                      <span>Online-Format</span>
                      <span className="mv-ml-auto">2</span>
                      <div className="mv-w-5 mv-h-5 mv-relative">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                          className="mv-block group-has-[:checked]:mv-hidden"
                        >
                          <path
                            fill="currentColor"
                            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                          />
                        </svg>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                          className="mv-hidden group-has-[:checked]:mv-block"
                        >
                          <path
                            fill="currentColor"
                            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                          />
                          <path
                            fill="currentColor"
                            d="M13.712 6.212a.937.937 0 0 1 1.34 1.312l-4.991 6.238a.938.938 0 0 1-1.349.026L5.404 10.48A.938.938 0 0 1 6.73 9.154l2.617 2.617 4.34-5.53a.3.3 0 0 1 .025-.029Z"
                          />
                        </svg>
                      </div>
                    </label>
                  </li>
                  <li>
                    <label
                      className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer mv-items-center
                      mv-group
                      hover:mv-bg-gray-100 mv-transition"
                      htmlFor="checkbox-1-2"
                    >
                      <input
                        type="checkbox"
                        id="checkbox-1-2"
                        className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                      />

                      <span>Workshop / Kurs</span>
                      <span className="mv-ml-auto">2</span>
                      <div className="mv-w-5 mv-h-5 mv-relative">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                          className="mv-block group-has-[:checked]:mv-hidden"
                        >
                          <path
                            fill="currentColor"
                            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                          />
                        </svg>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                          className="mv-hidden group-has-[:checked]:mv-block"
                        >
                          <path
                            fill="currentColor"
                            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                          />
                          <path
                            fill="currentColor"
                            d="M13.712 6.212a.937.937 0 0 1 1.34 1.312l-4.991 6.238a.938.938 0 0 1-1.349.026L5.404 10.48A.938.938 0 0 1 6.73 9.154l2.617 2.617 4.34-5.53a.3.3 0 0 1 .025-.029Z"
                          />
                        </svg>
                      </div>
                    </label>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/* Ende einzelener Filter */}

          {/* 
            Hier kommen noch zwei weitere Filter zum Testen
            Im letzten befinden sich Radio-Buttons
          */}
          <div className="mv-group/filter">
            <label
              htmlFor="checkbox-filtergroup-2"
              className="mv-absolute mv-h-dvh mv-w-full mv-hidden mv-inset-0 group-has-[.checkbox-filtergroup:checked]/filter:mv-block group-has-[.checkbox-filtergroup:checked]/filter:mv-z-10"
            ></label>
            <div className="mv-relative">
              <label
                htmlFor="checkbox-filtergroup-2"
                className="mv-peer mv-group filter-select mv-inline-flex mv-items-center mv-px-4 mv-py-1.5 mv-gap-2 mv-rounded-lg mv-bg-gray-100 mv-border mv-border-gray-100 mv-font-semibold	
                hover:mv-text-primary-500 hover:mv-border-primary-500
                has-[:checked]:mv-text-primary-500 has-[:checked]:mv-border-primary-500"
              >
                <input
                  type="checkbox"
                  id="checkbox-filtergroup-2"
                  className="mv-checkbox-filtergroup mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                />
                <span>Zielgruppe</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  className="mv-rotate-90 group-has-[:checked]:-mv-rotate-90"
                >
                  <path
                    fill="currentColor"
                    fillRule="nonzero"
                    d="M6.147 15.854a.5.5 0 0 1 0-.708L11.794 9.5 6.147 3.855a.5.5 0 1 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0v-.001Z"
                  ></path>
                </svg>
              </label>

              <div className="filter-item-list mv-w-72 mv-bg-white mv-rounded-lg mv-py-2 mv-absolute mv-top-[calc(100%+0.5rem)] mv-left-0 mv-hidden mv-shadow-xl group-has-[.checkbox-filtergroup:checked]/filter:mv-block group-has-[.checkbox-filtergroup:checked]/filter:mv-z-20">
                <ul>
                  <li>
                    <label
                      className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer mv-items-center
                      mv-group
                      hover:mv-bg-gray-100 mv-transition"
                      htmlFor="checkbox-2-1"
                    >
                      <input
                        type="checkbox"
                        id="checkbox-2-1"
                        className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                      />

                      <span>Online-Format</span>
                      <span className="mv-ml-auto">2</span>
                      <div className="mv-w-5 mv-h-5 mv-relative">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                          className="mv-block group-has-[:checked]:mv-hidden"
                        >
                          <path
                            fill="currentColor"
                            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                          />
                        </svg>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                          className="mv-hidden group-has-[:checked]:mv-block"
                        >
                          <path
                            fill="currentColor"
                            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                          />
                          <path
                            fill="currentColor"
                            d="M13.712 6.212a.937.937 0 0 1 1.34 1.312l-4.991 6.238a.938.938 0 0 1-1.349.026L5.404 10.48A.938.938 0 0 1 6.73 9.154l2.617 2.617 4.34-5.53a.3.3 0 0 1 .025-.029Z"
                          />
                        </svg>
                      </div>
                    </label>
                  </li>
                  <li>
                    <label
                      className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer mv-items-center
                      mv-group
                      hover:mv-bg-gray-100 mv-transition"
                      htmlFor="checkbox-2-2"
                    >
                      <input
                        type="checkbox"
                        id="checkbox-2-2"
                        className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                      />

                      <span>Workshop / Kurs</span>
                      <span className="mv-ml-auto">2</span>
                      <div className="mv-w-5 mv-h-5 mv-relative">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                          className="mv-block group-has-[:checked]:mv-hidden"
                        >
                          <path
                            fill="currentColor"
                            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                          />
                        </svg>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 20 20"
                          className="mv-hidden group-has-[:checked]:mv-block"
                        >
                          <path
                            fill="currentColor"
                            d="M17.5 1.25c.69 0 1.25.56 1.25 1.25v15c0 .69-.56 1.25-1.25 1.25h-15c-.69 0-1.25-.56-1.25-1.25v-15c0-.69.56-1.25 1.25-1.25h15ZM2.5 0A2.5 2.5 0 0 0 0 2.5v15A2.5 2.5 0 0 0 2.5 20h15a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 17.5 0h-15Z"
                          />
                          <path
                            fill="currentColor"
                            d="M13.712 6.212a.937.937 0 0 1 1.34 1.312l-4.991 6.238a.938.938 0 0 1-1.349.026L5.404 10.48A.938.938 0 0 1 6.73 9.154l2.617 2.617 4.34-5.53a.3.3 0 0 1 .025-.029Z"
                          />
                        </svg>
                      </div>
                    </label>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Beginn einzelener Filter mit Radio-Input */}
          <div className="mv-group/filter">
            <label
              htmlFor="checkbox-filtergroup-3"
              className="mv-absolute mv-h-dvh mv-w-full mv-hidden mv-inset-0 group-has-[.checkbox-filtergroup:checked]/filter:mv-block"
            ></label>
            <div className="mv-relative">
              <label
                htmlFor="checkbox-filtergroup-3"
                className="mv-peer mv-group filter-select mv-inline-flex mv-items-center mv-px-4 mv-py-1.5 mv-gap-2 mv-rounded-lg mv-bg-gray-100 mv-border mv-border-gray-100 mv-font-semibold	
                hover:mv-text-primary-500 hover:mv-border-primary-500
                has-[:checked]:mv-text-primary-500 has-[:checked]:mv-border-primary-500
                "
              >
                <input
                  type="checkbox"
                  id="checkbox-filtergroup-3"
                  className="mv-checkbox-filtergroup mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                />
                <span>Sortierung</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  className="mv-rotate-90 group-has-[:checked]:-mv-rotate-90"
                >
                  <path
                    fill="currentColor"
                    fillRule="nonzero"
                    d="M6.147 15.854a.5.5 0 0 1 0-.708L11.794 9.5 6.147 3.855a.5.5 0 1 1 .708-.708l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708 0v-.001Z"
                  ></path>
                </svg>
              </label>

              <div className="filter-item-list mv-w-72 mv-bg-white mv-rounded-lg mv-py-2 mv-absolute mv-top-[calc(100%+0.5rem)] mv-left-0 mv-hidden group-has-[.checkbox-filtergroup:checked]/filter:mv-block mv-shadow-xl">
                <ul>
                  <li>
                    <label
                      className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer mv-items-center
                      mv-group
                      hover:mv-bg-gray-100 mv-transition"
                      htmlFor="radio-1-1"
                    >
                      <input
                        className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                        type="radio"
                        name="radio-example"
                        id="radio-1-1"
                      />

                      <span>Alphabetisch</span>
                      <span className="mv-ml-auto">2</span>
                      <div className="mv-w-5 mv-h-5 mv-border mv-border-gray-700 mv-rounded-full mv-flex mv-items-center mv-justify-center">
                        <div className="mv-w-3 mv-h-3 mv-rounded-full group-has-[:checked]:mv-bg-gray-700"></div>
                      </div>
                    </label>
                  </li>
                  <li>
                    <label
                      className="mv-px-4 mv-py-2.5 mv-flex mv-gap-3 mv-text-gray-700 mv-cursor-pointer mv-items-center
                      mv-group
                      hover:mv-bg-gray-100 mv-transition"
                      htmlFor="radio-1-2"
                    >
                      <input
                        className="mv-h-0 mv-w-0 mv-opacity-0 mv-absolute"
                        type="radio"
                        name="radio-example"
                        id="radio-1-2"
                      />

                      <span>Neueste zuerst</span>
                      <span className="mv-ml-auto">2</span>
                      <div className="mv-w-5 mv-h-5 mv-border mv-border-gray-700 mv-rounded-full mv-flex mv-items-center mv-justify-center">
                        <div className="mv-w-3 mv-h-3 mv-rounded-full group-has-[:checked]:mv-bg-gray-700"></div>
                      </div>
                    </label>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Filter;
