export const locale = {
  validation: {
    phone: {
      regex:
        "Please enter a valid phone number (At least 7 digits, Allowed characters: Space, +, -, (, )).",
    },
    website: {
      regex:
        "Your input does not match the format of a website URL (https://domain.tld/...).",
    },
    facebook: {
      regex:
        "Your input does not match the format of a Facebook page (https://facebook.com/...).",
    },
    linkedin: {
      regex:
        "Your input does not match the format of a LinkedIn page (https://linkedin.com/...).",
    },
    xing: {
      regex:
        "Your input does not match the format of a Xing page (https://xing.com/...).",
    },
    twitter: {
      regex:
        "Your input does not match the format of a Twitter page (https://x.com/... or https://twitter.com/...).",
    },
    mastodon: {
      regex:
        "Your input does not match the format of a Mastodon page (https://domain.tld/...).",
    },
    bluesky: {
      regex:
        "Your input does not match the format of a Blue Sky page (https://bsky.app/...).",
    },
    tiktok: {
      regex:
        "Your input does not match the format of a TikTok page (https://tiktok.com/...).",
    },
    instagram: {
      regex:
        "Your input does not match the format of an Instagram page (https://instagram.com/...).",
    },
    youtube: {
      regex:
        "Your input does not match the format of a Youtube page (https://youtube.com/...).",
    },
    youtubeEmbed: {
      urlParsing: "Unknown error during url parsing.",
      regex:
        'Your input does not match the format of a Youtube-Watch-URL, a Youtube-Embed-URL or a YouTube-<iframe> (youtube.com/watch?v=, youtube.com/embed/, youtube-nocookie.com/embed/, youtu.be/, <iframe ... src="youtube.com/embed/... ></iframe>).',
    },
  },
} as const;
