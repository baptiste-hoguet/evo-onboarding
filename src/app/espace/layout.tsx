import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./espace.css";

const display = Instrument_Serif({ variable: "--q-display", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const body = Manrope({ variable: "--q-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  icons: { icon: [{ url: "/evo-icon.svg", type: "image/svg+xml" }, { url: "/evo-icon-96.png", sizes: "96x96", type: "image/png" }], apple: "/evo-apple-icon.png" },
  title: "Mon espace EVO",
  description: "Ton parcours d'accompagnement EVO : progression, livrables et calls.",
  robots: { index: false, follow: false },
};

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return <div className={`evos ${display.variable} ${body.variable}`}>{children}</div>;
}
