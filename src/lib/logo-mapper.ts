const LOGO_MAP: { [key: string]: string } = {
  netflix: "/logos/netflix.svg",
  spotify: "/logos/spotify.svg",
  "amazon prime": "/logos/amazonprime.svg",
  "disney+": "/logos/disneyplus.svg",
  youtube: "/logos/youtube.svg",
  discord: "/logos/discord.svg",
  playstation: "/logos/playstation.svg",
  paypal: "/logos/paypal.svg",
  picpay: "/logos/picpay.svg",
  uber: "/logos/uber.svg",
  apple: "/logos/apple.svg",
  twitch: "/logos/twitch.svg",
  duolingo: "/logos/duolingo.svg",
  academia:"/logos/academia.svg",
  github:"/logos/github.svg",
  ifood:"/logos/ifood.svg",
  hbo:"/logos/hbo.svg",
  canva:"/logos/canva.svg",
  udemy:"/logos/udemy.svg",
  ufc:"/logos/ufc.svg",
  coursera:"/logos/coursera.svg",
};

export function getLogoForSubscription(name: string): string | null {
  const lowerCaseName = name.toLowerCase();

  for (const key in LOGO_MAP) {
    if (lowerCaseName.includes(key)) {
      return LOGO_MAP[key];
    }
  }

  return null;
}
