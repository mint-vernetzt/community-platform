import "@fontsource/source-sans-pro/400.css";
import "@fontsource/source-sans-pro/600.css";
import "@fontsource/source-sans-pro/700.css";
import InputText from "../FormElements/InputText/InputText";
import SelectField from "../FormElements/SelectField/SelectField";
import HeaderLogo from "../HeaderLogo/HeaderLogo";
import InputPassword from "../FormElements/InputPassword/InputPassword";
import PageBackground from "../PageBackground/PageBackground";

export interface LoginPageProps {}

function LoginPage(props: LoginPageProps) {
  return (
    <div className="">
      <PageBackground />
      <div className="md:container md:mx-auto relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-6/12 px-4 pt-4 pb-24 flex flex-row items-center">
            <div className="">
              <HeaderLogo />
            </div>
            <div className="ml-auto">
              Noch kein Mitglied?{" "}
              <a href="#" className="text-primary font-bold">
                Registrieren
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-row -mx-4">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-5/12 px-4">
            <h1 className="mb-8">Anmelden</h1>

            <div className="mb-4">
              <InputText label="E-Mail" />
            </div>

            <div className="mb-10">
              <InputPassword label="Passwort" />
            </div>

            <div className="flex flex-row -mx-4 mb-8 items-center">
              <div className="basis-6/12 px-4">
                <button className="btn btn-primary">Login</button>
              </div>
              <div className="basis-6/12 px-4 text-right">
                <a href="#" className="text-primary font-bold">
                  Passwort vergessen?
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
