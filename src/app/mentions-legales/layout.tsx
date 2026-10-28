import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "../espace/espace.css";

const display = Instrument_Serif({ variable: "--q-display", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const body = Manrope({ variable: "--q-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Mentions légales · EVO Incubator",
  description: "Mentions légales du site evo-inc.fr, édité par Baptiste Hoguet (EI).",
};

export default function MentionsLegalesLayout({ children }: { children: React.ReactNode }) {
  return <div className={`evos ${display.variable} ${body.variable}`}>{children}</div>;
}
