import type { Metadata } from "next";
import type { ReactNode } from "react";
import { company } from "@/config/company";
import "./globals.css";
import "./details.css";
import "./wide-calculator.css";
import "./responsive.css";
import Analytics from "@/components/landing/Analytics";

export const metadata: Metadata = {
  title: `${company.shortName} — металлоконструкции для антидроновой защиты`,
  description: "Проектирование, изготовление и монтаж металлоконструкций. Экраны, навесы и укрытия с предварительной 3D-компоновкой под размеры объекта.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}<Analytics /></body>
    </html>
  );
}
