import SelectField from "../../FormElements/SelectField/SelectField";
import InputText from "../../FormElements/InputText/InputText";
import HeaderLogo from "../../HeaderLogo/HeaderLogo";
import TextArea from "../../FormElements/TextArea/TextArea";
import InputAdd from "../../FormElements/InputAdd/InputAdd";
import Icon, { IconType } from "../components/Icon/Icon";

export interface EditPersonalDataProps {}

function EditPersonalData(props: EditPersonalDataProps) {
  return (
    <div>
      <header className="shadow-md mb-8">
        <div className="container mx-auto px-4 relative z-10">
          <div className="basis-full md:basis-6/12 px-4 pt-3 pb-3 flex flex-row items-center">
            <div className="">
              <HeaderLogo />
            </div>
            <div className="ml-auto">UserMenu</div>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 relative z-10 pb-44">
        <div className="flex flex-col lg:flex-row -mx-4">
          <div className="basis-4/12 px-4">
            <div className="p-4 lg:p-8 pb-15 md:pb-5 rounded-lg bg-neutral-200 shadow-lg relative mb-8">
              <h3 className="font-bold mb-7">Profil bearbeiten</h3>
              <ul>
                <li>
                  <a href="" className="block text-3xl text-primary py-3">
                    Persönliche Daten
                  </a>
                </li>
                <li>
                  <a
                    href=""
                    className="block text-3xl text-neutral-500 hover:text-primary py-3"
                  >
                    Login und Sicherheit
                  </a>
                </li>
                <li>
                  <a
                    href=""
                    className="block text-3xl text-neutral-500 hover:text-primary py-3"
                  >
                    Website und Soziale Netzwerke
                  </a>
                </li>
              </ul>

              <hr className="border-neutral-400 my-4 lg:my-8" />

              <div className="">
                <a
                  href=""
                  className="block text-3xl text-neutral-500 hover:text-primary py-3"
                >
                  Profil löschen
                </a>
              </div>
            </div>

            <div className="px-8 lg:px-16 relative mb-16">
              <p className="text-xs flex items-center mb-4">
                <span className="icon w-4 h-4 mr-3">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 10C20 10 16.25 3.125 10 3.125C3.75 3.125 0 10 0 10C0 10 3.75 16.875 10 16.875C16.25 16.875 20 10 20 10ZM1.46625 10C2.07064 9.0814 2.7658 8.22586 3.54125 7.44625C5.15 5.835 7.35 4.375 10 4.375C12.65 4.375 14.8488 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.0814 18.535 10C18.4625 10.1087 18.3825 10.2287 18.2913 10.36C17.8725 10.96 17.2538 11.76 16.46 12.5538C14.8488 14.165 12.6488 15.625 10 15.625C7.35 15.625 5.15125 14.165 3.54 12.5538C2.76456 11.7741 2.0694 10.9186 1.465 10H1.46625Z"
                      fill="currentColor"
                    />
                    <path
                      d="M10 6.875C9.1712 6.875 8.37634 7.20424 7.79029 7.79029C7.20424 8.37634 6.875 9.1712 6.875 10C6.875 10.8288 7.20424 11.6237 7.79029 12.2097C8.37634 12.7958 9.1712 13.125 10 13.125C10.8288 13.125 11.6237 12.7958 12.2097 12.2097C12.7958 11.6237 13.125 10.8288 13.125 10C13.125 9.1712 12.7958 8.37634 12.2097 7.79029C11.6237 7.20424 10.8288 6.875 10 6.875ZM5.625 10C5.625 8.83968 6.08594 7.72688 6.90641 6.90641C7.72688 6.08594 8.83968 5.625 10 5.625C11.1603 5.625 12.2731 6.08594 13.0936 6.90641C13.9141 7.72688 14.375 8.83968 14.375 10C14.375 11.1603 13.9141 12.2731 13.0936 13.0936C12.2731 13.9141 11.1603 14.375 10 14.375C8.83968 14.375 7.72688 13.9141 6.90641 13.0936C6.08594 12.2731 5.625 11.1603 5.625 10Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span>Für alle sichtbar</span>
              </p>

              <p className="text-xs flex items-center mb-4">
                <span className="icon w-5 h-5 mr-2">
                  <svg
                    className="block w-4 h-5 "
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.6987 14.0475C18.825 12.15 20 10 20 10C20 10 16.25 3.125 10 3.125C8.79949 3.12913 7.61256 3.37928 6.5125 3.86L7.475 4.82375C8.28429 4.52894 9.13868 4.3771 10 4.375C12.65 4.375 14.8487 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.08141 18.535 10C18.4625 10.1088 18.3825 10.2288 18.2912 10.36C17.8725 10.96 17.2537 11.76 16.46 12.5538C16.2537 12.76 16.0387 12.9638 15.8137 13.1613L16.6987 14.0475Z"
                      fill="#454C5C"
                    />
                    <path
                      d="M14.1212 11.47C14.4002 10.6898 14.4518 9.84643 14.2702 9.03803C14.0886 8.22962 13.6811 7.48941 13.0952 6.90352C12.5093 6.31764 11.7691 5.91018 10.9607 5.72854C10.1523 5.5469 9.30895 5.59856 8.52875 5.8775L9.5575 6.90625C10.0379 6.83749 10.5277 6.88156 10.9881 7.03495C11.4485 7.18835 11.8668 7.44687 12.21 7.79001C12.5531 8.13316 12.8116 8.55151 12.965 9.01191C13.1184 9.47231 13.1625 9.96211 13.0937 10.4425L14.1212 11.47ZM10.4425 13.0937L11.47 14.1212C10.6898 14.4002 9.84643 14.4518 9.03803 14.2702C8.22962 14.0886 7.48941 13.6811 6.90352 13.0952C6.31764 12.5093 5.91018 11.7691 5.72854 10.9607C5.5469 10.1523 5.59856 9.30895 5.8775 8.52875L6.90625 9.5575C6.83749 10.0379 6.88156 10.5277 7.03495 10.9881C7.18835 11.4485 7.44687 11.8668 7.79001 12.21C8.13316 12.5531 8.55151 12.8116 9.01191 12.965C9.47231 13.1184 9.96211 13.1625 10.4425 13.0937Z"
                      fill="#454C5C"
                    />
                    <path
                      d="M4.1875 6.8375C3.9625 7.0375 3.74625 7.24 3.54 7.44625C2.76456 8.22586 2.0694 9.08141 1.465 10L1.70875 10.36C2.1275 10.96 2.74625 11.76 3.54 12.5538C5.15125 14.165 7.35125 15.625 10 15.625C10.895 15.625 11.7375 15.4588 12.525 15.175L13.4875 16.14C12.3874 16.6207 11.2005 16.8708 10 16.875C3.75 16.875 0 10 0 10C0 10 1.17375 7.84875 3.30125 5.9525L4.18625 6.83875L4.1875 6.8375ZM17.0575 17.9425L2.0575 2.9425L2.9425 2.0575L17.9425 17.0575L17.0575 17.9425Z"
                      fill="#454C5C"
                    />
                  </svg>
                </span>
                <span>Für unregistrierte Nutzer nicht sichtbar</span>
              </p>
            </div>
          </div>

          <div className="basis-6/12 px-4">
            <h1 className="mb-8">Persönliche Daten</h1>

            <h4 className="mb-4 font-semibold">Allgemein</h4>

            <p className="mb-8">
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
              nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
              erat, sed diam voluptua.
            </p>

            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12 px-4 mb-4">
                <SelectField
                  id="academicTitle"
                  label="Titel"
                  options={[
                    {
                      label: "Dr.",
                      value: "Dr.",
                    },
                    {
                      label: "Prof.",
                      value: "Prof.",
                    },
                    {
                      label: "Prof. Dr.",
                      value: "Prof. Dr.",
                    },
                  ]}
                />
              </div>
              <div className="basis-full md:basis-6/12 px-4 mb-4">
                <InputText id="position" label="Position" isHideable />
              </div>
            </div>

            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12 px-4 mb-4">
                <InputText id="firstName" label="Vorname" isRequired />
              </div>
              <div className="basis-full md:basis-6/12 px-4 mb-4">
                <InputText id="lastName" label="Nachname" isRequired />
              </div>
            </div>

            <div className="flex flex-col md:flex-row -mx-4">
              <div className="basis-full md:basis-6/12 px-4 mb-4">
                <InputText id="email" label="E-Mail" isHideable />
              </div>
              <div className="basis-full md:basis-6/12 px-4 mb-4">
                <InputText id="phone" label="Telefon" isHideable />
              </div>
            </div>

            <hr className="border-neutral-400 my-10 lg:my-16" />

            <div className="flex flex-row items-center mb-4">
              <h4 className="font-semibold">Über mich</h4>
              <button className="bg-transparent w-10 h-8 flex items-center justify-center rounded-md border border-neutral-500 text-neutral-600 ml-auto">
                <svg
                  className="block w-6 h-6"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 10C20 10 16.25 3.125 10 3.125C3.75 3.125 0 10 0 10C0 10 3.75 16.875 10 16.875C16.25 16.875 20 10 20 10ZM1.46625 10C2.07064 9.0814 2.7658 8.22586 3.54125 7.44625C5.15 5.835 7.35 4.375 10 4.375C12.65 4.375 14.8488 5.835 16.46 7.44625C17.2354 8.22586 17.9306 9.0814 18.535 10C18.4625 10.1087 18.3825 10.2287 18.2913 10.36C17.8725 10.96 17.2538 11.76 16.46 12.5538C14.8488 14.165 12.6488 15.625 10 15.625C7.35 15.625 5.15125 14.165 3.54 12.5538C2.76456 11.7741 2.0694 10.9186 1.465 10H1.46625Z"
                    fill="#454C5C"
                  />
                  <path
                    d="M10 6.875C9.1712 6.875 8.37634 7.20424 7.79029 7.79029C7.20424 8.37634 6.875 9.1712 6.875 10C6.875 10.8288 7.20424 11.6237 7.79029 12.2097C8.37634 12.7958 9.1712 13.125 10 13.125C10.8288 13.125 11.6237 12.7958 12.2097 12.2097C12.7958 11.6237 13.125 10.8288 13.125 10C13.125 9.1712 12.7958 8.37634 12.2097 7.79029C11.6237 7.20424 10.8288 6.875 10 6.875ZM5.625 10C5.625 8.83968 6.08594 7.72688 6.90641 6.90641C7.72688 6.08594 8.83968 5.625 10 5.625C11.1603 5.625 12.2731 6.08594 13.0936 6.90641C13.9141 7.72688 14.375 8.83968 14.375 10C14.375 11.1603 13.9141 12.2731 13.0936 13.0936C12.2731 13.9141 11.1603 14.375 10 14.375C8.83968 14.375 7.72688 13.9141 6.90641 13.0936C6.08594 12.2731 5.625 11.1603 5.625 10Z"
                    fill="#454C5C"
                  />
                </svg>
              </button>
            </div>

            <p className="mb-8">
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
              nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
              erat, sed diam voluptua.
            </p>

            <div className="mb-4">
              <TextArea label="Kurzbeschreibung" isHideable />
            </div>

            <div className="mb-4">
              <InputAdd label="Aktivitätsgebiete" />
            </div>

            <div className="mb-4">
              <InputAdd label="Kompetenzen" />
            </div>

            <div className="mb-4">
              <InputAdd label="Interessen" />
            </div>

            <hr className="border-neutral-400 my-10 lg:my-16" />

            <h4 className="mb-4 font-semibold">Ich biete</h4>

            <p className="mb-8">
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
              nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
              erat, sed diam voluptua.
            </p>

            <div className="mb-4">
              <InputAdd id="offering" />
            </div>

            <hr className="border-neutral-400 my-10 lg:my-16" />

            <h4 className="mb-4 font-semibold">Ich suche</h4>

            <p className="mb-8">
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
              nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
              erat, sed diam voluptua.
            </p>

            <div className="mb-4">
              <InputAdd id="searching" />
            </div>

            <hr className="border-neutral-400 my-10 lg:my-16" />

            <div className="flex flex-row items-center mb-4">
              <h4 className="font-semibold">Organisation hinzufügen</h4>
              <button
                type="submit"
                className="btn btn-outline-primary ml-auto btn-small"
              >
                Organisation anlegen
              </button>
            </div>
            <p className="mb-8">
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam
              nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam
              erat, sed diam voluptua.
            </p>

            <div className="mb-4">
              <InputAdd id="organizations" label="Organisation hinzufügen" />
            </div>
          </div>
        </div>
      </div>

      <footer className="fixed z-10 bg-white border-t-2 border-primary w-full inset-x-0 bottom-0">
        <div className="md:container md:mx-auto ">
          <div className="px-4 py-8 flex flex-row items-center justify-end">
            <div className="">
              <button type="submit" className="btn btn-link">
                Änderungen verwerfen
              </button>

              <button type="submit" className="btn btn-primary ml-4">
                Speichern
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default EditPersonalData;
