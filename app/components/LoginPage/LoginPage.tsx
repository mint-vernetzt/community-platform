import InputText from "../FormElements/InputText/InputText";
import HeaderLogo from "../HeaderLogo/HeaderLogo";
import InputPassword from "../FormElements/InputPassword/InputPassword";
import PageBackground from "../PageBackground/PageBackground";

// eslint-disable-next-line
export interface LoginPageProps {}

/**
 *
 * @deprecated
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LoginPage(props: LoginPageProps) {
  return (
    <div className="">
      <PageBackground imagePath="/images/default_kitchen.jpg" />
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-6/12 px-4 pt-4 pb-24 flex flex-row items-center">
            <div className="">
              <HeaderLogo />
            </div>
            <div className="ml-auto">
              Noch kein Mitglied?{" "}
              <a href="/register" className="text-primary font-bold">
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
              <InputText id="email" label="E-Mail" />
            </div>

            <div className="mb-10">
              <InputPassword id="password" label="Passwort" />
            </div>

            <div className="flex flex-row -mx-4 mb-8 items-center">
              <div className="basis-6/12 px-4">
                <button type="submit" className="btn btn-primary">
                  Login
                </button>
              </div>
              <div className="basis-6/12 px-4 text-right">
                <a href="/reset" className="text-primary font-bold">
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
