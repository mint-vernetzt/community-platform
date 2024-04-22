import { H1 } from "~/components/Heading/Heading";

function UnderConstruction() {
  return (
    <div className="mv-container">
      <H1 like="h3">
        Entschuldige, die MINTvernetzt Community-Plattform ist aktuell nicht
        erreichbar.
      </H1>
      <p>Wir arbeiten gerade daran. Bitte versuche es später nochmal</p>
      <p>
        Bei Fragen melde Dich bei{" "}
        <a
          href="mailto:support@mint-vernetzt.de"
          className="hover:underline hover:text-primary"
        >
          support@mint-vernetzt.de
        </a>
      </p>
      <p>Vielen Dank für dein Verständnis.</p>
    </div>
  );
}

export default UnderConstruction;
