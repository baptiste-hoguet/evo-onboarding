import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";
import "./questionnaire.css";

const display = Instrument_Serif({ variable: "--q-display", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const body = Manrope({ variable: "--q-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Questionnaire d'onboarding — EVO",
  description: "Ton questionnaire d'onboarding EVO : environ 35 minutes, sauvegarde automatique.",
  robots: { index: false, follow: false },
};

export default function QuestionnaireLayout({ children }: { children: React.ReactNode }) {
  return <div className={`evoq ${display.variable} ${body.variable}`}>{children}</div>;
}
