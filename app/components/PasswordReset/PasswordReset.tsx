import HeaderLogo from "../HeaderLogo/HeaderLogo";
import PageBackground from "../PageBackground/PageBackground";
import InputText from "../FormElements/InputText/InputText";

export interface PasswordResetProps {}

function PasswordReset(props: PasswordResetProps) {
  return (
    <div className="">
      <PageBackground imagePath="/images/default_kitchen.jpg" />
      <div className="mv-w-full mv-mx-auto mv-px-4 @sm:mv-max-w-screen-container-sm @md:mv-max-w-screen-container-md @lg:mv-max-w-screen-container-lg @xl:mv-max-w-screen-container-xl @xl:mv-px-6 @2xl:mv-max-w-screen-container-2xl relative z-10">
        <div className="flex flex-row -mx-4 justify-end">
          <div className="basis-6/12 px-4 pt-4 pb-24 flex flex-row items-center">
            <div className="">
              <HeaderLogo />
            </div>
            <div className="ml-auto"></div>
          </div>
        </div>
        <div className="flex flex-row -mx-4">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-6/12 px-4">
            <h1 className="mb-8">Passwort zurücksetzen</h1>
          </div>
        </div>
        <div className="flex flex-row -mx-4">
          <div className="basis-6/12 px-4"> </div>
          <div className="basis-5/12 px-4">
            <p className="mb-4">
              Geben Sie die E-Mail-Adresse ein, die Sie bei Ihrer Anmeldung
              verwendet haben, und wir senden Ihnen Anweisungen zum Zurücksetzen
              Ihres Passworts.
            </p>

            <div className="mb-8">
              <InputText id="email" label="E-Mail" />
            </div>

            <div className="mb-8">
              <button type="submit" className="btn btn-primary">
                Passwort zurücksetzen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordReset;
