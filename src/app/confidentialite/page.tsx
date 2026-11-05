import Link from "next/link";

// Politique de confidentialité d'evo-inc.fr (espace client, questionnaire, onboarding).
// À mettre à jour à chaque nouveau traitement (ex. ouverture du SaaS « 4 métriques »).
const MAJ = "5 novembre 2026";
const SITE = "https://evo-inc.fr";
const CONTACT = "hogbat08@gmail.com";

const SOUS_TRAITANTS: [string, string, string][] = [
  ["Vercel Inc.", "Hébergement du site et des fichiers échangés (livrables)", "États-Unis, clauses contractuelles types de la Commission européenne"],
  ["Neon Inc.", "Base de données (comptes, questionnaires, suivi du parcours)", "États-Unis (Amazon Web Services), clauses contractuelles types"],
  ["Google (Gmail)", "Envoi des emails (accès, rappels)", "Union européenne et États-Unis, clauses contractuelles types"],
  ["Anthropic (Claude)", "Synthèse du questionnaire pour préparer le premier call, sans réutilisation pour entraîner ses modèles", "États-Unis, clauses contractuelles types"],
];

export default function Confidentialite() {
  return (
    <main className="wrap">
      <div>
        <div className="eyebrow"><em>EVO</em><span>·</span><span>Données personnelles</span></div>
        <h1>Politique de <i>confidentialité</i>.</h1>
        <p className="lede">Mise à jour le {MAJ}. Cette page explique quelles données nous collectons sur evo-inc.fr, pourquoi, combien de temps nous les gardons et comment exercer vos droits.</p>
      </div>

      <section>
        <h2>Responsable du traitement</h2>
        <p className="lede">
          HOGUET CAPITAL, SAS au capital de 100 €, 20 rue Milton, 75009 Paris (SIREN 106 886 682), qui exploite la marque EVO Incubator.
          Contact : {CONTACT}.
        </p>
      </section>

      <section>
        <h2>Les données que nous collectons</h2>
        <ul className="lede">
          <li><b>Questionnaire</b> : identité, email, téléphone, marque, activité, offre, chiffres et objectifs que vous renseignez, et vos réponses.</li>
          <li><b>Onboarding et contrat</b> : adresse, SIRET, échéancier de paiement, signature du contrat, documents échangés.</li>
          <li><b>Espace client</b> : email, mot de passe (stocké sous forme chiffrée, jamais en clair), progression dans le parcours, date de dernière connexion.</li>
        </ul>
      </section>

      <section>
        <h2>Pourquoi nous les utilisons</h2>
        <ul className="lede">
          <li>Étudier votre demande avant de vous accompagner (mesures précontractuelles).</li>
          <li>Exécuter l’accompagnement : accès à l’espace client, suivi du parcours, contrat, paiements (exécution du contrat).</li>
          <li>Tenir notre comptabilité et nos factures (obligation légale).</li>
          <li>Sécuriser le site et les comptes (intérêt légitime).</li>
        </ul>
        <p className="lede">Nous ne vendons aucune donnée.</p>
      </section>

      <section>
        <h2>Qui y a accès</h2>
        <p className="lede">L’équipe EVO qui vous accompagne, et les prestataires techniques suivants, uniquement pour le service décrit :</p>
        <ul className="lede">
          {SOUS_TRAITANTS.map(([nom, role, lieu]) => (
            <li key={nom}><b>{nom}</b> : {role}. Localisation : {lieu}.</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Combien de temps nous les gardons</h2>
        <ul className="lede">
          <li>Questionnaire sans suite : 3 ans après le dernier contact.</li>
          <li>Données de l’accompagnement : durée du contrat, puis 5 ans.</li>
          <li>Factures et pièces comptables : 10 ans.</li>
          <li>Compte de l’espace client : supprimé à la fin de l’accompagnement, sur demande.</li>
        </ul>
      </section>

      <section>
        <h2>Connexion Instagram (Diagnostic express)</h2>
        <p className="lede">
          Sur le Diagnostic express, vous pouvez, si vous le souhaitez, connecter votre compte Instagram professionnel pour pré-remplir vos chiffres.
          La connexion passe uniquement par l’API officielle de Meta (« Instagram API with Unified Login », via Facebook Login for Business) : vous vous identifiez chez Meta,
          avec Instagram ou Facebook, jamais sur notre site, et nous ne voyons jamais votre mot de passe.
        </p>
        <ul className="lede">
          <li><b>Ce que nous lisons, une seule fois</b> : votre nom d’utilisateur, le type de compte, le nombre d’abonnés, le nombre de reels et de publications des 7 derniers jours, le nombre de stories en ligne au moment de la connexion, et les vues de vos reels (total, moyenne, meilleur reel et son lien).</li>
          <li><b>Aucun accès conservé</b> : le jeton d’accès fourni par Meta sert à cette lecture puis est abandonné. Il n’est ni enregistré ni journalisé. Nous ne publions rien et ne lisons pas vos messages.</li>
          <li><b>Durée de conservation</b> : si vous envoyez le diagnostic, ces chiffres sont rattachés à votre diagnostic et suivent sa durée de conservation. Sinon, ils sont supprimés au bout de 24 heures.</li>
          <li><b>Retirer l’autorisation</b> : Meta peut laisser l’application EVO listée dans vos autorisations même si nous ne gardons aucun jeton. Vous pouvez la retirer dans Instagram (Paramètres › Apps et sites web), dans Facebook (Paramètres › Intégrations professionnelles) ou dans les paramètres de votre portefeuille business Meta. Le retrait nous est notifié par Meta et supprime les chiffres Instagram liés à votre compte.</li>
          <li><b>Demander la suppression</b> : par Meta (paramètres de l’app dans Instagram), ou en nous écrivant à {CONTACT}. Le suivi d’une demande reçue de Meta se consulte sur {SITE}/confidentialite/suppression.</li>
        </ul>
      </section>

      <section>
        <h2>Cookies</h2>
        <p className="lede">
          Le site utilise uniquement un cookie de session, indispensable pour rester connecté à l’espace client, et, si vous connectez Instagram au Diagnostic express,
          un cookie technique de sécurité valable 10 minutes le temps de la connexion. Aucun cookie publicitaire ni de mesure d’audience.
        </p>
      </section>

      <section>
        <h2>Vos droits</h2>
        <p className="lede">
          Vous pouvez demander l’accès à vos données, leur rectification, leur suppression, leur portabilité, ou vous opposer à un traitement,
          en écrivant à {CONTACT}. Nous répondons sous un mois. Vous pouvez aussi saisir la CNIL (cnil.fr).
        </p>
      </section>

      <p className="muted small">
        EVO Incubator · Hoguet Capital · <Link href="/mentions-legales">Mentions légales</Link> · <Link href="/cgu">CGU</Link>
      </p>
    </main>
  );
}
