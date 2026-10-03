type Telephone = Readonly<{ display: string; number: `+${string}`; href: `tel:+${string}` }>;
type EmailAddress = Readonly<{ address: string; href: `mailto:${string}` }>;
type Contact = Readonly<{ label: string; phone: Telephone; email: EmailAddress }>;
type LegalEntity = Readonly<{ name: string; inn: string; ogrn: string; kpp: string; legalAddress: string }>;

const generalPhone: Telephone = {
  display: "+7 (495) 215-07-79",
  number: "+74952150779",
  href: "tel:+74952150779",
};
const manufacturingPhone: Telephone = {
  display: "+7 (495) 215-52-79",
  number: "+74952155279",
  href: "tel:+74952155279",
};
const generalEmail: EmailAddress = { address: "info@topengineer.ru", href: "mailto:info@topengineer.ru" };
const designEmail: EmailAddress = { address: "kmd@topengineer.ru", href: "mailto:kmd@topengineer.ru" };
const manufacturingEmail: EmailAddress = { address: "mk@topengineer.ru", href: "mailto:mk@topengineer.ru" };

export type CompanyConfig = Readonly<{
  name: string;
  shortName: string;
  websiteUrl: string;
  sourceUrl: string;
  verifiedAt: string;
  contacts: Readonly<Record<"general" | "design" | "manufacturing" | "installation", Contact>>;
  officeAddress: string;
  workingHours: Readonly<{ display: string; weekdays: readonly number[]; opens: string; closes: string; timezone: string }>;
  publishedLegalEntity: LegalEntity;
  formOperator: LegalEntity | null;
  serviceRegions: Readonly<Record<"design" | "delivery" | "installation", readonly string[]>> | null;
  responseTime: string | null;
  warranty: string | null;
}>;

/** Public contacts read from the live source; approval of legal texts is separate. */
export const company = {
  name: "Конструкторское бюро «Топинженер»",
  shortName: "Топинженер",
  websiteUrl: "https://topengineer.ru/",
  sourceUrl: "https://topengineer.ru/contact",
  verifiedAt: "2026-10-03",
  contacts: {
    general: { label: "Общие вопросы", phone: generalPhone, email: generalEmail },
    design: { label: "Проектирование", phone: generalPhone, email: designEmail },
    manufacturing: { label: "Изготовление", phone: manufacturingPhone, email: manufacturingEmail },
    installation: { label: "Монтаж", phone: manufacturingPhone, email: manufacturingEmail },
  },
  officeAddress: "г. Москва, Варшавское шоссе, д. 1, стр. 1, бизнес-центр W-Plaza, офис В-410",
  workingHours: {
    display: "Пн–пт, 10:00–19:00; суббота и воскресенье — выходные",
    weekdays: [1, 2, 3, 4, 5],
    opens: "10:00",
    closes: "19:00",
    timezone: "Europe/Moscow",
  },
  publishedLegalEntity: {
    name: "ООО «СтальПроект»",
    inn: "7743840108",
    ogrn: "5117746040583",
    kpp: "772601001",
    legalAddress: "117105, г. Москва, Варшавское шоссе, д. 1, стр. 1-2, 4 этаж, комн. 39",
  },
  // The source contains several entities; do not silently choose a form operator.
  formOperator: null,
  serviceRegions: null,
  responseTime: null,
  warranty: null,
} as const satisfies CompanyConfig;
