import type { Metadata } from "next";
import type { ReactNode } from "react";
import { company } from "@/config/company";
import "./globals.css";
import "./details.css";
import "./wide-calculator.css";
import "./responsive.css";
import "./overlay-calculator.css";
import "./portfolio.css";
import "./material-photos.css";
import "./compact-order.css";
import "./section-spacing.css";
import "./quote-form.css";
import "./bottom-contact.css";
import Analytics from "@/components/landing/Analytics";

export const metadata: Metadata = {
  title: `${company.shortName} — проектирование металлоконструкций для антидроновой защиты`,
  description: "Проектирование каркасов, экранов и укрытий для антидроновой защиты. Разработка КМ, КМД и КЖ с предварительной 3D-компоновкой под размеры объекта.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}<Analytics /></body>
    </html>
  );
}
