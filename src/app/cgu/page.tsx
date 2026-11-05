import Link from "next/link";
import { EDITEUR } from "@/lib/legal";

// Conditions générales d'utilisation du Diagnostic express (outil public, gratuit, sans compte).
// À mettre à jour à chaque évolution du service, en changeant la date ci-dessous.
const MAJ = "5 novembre 2026";

export default function Cgu() {
  return (
    <main className="wrap">
      <div>
        <div className="eyebrow"><em>EVO</em><span>·</span><span>Diagnostic express</span></div>
        <h1>Conditions générales <i>d’utilisation</i>.</h1>
        <p className="lede">
          Mise à jour le {MAJ}. Ces conditions encadrent l’utilisation du Diagnostic express EVO, proposé sur evo-inc.fr/diagnostic.
          En cochant la case prévue avant d’afficher votre résultat, vous les acceptez.
        </p>
      </div>

      <section>
        <h2>Éditeur</h2>
        <p className="lede">
          {EDITEUR.denomination}, {EDITEUR.forme} au capital de {EDITEUR.capital}, qui exploite la marque {EDITEUR.marque}.<br />
          Siège social : {EDITEUR.adresse}<br />
          SIREN : {EDITEUR.siren} · {EDITEUR.rcs}<br />
          Contact : {EDITEUR.email}
        </p>
      </section>

      <section>
        <h2>Objet du service</h2>
        <p className="lede">
          Le Diagnostic express est un outil gratuit d’auto-diagnostic. À partir des chiffres que vous déclarez (offre, contenu, messages, calls, ventes),
          il identifie l’étape qui freine le plus votre activité, votre « contrainte n°1 », et vous propose une action prioritaire.
          Si vous le souhaitez, ces chiffres peuvent être complétés par une lecture ponctuelle de votre compte Instagram professionnel, via l’API officielle de Meta.
        </p>
      </section>

      <section>
        <h2>Accès</h2>
        <ul className="lede">
          <li>Le service est gratuit et ne nécessite pas de créer de compte.</li>
          <li>Il est réservé aux personnes majeures qui l’utilisent dans le cadre de leur activité professionnelle, actuelle ou en projet.</li>
          <li>Un accès internet est nécessaire ; les frais de connexion restent à votre charge.</li>
        </ul>
      </section>

      <section>
        <h2>Nature du diagnostic</h2>
        <ul className="lede">
          <li>Le résultat est calculé automatiquement, selon des règles fixes définies par EVO, appliquées aux chiffres fournis. Il dépend donc entièrement de l’exactitude de ces chiffres.</li>
          <li>Il est indicatif. Il ne constitue ni un conseil personnalisé, ni un audit, ni un conseil juridique, fiscal ou financier.</li>
          <li>Il ne garantit aucun résultat, aucun nombre de clients ni aucun chiffre d’affaires. Les décisions que vous prenez à partir du diagnostic relèvent de votre seule appréciation.</li>
        </ul>
      </section>

      <section>
        <h2>Vos engagements</h2>
        <ul className="lede">
          <li>Renseigner des informations exactes et vous concernant, notamment votre prénom et votre email.</li>
          <li>Ne pas détourner le service de son objet, ni tenter d’en perturber le fonctionnement ou d’accéder à des données qui ne vous concernent pas.</li>
          <li>Ne pas l’utiliser de manière automatisée (robots, scripts, envois en masse) ni pour envoyer du spam.</li>
        </ul>
        <p className="lede">EVO peut ignorer ou supprimer un envoi manifestement faux ou abusif.</p>
      </section>

      <section>
        <h2>Connexion Instagram</h2>
        <ul className="lede">
          <li>Elle est facultative : le diagnostic fonctionne entièrement avec les chiffres saisis à la main.</li>
          <li>Elle passe uniquement par Meta : vous vous identifiez chez Meta, jamais sur evo-inc.fr. Aucun identifiant ni mot de passe n’est transmis à EVO.</li>
          <li>Les chiffres sont lus une seule fois. Aucun accès à votre compte n’est conservé : nous ne publions rien et ne lisons pas vos messages.</li>
          <li>Vous pouvez retirer l’autorisation à tout moment dans les paramètres d’Instagram ou de Facebook. Le détail figure dans la <Link href="/confidentialite"><u>politique de confidentialité</u></Link>.</li>
        </ul>
      </section>

      <section>
        <h2>Prise de rendez-vous</h2>
        <p className="lede">
          À la fin du diagnostic, vous pouvez réserver un appel avec EVO. La réservation se fait sur Calendly, un service tiers soumis à ses propres conditions
          et à sa propre politique de confidentialité. Réserver un appel est libre et n’engage à rien.
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p className="lede">
          La méthode de diagnostic, ses règles, les textes, la présentation du site et la marque {EDITEUR.marque} appartiennent à {EDITEUR.denomination}.
          Vous pouvez consulter et conserver votre résultat pour votre usage personnel. Toute reproduction ou réutilisation, notamment commerciale, demande notre accord écrit préalable.
        </p>
      </section>

      <section>
        <h2>Données personnelles</h2>
        <p className="lede">
          Les données collectées pendant le diagnostic sont traitées comme décrit dans la <Link href="/confidentialite"><u>politique de confidentialité</u></Link>,
          qui précise aussi comment exercer vos droits. Vous ne recevez nos emails au sujet des offres EVO que si vous avez coché la case prévue à cet effet.
        </p>
      </section>

      <section>
        <h2>Responsabilité</h2>
        <p className="lede">
          Nous faisons notre possible pour que le service fonctionne correctement et que ses règles soient pertinentes. Dans les limites prévues par la loi,
          {" "}{EDITEUR.denomination} ne peut être tenue responsable des décisions prises sur la base du diagnostic, d’un résultat faussé par des chiffres inexacts,
          ni des dommages indirects liés à l’utilisation du service. Rien dans ces conditions n’exclut une responsabilité qui ne peut pas l’être légalement.
        </p>
      </section>

      <section>
        <h2>Disponibilité</h2>
        <p className="lede">
          Le service est accessible en principe à tout moment, sans garantie de disponibilité continue. Nous pouvons l’interrompre pour maintenance,
          le faire évoluer, ou y mettre fin, sans que cela ouvre droit à une indemnité.
        </p>
      </section>

      <section>
        <h2>Modification des conditions</h2>
        <p className="lede">
          Ces conditions peuvent évoluer. La version applicable est celle en ligne au moment où vous utilisez le service ; la date de mise à jour figure en haut de cette page.
        </p>
      </section>

      <section>
        <h2>Droit applicable et litiges</h2>
        <p className="lede">
          Ces conditions sont soumises au droit français. Le Diagnostic express est un service gratuit destiné aux professionnels : le dispositif de médiation
          de la consommation n’a, en principe, pas vocation à s’appliquer. En cas de désaccord, écrivez-nous d’abord : nous chercherons une solution amiable.
          À défaut, le litige sera porté devant les tribunaux compétents.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p className="lede">Pour toute question sur ces conditions : {EDITEUR.email}.</p>
      </section>

      <p className="muted small">
        EVO Incubator · Hoguet Capital · <Link href="/mentions-legales">Mentions légales</Link> · <Link href="/confidentialite">Confidentialité</Link>
      </p>
    </main>
  );
}
