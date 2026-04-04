import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://worksearch.1618.digital"),
  title: "1.618 WorkSearch — AI-автопилот для поиска работы на hh.ru",
  description:
    "Автоматические отклики с AI-сопроводительными, авто-ответы работодателям, дашборд реального времени. Подключись по подписке.",
  openGraph: {
    title: "1.618 WorkSearch",
    description:
      "AI-движок для поиска работы на hh.ru. Отклики, сопроводительные, авто-ответы — всё на автопилоте.",
    images: [
      {
        url: "/screenshots/overview-dark.png",
        width: 1440,
        height: 900,
        alt: "1.618 WorkSearch Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "1.618 WorkSearch",
    description: "AI-автопилот для поиска работы на hh.ru",
    images: ["/screenshots/overview-dark.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`dark ${manrope.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
