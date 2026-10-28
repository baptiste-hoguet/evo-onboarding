// Informations légales de l'éditeur. À tenir à jour (ex. création de la SAS EVO Incubator).
const EDITEUR = {
  denomination: "HOGUET CAPITAL",
  forme: "Société par actions simplifiée",
  capital: "100 €",
  adresse: "20 rue Milton, 75009 Paris, France",
  siren: "106 886 682",
  rcs: "RCS Paris 106 886 682",
  tva: "FR77106886682",
  telephone: "+33 6 19 16 07 40",
  email: "hogbat08@gmail.com",
  directeur: "Baptiste Hoguet, Président",
  marque: "EVO Incubator",
};

const HEBERGEUR = "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com)";

export default function MentionsLegales() {
  return (
    <main className="wrap">
      <div>
        <div className="eyebrow"><em>EVO</em><span>·</span><span>Informations légales</span></div>
        <h1>Mentions <i>légales</i>.</h1>
        <p className="lede">Le site evo-inc.fr est édité par {EDITEUR.denomination}, qui exploite la marque {EDITEUR.marque}.</p>
      </div>

      <section>
        <h2>Éditeur du site</h2>
        <p className="lede">
          {EDITEUR.denomination}, {EDITEUR.forme} au capital de {EDITEUR.capital}<br />
          Siège social : {EDITEUR.adresse}<br />
          SIREN : {EDITEUR.siren} · {EDITEUR.rcs}<br />
          TVA intracommunautaire : {EDITEUR.tva}<br />
          Téléphone : {EDITEUR.telephone}<br />
          Email : {EDITEUR.email}
        </p>
      </section>

      <section>
        <h2>Directeur de la publication</h2>
        <p className="lede">{EDITEUR.directeur}</p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p className="lede">{HEBERGEUR}</p>
      </section>

      <section>
        <h2>Données personnelles</h2>
        <p className="lede">
          Pour toute question sur vos données ou pour exercer vos droits (accès, rectification, suppression),
          écrivez à {EDITEUR.email}. Détails dans la <a href="/confidentialite"><u>politique de confidentialité</u></a>.
        </p>
      </section>
    </main>
  );
}
