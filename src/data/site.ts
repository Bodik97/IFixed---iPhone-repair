export const site = {
  name: "iFix",
  tagline: "Ремонт iPhone, iPad та Apple Watch у Львові й Новому Роздолі.",
  phones: [
    { label: "073 315 02 38", href: "tel:+380733150238" },
    { label: "063 116 43 77", href: "tel:+380631164377" },
  ],
  hours: "Пн–Сб 8:00–18:00",
  hoursNote: "Нд за домовленістю",
  cities: ["Львів", "Новий Розділ"],
  warrantyDays: 30,
  messengers: [
    { label: "Telegram", href: "https://t.me/" },
    { label: "Viber", href: "viber://chat?number=%2B380733150238" },
    { label: "Instagram", href: "https://instagram.com/" },
  ],
} as const;

export const nav = [
  { href: "/", label: "Головна" },
  { href: "/poslugy", label: "Послуги" },
  { href: "/modeli", label: "Моделі" },
  { href: "/poshtoyu", label: "Поштою" },
] as const;
