"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const SLACK_URL =
  "https://join.slack.com/t/evo-incubator/shared_invite/zt-3tp5dgmxv-GC88JtMwto5br0n8tX87pg";

export function CompletionScreen() {
  const [countdown, setCountdown] = useState(3);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setRedirecting(true);
      window.location.href = SLACK_URL;
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 evo-gradient">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Stars */}
        <div className="flex items-center justify-center gap-2">
          <Star className="w-6 h-6 text-[#C9A84C] fill-[#C9A84C] animate-pulse" />
          <Star className="w-8 h-8 text-[#E8C97A] fill-[#E8C97A] animate-pulse delay-100" />
          <Star className="w-6 h-6 text-[#C9A84C] fill-[#C9A84C] animate-pulse delay-200" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Bienvenue dans EVO
          </h1>
          <p className="text-[#94A3B8] text-lg">
            Votre onboarding est terminé. Rejoignez la communauté sur Slack !
          </p>
        </div>

        {/* Animated progress bar */}
        <div className="w-full h-2 bg-[#1E2D45] rounded-full overflow-hidden">
          <div
            className="h-full progress-gradient rounded-full transition-all duration-1000 ease-out"
            style={{ width: redirecting ? "100%" : `${((3 - countdown) / 3) * 100}%` }}
          />
        </div>

        {/* Countdown */}
        <p className="text-[#94A3B8] text-sm">
          {redirecting
            ? "Redirection vers Slack..."
            : `Redirection automatique dans ${countdown} seconde${countdown > 1 ? "s" : ""}...`}
        </p>

        {/* Manual link */}
        <a
          href={SLACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#C9A84C] text-[#0A0F1E] hover:bg-[#E8C97A] font-semibold px-8 py-3 rounded-lg text-base transition-all duration-200"
        >
          Clique ici pour rejoindre Slack
        </a>
      </div>
    </div>
  );
}
