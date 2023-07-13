import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import PageBackground from "../../components/PageBackground/PageBackground";

// TODO:

// Check if i set http instead of https when calling supabase.signUp() ? Also check other confirmation (email change, password forgotten)
// Else check which base url is noted on supabase stage server -> http or https

export const loader: LoaderFunction = async (args) => {
  const { request } = args;
  const response = new Response();

  // TODO:

  // Generate URL object from request url

  // Get search param confirmation_link from url

  // Generate URL object from confirmationLink

  // Check if url starts with https://{process.env.SUPABASE_URL}/auth/v1/verify

  // Get search param redirect_to

  // Generate URL object from redirectTo

  // Check if url starts with https://{process.env.BASE_URL}/verification

  // Get search param token

  // Check if token is a hex value

  // Get search param type

  // Check if type === "signup"

  // Build new URL -> https://{process.env.SUPABASE_URL}/auth/v1/verify?redirect_to=https://{process.env.BASE_URL}/verification&token={token}&type=signup

  // Send url to frontend and implement it inside <a> component

  return json(null, { headers: response.headers });
};

export default function Confirm() {
  return (
    <>
      <PageBackground imagePath="/images/login_background_image.jpg" />
      <div className="md:container md:mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row -mx-4">
          <div className="basis-full md:basis-6/12 px-4"> </div>
          <div className="basis-full md:basis-6/12 xl:basis-5/12 px-4">
            <h1 className="mb-4">Registrierungsbestätigung</h1>
            <>
              <p className="mb-4">
                Herzlich willkommen in der MINTcommunity! Bitte bestätige
                innerhalb von 24 Stunden die E-Mail-Adresse zur Aktivierung
                Deines Profils auf der MINTvernetzt-Plattform über den folgenden
                Link:
              </p>
              <Link
                to={""} // TODO: Confirmation link
                className="text-primary font-bold hover:underline" // TODO: Button styling
              >
                Registrierung bestätigen
              </Link>
            </>
          </div>
        </div>
      </div>
    </>
  );
}
