import InputText from "../FormElements/InputText/InputText";
import SelectField from "../FormElements/SelectField/SelectField";
import HeaderLogo from "../HeaderLogo/HeaderLogo";
import InputPassword from "../FormElements/InputPassword/InputPassword";
import PageBackground from "../PageBackground/PageBackground";

export interface NewProfilePageProps {}

/**
 *
 * @deprecated
 */
function NewProfilePage(props: NewProfilePageProps) {
  return (
    <div className="">
      <PageBackground imagePath="/images/default_kitchen.jpg" />
      <div className="container relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-6/12 px-4 pt-4 pb-24 flex flex-row items-center">
            <div className="">
              <HeaderLogo />
            </div>
            <div className="ml-auto">
              Bereits Mitglied?&nbsp;
              <a href="/login" className="text-primary font-bold">
                Anmelden
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-row -mx-4">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-5/12 px-4">
            <h1 className="mb-8">Neues Profil anlegen</h1>

            <div className="flex flex-row -mx-4 mb-4">
              <div className="basis-6/12 px-4">
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
            </div>

            <div className="flex flex-row -mx-4 mb-4">
              <div className="basis-6/12 px-4">
                <InputText id="firstName" label="Vorname" isRequired />
              </div>
              <div className="basis-6/12 px-4">
                <InputText id="lastName" label="Nachname" isRequired />
              </div>
            </div>

            <div className="mb-4">
              <InputText id="email" label="E-Mail" isRequired />
            </div>

            <div className="mb-4">
              <InputPassword id="password" label="Passwort" isRequired />
            </div>

            {/* <div className="mb-4">
              <InputPassword id="" label="Passwort wiederholen" isRequired />
            </div> */}

            <div className="mb-8">
              <div className="form-control checkbox-privacy">
                <label className="label cursor-pointer items-start">
                  <input
                    id="termsAccepted"
                    name="termsAccepted"
                    type="checkbox"
                    className="checkbox checkbox-primary mr-4"
                  />
                  <span className="label-text">
                    Wenn Sie ein Konto erstellen, erklären Sie sich mit unseren
                    Nutzungs-bedingungen, Datenschutzrichtlinien und unseren
                    Standardeinstellungen für Benachrichtigungen einverstanden.
                  </span>
                </label>
              </div>
            </div>
            <div className="mb-8">
              <button type="submit" className="btn btn-primary">
                Account registrieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewProfilePage;
