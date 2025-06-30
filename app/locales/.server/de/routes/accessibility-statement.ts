export const locale = {
  title: "Barrierefreiheitserklärung für die MINTvernetzt Community-Plattform",
  date: "Stand: 18.06.2025",
  scope: {
    title: "1. Geltungsbereich dieser Erklärung",
    content:
      "Diese Erklärung zur Barrierefreiheit gilt für die unter <0>{{baseUrl}}</0> erreichbare MINTvernetzt Community-Plattform einschließlich ihrer von dort erreichbaren Anwendungen MINT-Mediendatenbank und MINT-Sharepic-Generator.",
  },
  legalBasis: {
    title: "2. Rechtsgrundlagen",
    content:
      "Diese Erklärung basiert auf den Vorgaben des Barrierefreiheitsstärkungsgesetzes (BFSG) gemäß EU-Richtlinie 2016/2102 und entsprechenden nationalen Rechtsvorschriften.",
  },
  complianceStatus: {
    title: "3. Stand der Vereinbarkeit mit den Anforderungen",
    disclaimer:
      "Die MINTvernetzt Community-Plattform ist bestrebt, ihre digitale Infrastruktur barrierefrei zugänglich zu machen. Aktuell ist die Plattform noch nicht vollständig barrierefrei. Wir arbeiten kontinuierlich daran, die Zugänglichkeit weiter zu verbessern. Es bestehen insbesondere Einschränkungen in folgenden Bereichen:",
    restrictions: {
      userGeneratedContent: {
        title: "Nutzer:innengenerierter Content",
        subline:
          "Nutzer:innengenerierter Content kann <0>in manchen Fällen</0> nicht barrierefrei sein, darunter:",
        list: {
          altTexts:
            "Das Einfügen von ALT-Texte bei Bildern, die von Nutzer:innen hochgeladen werden, ist z.Z. noch nicht möglich. Wir arbeiten dran, dass dies möglich sein wird. ",
          material:
            "Nutzer:innengenerierter Content, wie PDFs, die als Material-Upload bereitgestellt werden, sind ggf. nicht barrierefrei zugänglich.",
          videos:
            "Nicht alle von den Nutzenden eingebetteten Videos verfügen über Untertitel oder eine Übersetzung in Gebärdensprache.",
        },
      },
      ownContent: {
        title: "Eigene Inhalte",
        subline:
          "Eigene Inhalte sind <0>in seltenen Fällen</0> noch nicht barrierefrei, darunter:",
        list: {
          altTexts:
            "Fehlende Textalternativen: Einige Bilder und Nicht-Text-Inhalte haben unzureichende oder keine beschreibenden Alternativtexte.",
          simpleLanguage:
            "Erläuterungen in Leichter Sprache sind noch nicht vorhanden und werden noch erstellt.",
          signLanguage:
            "Erläuterungen in Deutscher Gebärdensprache sind nicht vorhanden.",
          structural:
            "Unzureichende Strukturierung außerhalb der Registrierung und Anmeldung zu Events. Prüfung und Verbesserungen der anderen Inhalte sind im Gange.",
          contrast:
            "Schwacher Kontrast: Erhöhter Kontrast und Kontraste von Grafiken und Bedienelementen sind nicht immer ausreichend.",
          keyboardInteraction:
            "Tastaturbedienung ggf. eingeschränkt: Einige Funktionen sind ggf. nicht oder nur eingeschränkt per Tastatur bedienbar, Fokus-Markierung kann u.U. fehlen.",
          metaTitles:
            "Unklare oder fehlende Seitentitel in den Überblicksseiten: Der Titel der Webseiten ist nicht immer sinnvoll gewählt oder fehlt.",
          links:
            "Linkzwecke teils nicht verständlich: Links sind ohne zusätzlichen Kontext oft nicht eindeutig erkennbar.",
          syntax:
            "Fehlende oder fehlerhafte Syntax: HTML- und ARIA-Auszeichnungen enthalten ggf. noch Fehler, was Screenreader-Nutzenden Probleme bereitet.",
        },
      },
    },
  },
  measuresToImprove: {
    title: "4. Maßnahmen zur Verbesserung der Barrierefreiheit",
    subline:
      "Wir setzen kontinuierlich Maßnahmen um, um die Barrierefreiheit der Plattform zu verbessern:",
    regularChecks:
      "<0>Regelmäßige Überprüfungen:</0> Durchführung von Barrierefreiheitstests gemäß den Richtlinien der Barrierefreien Informationstechnik-Verordnung (BITV 2.0).",
    training:
      "<0>Schulungen:</0> Sensibilisierung und Schulung des Entwicklungsteams in Bezug auf barrierefreie Entwicklung im Austausch mit dem Design-Team.",
    userFeedback:
      "<0>Nutzer:innen-Feedback:</0> Integration von Feedback von Nutzer:innen zur Identifikation und Behebung von Barrieren.",
  },
  reportBarriers: {
    title: "5. Feedback und Kontakt – Barrieren melden",
    subline:
      "Sollten Mängel in Bezug auf die barrierefreie Gestaltung unserer Plattform auffallen oder benötigst Du Informationen in barrierefreiem Format, kontaktiere uns bitte:",
    email: "<0>E-Mail:</0> <1>{{supportMail}}</1>",
    phone:
      "<0>Telefon:</0> <1>+49 (0) 162 16 96 01 9</1> – <2>Inga Leffers</2>, Product Ownerin & Community-Managerin",
    disclaimer: "Wir bemühen uns, Deine Anfragen zeitnah zu bearbeiten.",
  },
  moreInformation: {
    title: "6. Weitere Informationen",
    content:
      "Die MINTvernetzt Community-Plattform ist ein Projekt von MINTvernetzt, das darauf abzielt, die MINT-Community in Deutschland zu vernetzen und den Austausch von Wissen und Erfahrungen zu fördern. Weitere Informationen findest Du auf unserer Website: <0>https://www.mint-vernetzt.de</0>",
  },
  notice:
    "Hinweis: Diese Erklärung wird regelmäßig überprüft und aktualisiert, um den aktuellen Stand der Barrierefreiheit unserer Plattform widerzuspiegeln.",
} as const;
