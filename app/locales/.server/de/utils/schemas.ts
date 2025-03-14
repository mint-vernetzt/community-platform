export const locale = {
  validation: {
    phone: {
      regex:
        "Bitte gib eine gültige Telefonnummer ein (Mindestens 7 Ziffern, Erlaubte Zeichen: Leerzeichen, +, -, (, )).",
    },
    website: {
      regex:
        "Deine Eingabe entspricht nicht dem Format einer Website URL (https://domain.tld/...).",
    },
    facebook: {
      regex:
        "Deine Eingabe entspricht nicht dem Format einer Facebook Seite (https://facebook.com/...).",
    },
    linkedin: {
      regex:
        "Deine Eingabe entspricht nicht dem Format einer LinkedIn Seite (https://linkedin.com/...).",
    },
    xing: {
      regex:
        "Deine Eingabe entspricht nicht dem Format einer Xing Seite (https://xing.com/...).",
    },
    twitter: {
      regex:
        "Deine Eingabe entspricht nicht dem Format einer Twitter Seite (https://x.com/... oder https://twitter.com/...).",
    },
    mastodon: {
      regex:
        "Deine Eingabe entspricht nicht dem Format einer Mastodon Seite (https://domain.tld/...).",
    },
    bluesky: {
      regex:
        "Deine Eingabe entspricht nicht dem Format einer Blue Sky Seite (https://bsky.app/...).",
    },
    tiktok: {
      regex:
        "Deine Eingabe entspricht nicht dem Format einer TikTok Seite (https://tiktok.com/...).",
    },
    instagram: {
      regex:
        "Deine Eingabe entspricht nicht dem Format einer Instagram Seite (https://instagram.com/...).",
    },
    youtube: {
      regex:
        "Deine Eingabe entspricht nicht dem Format einer Youtube Seite (https://youtube.com/...).",
    },
    youtubeEmbed: {
      urlParsing: "Unknown error during url parsing.",
      regex:
        'Deine Eingabe entspricht nicht dem Format einer Youtube-Watch-URL, einer Youtube-Embed-URL oder eines YouTube-<iframe> (youtube.com/watch?v=, youtube.com/embed/, youtube-nocookie.com/embed/, youtu.be/, <iframe ... src="youtube.com/embed/... ></iframe>).',
    },
  },
} as const;
