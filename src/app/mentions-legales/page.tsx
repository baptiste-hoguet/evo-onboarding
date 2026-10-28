// Informations légales de l'éditeur. À tenir à jour (ex. création de la SAS EVO Incubator).
const EDITEUR = {
  denomination: "Baptiste Hoguet",
  forme: "Entrepreneur individuel (EI)",
  adresse: "69 rue de Chabrol, 75010 Paris, France",
  siren: "984 375 121",
  siret: "984 375 121 00014",
  telephone: "+33 6 19 16 07 40",
  email: "hogbat08@gmail.com",
  directeur: "Baptiste Hoguet",
  marque: "EVO Incubator",
};

const HEBERGEUR = "Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com)";

export default function MentionsLegales() {
  return (
    <main className="wrap">
      <div>
        <div className="eyebrow"><em>EVO</em><span>·</span><span>Informations légales</span></div>
        <h1>Mentions <i>légales</i>.</h1>
        <p className="lede">Le site evo-inc.fr est édité par {EDITEUR.denomination}, entrepreneur individuel, qui exploite la marque {EDITEUR.marque}.</p>
      </div>

      <section>
        <h2>Éditeur du site</h2>
        <p className="lede">
          {EDITEUR.denomination}, {EDITEUR.forme}<br />
          Adresse : {EDITEUR.adresse}<br />
          SIREN : {EDITEUR.siren} · SIRET : {EDITEUR.siret}<br />
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
          écrivez à {EDITEUR.email}.
        </p>
      </section>
    </main>
  );
}
