import type { Metadata } from "next";
import type { ReactNode } from "react";
import { company } from "@/config/company";
import "./globals.css";

export const metadata: Metadata = {
  title: `${company.shortName} — защитные металлоконструкции`,
  description: "Проектирование, изготовление и монтаж защитных металлоконструкций.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
