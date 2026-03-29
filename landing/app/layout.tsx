import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("http://204.168.135.143:8080"),
  title: "hh-applicant-tool — Automated Job Applications for hh.ru",
  description:
    "Self-hosted job application engine with AI cover letters, real-time dashboard, and remote worker architecture for HeadHunter (hh.ru).",
  openGraph: {
    title: "hh-applicant-tool",
    description:
      "Automated job application engine for hh.ru with AI-powered cover letters and a real-time dashboard.",
    images: ["/screenshots/overview-dark.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
