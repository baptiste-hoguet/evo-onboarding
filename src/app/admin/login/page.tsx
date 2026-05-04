"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Identifiants invalides");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center evo-gradient bg-[#000000] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#C9A84C] tracking-wider">
            EVO
          </h1>
          <p className="text-[#A1A1AA] mt-2 text-sm">
            Plateforme d&apos;onboarding
          </p>
        </div>

        <div className="evo-card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[#A1A1AA]">
                Identifiant
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="baptiste"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-[#0A0A0A] border-[#262626] text-white placeholder:text-[#52525B] rounded-lg focus:ring-[#C9A84C] focus:border-[#C9A84C]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#A1A1AA]">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#0A0A0A] border-[#262626] text-white placeholder:text-[#52525B] rounded-lg focus:ring-[#C9A84C] focus:border-[#C9A84C]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A84C] text-[#000000] hover:bg-[#E8C97A] rounded-lg font-semibold h-11"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
