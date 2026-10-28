import { redirect } from "next/navigation";

export default function Home() {
  redirect("/espace"); // domaine client : evo-inc.fr → espace membre (l’admin reste sur /admin)
}
