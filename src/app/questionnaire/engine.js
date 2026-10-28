// Moteur du questionnaire d'onboarding EVO (porté depuis prototypes/sas-onboarding.html).
// Rendu DOM direct : mountQuestionnaire(root, { initial, preview, onStart, onSave, onSubmit }) → cleanup
/* eslint-disable */
export function mountQuestionnaire(root, opts) {
root.innerHTML = `<header class="top">
  <div class="top-in">
    <div class="brand"><b>EVO</b><span>Onboarding</span></div>
    <div class="status" id="status"><span class="dot"></span><span id="status-t">Sauvegarde automatique</span></div>
  </div>
  <div class="prog"><i id="prog"></i></div>
</header>
<main class="wrap" id="app"></main>
<nav class="bar" id="bar" hidden><div class="bar-in" id="bar-in"></div></nav>`;

/* ======================= DATA ======================= */
const DAYS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];
const NETS = ["Instagram","TikTok","YouTube","LinkedIn"];
const ROUTES = { "Oui, régulièrement": "Ads directement", "Parfois": "Ads + contenu en simultané", "Non": "Contenu d'abord" };

const SECTIONS = [
{ t: "Identité et logistique", d: "Les bases pour qu'on puisse bien travailler ensemble.", qs: [
  { n:1, l:"Nom, prénom", row:true, p:[{k:"prenom",t:"text",label:"Prénom"},{k:"nom",t:"text",label:"Nom"}] },
  { n:2, l:"Nom de ta marque ou de ton business", p:[{k:"v",t:"text",ph:"ex. Coaching Ascension"}] },
  { n:3, l:"Email et numéro WhatsApp", p:[{k:"email",t:"email",label:"Email",ph:"toi@exemple.com"},{k:"tel",t:"tel",label:"WhatsApp"}] },
  { n:4, l:"Ville et fuseau horaire", row:true, p:[{k:"ville",t:"text",label:"Ville",ph:"ex. Lyon"},{k:"tz",t:"select",label:"Fuseau horaire",opts:"TZ",def:"Europe/Paris"}] },
  { n:5, l:"Statut juridique", p:[{k:"v",t:"single",opts:["Micro-entreprise","SASU","EURL","SAS","SARL","Pas encore de structure","Autre"],others:{"Autre":"Précise ton statut"}}] },
  { n:6, l:"Liens de tes réseaux et de ton site", h:"Au moins un lien. Laisse vide ce que tu n'as pas.", p:[{k:"links",t:"links",fields:["Instagram","TikTok","YouTube","LinkedIn","Site"]}] },
  { n:7, l:"Tes disponibilités pour les calls", h:"Coche tous les créneaux qui te conviennent.", p:[{k:"v",t:"grid",multi:true,rows:DAYS,cols:["Matin","Midi","Après-midi","Soir"]}] },
  { n:8, l:"Canal préféré pour te joindre", p:[{k:"v",t:"single",opts:["WhatsApp","Email","Appel","Instagram DM"]}] },
  { n:9, l:"Comment as-tu connu EVO ?", p:[{k:"v",t:"single",opts:["Instagram","YouTube","LinkedIn","Publicité","Recommandation","Événement","Autre"],others:{"Autre":"Précise"}}] },
  { n:10, l:"Qui d'autre travaille sur ton business ?", p:[
    {k:"v",t:"multi",opts:["Personne","Associé","Assistant","Monteur","Setter","Closer","Autre"],excl:["Personne"]},
    {k:"who",t:"text",label:"Prénom et rôle de chacun",ph:"ex. Léa — monteuse, Karim — setter",when:q=>(get(10,"v")||[]).some(x=>x!=="Personne")}] },
]},
{ t: "Ton business aujourd'hui", d: "Une photo honnête de là où tu en es. Il n'y a pas de bonne ou de mauvaise réponse.", qs: [
  { n:11, l:"En 3 phrases : ce que tu fais et pour qui", p:[{k:"v",t:"textarea",max:600}] },
  { n:12, l:"Depuis quand tu coaches ou vends en ligne ?", p:[{k:"v",t:"single",opts:["Moins de 6 mois","6 à 12 mois","1 à 2 ans","2 à 4 ans","4 ans et plus"]}] },
  { n:13, l:"Ton parcours avant, et pourquoi tu t'es lancé", p:[{k:"v",t:"textarea",max:1500}] },
  { n:14, l:"Ton CA mensuel moyen sur les 6 derniers mois", p:[{k:"v",t:"slider",min:0,max:30000,step:500,unit:"€",plus:true}] },
  { n:15, l:"Ton meilleur mois : montant, et ce qui l'a provoqué", p:[{k:"amt",t:"number",eur:true,label:"Montant"},{k:"why",t:"textarea",label:"Qu'est-ce qui l'a provoqué ?"}] },
  { n:16, l:"Nombre de clients accompagnés", row:true, p:[{k:"total",t:"number",min:0,label:"Total depuis le début"},{k:"now",t:"number",min:0,label:"En cours aujourd'hui"}] },
  { n:17, l:"Temps consacré au business chaque semaine", p:[{k:"v",t:"slider",min:0,max:70,step:5,unit:"h"}] },
  { n:18, l:"As-tu une activité à côté ?", p:[{k:"v",t:"single",opts:["Non, 100 % sur mon business","Salarié temps plein","Salarié temps partiel","Études","Autre business"]}] },
  { n:19, l:"As-tu déjà suivi un accompagnement ou une formation ?", p:[{k:"v",t:"yesno",follow:[{k:"det",t:"textarea",label:"Lesquels ? Ce qui a marché, ce qui n'a pas marché"}]}] },
  { n:20, l:"Ton plus gros blocage aujourd'hui, selon toi", p:[{k:"v",t:"textarea",max:800}] },
]},
{ t: "Ton offre", d: "Ton offre telle qu'elle est aujourd'hui, en quelques mots. On la retravaillera ensemble dans le module Offre.", qs: [
  { n:21, l:"Nom de ton offre principale", p:[{k:"v",t:"text"}] },
  { n:22, l:"Ta promesse en une phrase (résultat et délai)", h:"Telle que tu la formules aujourd'hui, même si elle n'est pas parfaite.", p:[{k:"v",t:"text",ph:"J'aide X à obtenir Y en Z semaines"}] },
  { n:23, l:"Prix et modalités de paiement", p:[{k:"prix",t:"number",eur:true,label:"Prix"},{k:"mod",t:"multi",label:"Modalités",opts:["1×","2×","3×","4× et plus","Mensuel","Financement externe"]}] },
  { n:24, l:"Durée et format", p:[{k:"duree",t:"select",label:"Durée",opts:["1 mois","2 mois","3 mois","6 mois","12 mois","Autre"],others:{"Autre":"Précise la durée"}},{k:"fmt",t:"multi",label:"Format",opts:["1:1","Groupe","Vidéo","Hybride","Présentiel"]}] },
  { n:25, l:"Ce que contient ton offre", p:[{k:"v",t:"multi",opts:["Calls 1:1","Calls de groupe","Modules vidéo","Support WhatsApp","Communauté","Templates","Autre"],others:{"Autre":"Précise"}}] },
  { n:26, l:"Un ou deux résultats obtenus par tes clients", p:[{k:"v",t:"textarea",max:500,ph:"Prénom — situation avant → résultat chiffré"}] },
  { n:27, l:"Combien de témoignages as-tu ?", p:[{k:"nb",t:"number",min:0},{k:"files",t:"file",opt:true,label:"Ajoute-les si tu veux (facultatif)",accept:"image/*,application/pdf,video/*",maxMB:50,fmtNote:"Images, PDF ou vidéo · 50 Mo max"}] },
  { n:28, l:"As-tu eu des remboursements ou des clients insatisfaits ?", p:[{k:"v",t:"yesno",follow:[{k:"det",t:"text",label:"Combien et pourquoi ?"}]}] },
  { n:29, l:"Tes autres offres", req:false, p:[{k:"v",t:"multi",opts:["Aucune","Low ticket","Upsell","Renouvellement","Communauté payante"],excl:["Aucune"]},{k:"prix",t:"text",label:"Prix de chacune",ph:"ex. Low ticket 47 €, renouvellement 1 500 €",when:()=>(get(29,"v")||[]).some(x=>x!=="Aucune")}] },
  { n:32, l:"Proposes-tu une garantie ?", p:[{k:"v",t:"yesno",follow:[{k:"det",t:"text",label:"Laquelle ?"}]}] },
  { n:33, l:"Nombre maximum de clients en parallèle", p:[{k:"v",t:"number",min:1}] },
]},
{ t: "Marché et avatar", d: "Une première esquisse de ton client idéal. On la précisera ensemble dans le module Avatar.", qs: [
  { n:34, l:"Ta niche en une phrase", p:[{k:"v",t:"text"}] },
  { n:35, l:"Ton client idéal", p:[{k:"age",t:"range2",label:"Tranche d'âge",min:18,max:65,def:[25,45]},{k:"sexe",t:"single",label:"Sexe",opts:["Homme","Femme","Mixte"]},{k:"pro",t:"text",label:"Situation pro",ph:"ex. salarié cadre qui veut se lancer"},{k:"rev",t:"select",label:"Revenus mensuels",opts:["Moins de 1 500 €","1 500 – 3 000 €","3 000 – 5 000 €","5 000 € et plus"]}] },
  { n:36, l:"En quelques lignes : son problème, ce qu'il a déjà essayé, et le résultat qu'il veut", h:"Écris spontanément, sans chercher la formule parfaite.", p:[{k:"v",t:"textarea",max:600}] },
  { n:40, l:"Où il passe son temps en ligne", p:[{k:"v",t:"multi",opts:["Instagram","TikTok","YouTube","LinkedIn","Facebook","Snapchat","Podcasts","Autre"],others:{"Autre":"Précise"}}] },
  { n:43, l:"Comptes concurrents ou de référence", h:"Entre 1 et 5 liens.", p:[{k:"v",t:"repeat",min:1,max:5}] },
  { n:45, l:"Capacité de paiement réelle de ton audience", p:[{k:"v",t:"single",opts:["Moins de 500 €","500 – 1 500 €","1 500 – 3 000 €","3 000 – 5 000 €","5 000 € et plus","Je ne sais pas"]}] },
]},
{ t: "Contenu et audience", d: "Ce que tu publies, et ce que ça te ramène.", qs: [
  { n:46, l:"Tes abonnés par réseau, et ta plateforme principale", dyn:followersParts },
  { n:47, l:"Ta fréquence de publication", p:[{k:"v",t:"grid",rows:["Reels","Stories","Posts","Vidéos longues"],cols:["Jamais","< 1×/sem","1-3×/sem","4-6×/sem","Quotidien"]}] },
  { n:48, l:"Tes 3 meilleurs contenus, et pourquoi ils ont marché", p:[1,2,3].flatMap(i=>[{k:"u"+i,t:"url",label:"Contenu "+i},{k:"w"+i,t:"text",ph:"Pourquoi il a marché"}]) },
  { n:49, l:"Ton contenu t'amène-t-il des prospects qualifiés ?", route:true, p:[{k:"v",t:"single",opts:["Oui, régulièrement","Parfois","Non"]}] },
  { n:50, l:"Leads ou DM entrants par semaine", p:[{k:"v",t:"slider",min:0,max:50,step:1,unit:"",plus:true}] },
  { n:51, l:"Part de tes leads qui vient du contenu", p:[{k:"v",t:"slider",min:0,max:100,step:10,unit:"%"}] },
  { n:52, l:"Ton aisance face caméra", p:[{k:"v",t:"scale",lo:"Je bloque",hi:"Je suis dans mon élément"}] },
  { n:53, l:"Qui écrit, tourne et monte ton contenu ?", p:[{k:"v",t:"grid",rows:["Écriture","Tournage","Montage"],cols:["Moi","Équipe","Freelance","Personne"]}] },
  { n:54, l:"Ton matériel disponible", p:[{k:"v",t:"multi",opts:["Smartphone","Caméra","Micro","Lumière","Trépied","Rien"],excl:["Rien"]}] },
  { n:55, l:"Temps disponible pour tourner chaque semaine", p:[{k:"v",t:"slider",min:0,max:15,step:1,unit:"h"}] },
  { n:56, l:"As-tu un lead magnet ou un freebie ?", p:[{k:"v",t:"yesno",follow:[{k:"url",t:"url",label:"Lien"}]}] },
  { n:57, l:"Taille de ta liste email, Telegram ou communauté", req:false, row:true, p:[{k:"email",t:"number",min:0,label:"Liste email",opt:true},{k:"tg",t:"number",min:0,label:"Telegram",opt:true},{k:"com",t:"number",min:0,label:"Communauté",opt:true}] },
  { n:58, l:"Sujets ou limites d'image que tu refuses", req:false, p:[{k:"v",t:"textarea"}] },
]},
{ t: "Publicité", d: "Ton historique et ta situation côté ads.", qs: [
  { n:59, l:"Ton expérience de la pub", p:[{k:"v",t:"single",opts:["Jamais","Quelques boosts","Campagnes Meta","Autres plateformes"]}] },
  { n:60, l:"Budget dépensé, résultats et coût par lead", when:()=>adsXp(), row:true, p:[{k:"budget",t:"number",eur:true,label:"Budget total"},{k:"cpl",t:"number",eur:true,label:"Coût par lead moyen"},{k:"res",t:"textarea",label:"Résultats",full:true}] },
  { n:61, l:"As-tu un Business Manager, un compte pub, un pixel ?", p:[{k:"v",t:"grid",rows:["Business Manager","Compte publicitaire","Pixel"],cols:["Oui","Non","Je ne sais pas"]}] },
  { n:62, l:"Es-tu admin de ta page Facebook et de ton compte Instagram pro ?", p:[{k:"v",t:"grid",rows:["Page Facebook","Compte Instagram pro"],cols:["Oui","Non","Je ne sais pas"]}] },
  { n:63, l:"As-tu une carte bancaire pro pour les ads ?", p:[{k:"v",t:"yesno"}] },
  { n:64, l:"Budget ads mensuel envisageable après les 300 € de départ", p:[{k:"v",t:"slider",min:0,max:5000,step:100,unit:"€",plus:true}] },
  { n:65, l:"Ton compte a-t-il déjà été restreint ou banni ?", when:()=>adsXp(), p:[{k:"v",t:"yesno",follow:[{k:"det",t:"text",label:"Quand et pourquoi ?"}]}] },
  { n:66, l:"Tes freins vis-à-vis de la pub", p:[{k:"v",t:"multi",opts:["Budget","Peur de perdre de l'argent","Technique","Pas le temps","Aucun","Autre"],excl:["Aucun"],others:{"Autre":"Précise"}}] },
]},
{ t: "Setting et sales", d: "Comment un prospect devient client chez toi.", qs: [
  { n:67, l:"Ton process de vente actuel", p:[{k:"v",t:"textarea",ph:"DM → appel découverte → call de vente → paiement"}] },
  { n:68, l:"Qui gère les DM et le setting ?", p:[{k:"v",t:"single",opts:["Moi","Setter interne","Setter freelance","Personne"]}] },
  { n:69, l:"Calls de vente par mois", p:[{k:"v",t:"slider",min:0,max:60,step:1,unit:""}] },
  { n:70, l:"Ton taux de closing estimé", p:[{k:"v",t:"slider",min:0,max:100,step:5,unit:"%",dunno:true}] },
  { n:71, l:"As-tu un script de vente ?", p:[{k:"v",t:"yesno",follow:[{k:"file",t:"file",opt:true,label:"Ajoute-le si tu veux (facultatif)",accept:".pdf,.docx,application/pdf",maxMB:20,fmtNote:"PDF ou DOCX"}]}] },
  { n:72, l:"Les 3 objections que tu entends le plus", p:[1,2,3].map(i=>({k:"o"+i,t:"text",ph:"Objection "+i})) },
  { n:73, l:"Ton outil de prise de rendez-vous", p:[{k:"v",t:"single",opts:["Calendly","iClosed","Google Agenda","Aucun","Autre"],others:{"Autre":"Lequel ?"}}] },
  { n:74, l:"Ton moyen d'encaissement", p:[{k:"v",t:"multi",opts:["Stripe","PayPal","Virement","SumUp","Financement (Alma, Klarna…)","Autre"],others:{"Autre":"Précise"}}] },
  { n:75, l:"Enregistres-tu tes calls ?", p:[{k:"v",t:"yesno"}] },
]},
{ t: "Outils et accès", d: "Ce que tu utilises déjà. On ne te demandera jamais de mot de passe.", qs: [
  { n:76, l:"Les outils que tu utilises", p:[{k:"v",t:"multi",opts:["Notion","Google Drive","Canva","CapCut","CRM","Systeme.io","Kajabi","Skool","Insyder","Reep.it","Autre"],others:{"CRM":"Quel CRM ?","Autre":"Précise"}}] },
  { n:77, l:"As-tu une page de vente, un site ou un tunnel ?", p:[{k:"v",t:"yesno",follow:[{k:"url",t:"url",label:"Lien"}]}] },
  { n:78, l:"Accès à tes statistiques Instagram et Meta", p:[{k:"v",t:"consent",text:"J'accepte de partager mes statistiques avec l'équipe EVO.",small:"On t'enverra une invitation d'accès. Aucun mot de passe ne te sera jamais demandé."}] },
  { n:79, l:"Adresse Gmail pour le partage Drive", h:"Pré-remplie avec ton email, modifie-la si besoin.", p:[{k:"v",t:"email",ph:"toi@gmail.com"}] },
]},
{ t: "Objectifs", d: "Où tu veux aller, et pourquoi.", qs: [
  { n:80, l:"Le CA mensuel que tu vises", check:goalsCheck, p:[["m3","Dans 3 mois"],["m6","Dans 6 mois"],["m12","Dans 12 mois"]].map(([k,l])=>({k,t:"slider",label:l,min:0,max:50000,step:1000,unit:"€"})) },
  { n:81, l:"Nombre de clients visé par mois", p:[{k:"v",t:"number",min:1}] },
  { n:82, l:"Ce qui ferait de l'accompagnement un succès", p:[{k:"v",t:"textarea"}] },
  { n:83, l:"Ce qui te ferait dire que c'est un échec", p:[{k:"v",t:"textarea"}] },
  { n:84, l:"Ce que ce CA va changer dans ta vie", p:[{k:"v",t:"textarea"}] },
  { n:85, l:"As-tu une échéance personnelle ?", req:false, p:[{k:"v",t:"yesno",follow:[{k:"date",t:"date",label:"Date"},{k:"det",t:"text",label:"De quoi s'agit-il ?"}]}] },
]},
{ t: "Mindset et fonctionnement", d: "Pour qu'on t'accompagne de la bonne façon.", qs: [
  { n:86, l:"Ton niveau d'engagement", p:[{k:"v",t:"scale",lo:"Faible",hi:"Total"},{k:"risk",t:"text",label:"Qu'est-ce qui pourrait le faire baisser ?"}] },
  { n:87, l:"Comment tu réagis quand ça ne marche pas", p:[{k:"v",t:"textarea"}] },
  { n:88, l:"Tu préfères un feedback…", p:[{k:"v",t:"single",opts:["Direct, sans filtre","Progressif","Les deux selon le sujet"]}] },
  { n:89, l:"Des contraintes perso à connaître ?", req:false, h:"Uniquement ce que tu souhaites partager.", p:[{k:"v",t:"textarea"}] },
  { n:90, l:"Autre chose qu'on devrait savoir ?", req:false, p:[{k:"v",t:"textarea"}] },
]},
];

/* flatten yes/no follow-ups into conditional parts */
const QMAP = {};
let QCOUNT = 0;
SECTIONS.forEach((s, si) => s.qs.forEach(q => {
  q.si = si; q.req = q.req !== false; q.num = ++QCOUNT; QMAP[q.n] = q;
  if (q.p) q.p = q.p.flatMap(p => p.follow ? [p, ...p.follow.map(f => ({ ...f, force: true, when: () => get(q.n, p.k) === "Oui" }))] : [p]);
}));

function followersParts() {
  const filled = NETS.filter(x => !blank(get(6, "links")?.[x]));
  const list = filled.length ? filled : NETS;
  const parts = filled.map(x => ({ k: "f_" + x, t: "number", min: 0, label: "Abonnés " + x }));
  parts.push({ k: "main", t: "single", label: "Plateforme principale", opts: list });
  return parts;
}
function adsXp() { const v = get(59, "v"); return !!v && v !== "Jamais"; }
function goalsCheck() {
  const a = get(80, "m3"), b = get(80, "m6"), c = get(80, "m12");
  if (a == null || b == null || c == null) return null;
  return (c >= b && b >= a) ? null : "Ton objectif à 12 mois doit être au moins égal à celui à 6 mois, lui-même au moins égal à celui à 3 mois.";
}

/* ======================= STATE ======================= */
// opts.initial = { id, answers, section } ; opts.preview = true → aucune réponse obligatoire
const PREVIEW = !!opts.preview;
let respId = opts.initial?.id || null;
let S = { a: { ...(opts.initial?.answers || {}) }, screen: "welcome", sec: opts.initial?.section || 0, fromRecap: false, sentAt: null };
const shown = new Set(); // questions whose errors are visible

function get(n, k) { return S.a[n + "." + k]; }
function set(n, k, v) { S.a[n + "." + k] = v; }
function blank(v) { return v == null || v === "" || (Array.isArray(v) && !v.length); }

let saveT = null, saving = false, dirty = false;
function setStatus(txt, ok) {
  const st = document.getElementById("status"), t = document.getElementById("status-t");
  if (!st || !t) return;
  st.classList.toggle("saved", !!ok); st.classList.toggle("fail", ok === false);
  t.textContent = txt;
}
function save() {
  if (!respId || S.screen === "done") return;
  dirty = true;
  clearTimeout(saveT);
  saveT = setTimeout(flush, 700);
}
async function flush() {
  if (!respId || saving || !dirty) return;
  saving = true; dirty = false;
  try {
    await opts.onSave(respId, { answers: S.a, section: S.sec });
    const d = new Date();
    setStatus("Enregistré à " + String(d.getHours()).padStart(2, "0") + "h" + String(d.getMinutes()).padStart(2, "0"), true);
  } catch (e) {
    dirty = true;
    setStatus("Connexion perdue, nouvel essai…", false);
    clearTimeout(saveT); saveT = setTimeout(flush, 4000);
  } finally { saving = false; if (dirty) { clearTimeout(saveT); saveT = setTimeout(flush, 700); } }
}
const onLeave = () => { if (dirty) flush(); };
window.addEventListener("pagehide", onLeave);
document.addEventListener("visibilitychange", onLeave);

/* ======================= HELPERS ======================= */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nb = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const slug = s => s.normalize("NFD").replace(/[^\w]/g, "").toLowerCase();
const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const reUrl = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;
const okUrl = v => reUrl.test(String(v).trim());
let TZ;
function tzList() {
  if (TZ) return TZ;
  try { TZ = Intl.supportedValuesOf("timeZone"); } catch (e) { TZ = null; }
  if (!TZ || !TZ.length) TZ = ["Europe/Paris","Europe/Brussels","Europe/Zurich","Europe/London","Europe/Madrid","Europe/Lisbon","Africa/Casablanca","Africa/Algiers","Africa/Tunis","Africa/Dakar","Africa/Abidjan","America/Montreal","America/New_York","America/Martinique","America/Guadeloupe","Indian/Reunion","Pacific/Tahiti","Asia/Dubai","Asia/Bangkok"];
  if (!TZ.includes("Europe/Paris")) TZ = ["Europe/Paris", ...TZ];
  return TZ;
}
const partsOf = q => q.dyn ? q.dyn() : q.p;
const visQ = q => !q.when || q.when();
const visP = p => !p.when || p.when();
const isReq = (q, p) => !p.opt && (q.req || p.force);
function sliderText(p, v) {
  if (v == null) return "Fais glisser";
  const s = p.unit === "€" ? nb(v) + " €" : p.unit === "%" ? v + " %" : p.unit === "h" ? v + " h" : nb(v);
  return p.plus && v >= p.max ? s + " +" : s;
}
function othersFor(p) { return p.others || {}; }

/* ======================= VALIDATION ======================= */
function partErr(q, p) {
  const v = get(q.n, p.k), req = isReq(q, p), R = "Ce champ est obligatoire.";
  const othersMissing = sel => sel.filter(o => othersFor(p)[o] && blank(get(q.n, p.k + "__" + slug(o)))).length;
  switch (p.t) {
    case "text": case "textarea": case "date":
      if (req && blank(v)) return R;
      if (p.max && v && v.length > p.max) return `Maximum ${nb(p.max)} caractères.`;
      return null;
    case "number":
      if (req && blank(v)) return R;
      if (!blank(v) && p.min != null && +v < p.min) return `Le minimum est ${p.min}.`;
      return null;
    case "select":
      if (req && blank(v)) return "Choisis une option.";
      if (v && othersMissing([v])) return "Précise ta réponse.";
      return null;
    case "email":
      if (blank(v)) return req ? R : null;
      return reEmail.test(v.trim()) ? null : "Cette adresse email n'est pas valide.";
    case "url":
      if (blank(v)) return req ? R : null;
      return okUrl(v) ? null : "Ce lien n'est pas valide (ex. instagram.com/ton-compte).";
    case "tel":
      if (blank(v)) return req ? R : null;
      return v.replace(/\D/g, "").length >= 6 ? null : "Ce numéro semble incomplet.";
    case "single": case "yesno":
      if (req && blank(v)) return p.t === "yesno" ? "Réponds par Oui ou Non." : "Choisis une réponse.";
      if (v && othersMissing([v])) return "Précise ta réponse.";
      return null;
    case "multi":
      if (req && blank(v)) return "Coche au moins une réponse.";
      if (v && othersMissing(v)) return "Précise ta réponse dans le champ ouvert.";
      return null;
    case "slider":
      if (p.dunno && get(q.n, p.k + "__nsp")) return null;
      return req && v == null ? "Fais glisser le curseur pour répondre." : null;
    case "scale":
      return req && v == null ? "Choisis une note de 1 à 10." : null;
    case "grid": {
      const g = v || {};
      if (!req) return null;
      if (p.multi) return Object.values(g).some(a => a && a.length) ? null : "Coche au moins un créneau.";
      return p.rows.every(r => g[r]) ? null : "Réponds pour chaque ligne.";
    }
    case "consent": return req && !v ? "Coche la case pour continuer." : null;
    case "links": {
      const L = v || {}, filled = p.fields.filter(f => !blank(L[f]));
      if (req && !filled.length) return "Renseigne au moins un lien.";
      const bad = filled.filter(f => !okUrl(L[f]));
      return bad.length ? `Lien non valide : ${bad.join(", ")}.` : null;
    }
    case "repeat": {
      const L = (v || []).filter(x => !blank(x));
      if (L.some(x => !okUrl(x))) return "Un des liens n'est pas valide.";
      return req && L.length < p.min ? `Ajoute au moins ${p.min} liens.` : null;
    }
    default: return null;
  }
}
function qErrors(q) {
  const e = {};
  if (!visQ(q)) return e;
  partsOf(q).forEach(p => { if (visP(p)) { const m = partErr(q, p); if (m) e[p.k] = m; } });
  if (q.check) { const m = q.check(); if (m) e._q = m; }
  return e;
}
const qOk = q => !Object.keys(qErrors(q)).length;

/* ======================= RENDER: parts ======================= */
function fid(n, k) { return `f-${n}-${k}`; }
function renderPart(q, p) {
  const n = q.n, v = get(n, p.k), id = fid(n, p.k);
  const lab = p.label ? `<label class="sub" for="${id}">${esc(p.label)}</label>` : "";
  const da = `data-n="${n}" data-k="${p.k}"`;
  let h = "";
  switch (p.t) {
    case "text": h = `<input class="in" id="${id}" type="text" maxlength="150" ${da} placeholder="${esc(p.ph || "")}" value="${esc(v)}">`; break;
    case "email": h = `<input class="in" id="${id}" type="email" inputmode="email" autocomplete="email" ${da} placeholder="${esc(p.ph || "")}" value="${esc(v)}">`; break;
    case "url": h = `<input class="in" id="${id}" type="url" inputmode="url" ${da} placeholder="${esc(p.ph || "https://")}" value="${esc(v)}">`; break;
    case "date": h = `<input class="in" id="${id}" type="date" ${da} value="${esc(v)}">`; break;
    case "number":
      h = `<div class="affix"><input class="in" id="${id}" type="text" inputmode="numeric" data-kind="num" ${da} placeholder="0" value="${blank(v) ? "" : nb(v)}">${p.eur ? "<span>€</span>" : ""}</div>`; break;
    case "tel": {
      const cc = get(n, p.k + "__cc") || "+33";
      const codes = ["+33","+32","+41","+352","+377","+1","+44","+34","+351","+39","+49","+212","+213","+216","+221","+225","+237","+262","+590","+596","+971"];
      h = `<div class="tel"><select class="in" aria-label="Indicatif pays" data-n="${n}" data-k="${p.k}__cc">${codes.map(c => `<option${c === cc ? " selected" : ""}>${c}</option>`).join("")}</select><input class="in" id="${id}" type="tel" inputmode="tel" autocomplete="tel-national" ${da} placeholder="6 12 34 56 78" value="${esc(v)}"></div>`; break;
    }
    case "textarea": {
      const len = (v || "").length;
      h = `<textarea class="in" id="${id}" ${da} rows="4" placeholder="${esc(p.ph || "")}">${esc(v)}</textarea>` +
        (p.max ? `<div class="count${len > p.max ? " over" : ""}" id="${id}-c">${nb(len)} / ${nb(p.max)}</div>` : ""); break;
    }
    case "select": {
      const opts = p.opts === "TZ" ? tzList() : p.opts;
      h = `<select class="in" id="${id}" ${da} data-re="1"><option value="">Choisir…</option>${opts.map(o => `<option value="${esc(o)}"${o === v ? " selected" : ""}>${esc(p.opts === "TZ" ? o.replace(/_/g, " ") : o)}</option>`).join("")}</select>` + othersHtml(q, p, v ? [v] : []); break;
    }
    case "single": case "multi": case "yesno": {
      const opts = p.t === "yesno" ? ["Oui", "Non"] : p.opts, multi = p.t === "multi";
      const sel = multi ? (v || []) : (v ? [v] : []);
      h = `<div class="choices${p.t === "yesno" ? " two" : ""}" role="${multi ? "group" : "radiogroup"}" ${p.label ? `aria-label="${esc(p.label)}"` : ""} id="${id}">` +
        opts.map(o => `<button type="button" class="choice${multi ? " box" : ""}" data-act="pick" ${da} data-v="${esc(o)}" aria-pressed="${sel.includes(o)}">${esc(o)}</button>`).join("") + `</div>` + othersHtml(q, p, sel);
      if (q.route && v) h += `<div class="route">Ton parcours démarre par <b>${esc(ROUTES[v])}</b>. On l'ajuste ensemble au premier call.</div>`;
      if (p.label) h = `<span class="sub">${esc(p.label)}</span>` + h;
      return wrapPart(q, p, h, true);
    }
    case "scale":
      h = `<div class="scale" role="radiogroup" id="${id}">${Array.from({ length: 10 }, (_, i) => i + 1).map(i => `<button type="button" class="choice" data-act="pick" ${da} data-v="${i}" aria-pressed="${v === i}">${i}</button>`).join("")}</div><div class="ends"><span>1 · ${esc(p.lo)}</span><span>10 · ${esc(p.hi)}</span></div>`; break;
    case "slider": {
      const nsp = p.dunno && get(n, p.k + "__nsp");
      const val = v ?? p.min, pct = ((val - p.min) / (p.max - p.min)) * 100;
      h = `<div class="slider${v == null ? " idle" : ""}${nsp ? " off" : ""}" style="--p:${pct}%"><output class="bubble" id="${id}-o">${sliderText(p, v)}</output><input id="${id}" type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${val}" data-kind="range" ${da} style="--p:${pct}%" aria-valuetext="${esc(sliderText(p, v))}"></div>` +
        `<div class="ends"><span>${sliderText(p, p.min)}</span><span>${sliderText(p, p.max)}</span></div>` +
        (p.dunno ? `<label class="check"><input type="checkbox" data-n="${n}" data-k="${p.k}__nsp" data-re="1"${nsp ? " checked" : ""}> Je ne sais pas</label>` : ""); break;
    }
    case "range2": {
      const [a, b] = v || p.def, w = p.max - p.min;
      h = `<div class="sub" id="${id}-l">${esc(p.label)} · <span class="dual-val" id="${id}-o">${a} – ${b} ans</span></div><div class="dual" id="${id}"><div class="track"><i id="${id}-t" style="left:${(a - p.min) / w * 100}%;right:${100 - (b - p.min) / w * 100}%"></i></div>` +
        `<input type="range" aria-label="Âge minimum" min="${p.min}" max="${p.max}" value="${a}" data-kind="r2" data-i="0" ${da}><input type="range" aria-label="Âge maximum" min="${p.min}" max="${p.max}" value="${b}" data-kind="r2" data-i="1" ${da}></div><div class="ends"><span>${p.min} ans</span><span>${p.max} ans</span></div>`;
      return wrapPart(q, p, h, true);
    }
    case "grid": {
      const g = v || {};
      h = `<div class="gq" id="${id}">${p.rows.map(r => `<div class="grow"><div class="glabel">${esc(r)}</div><div class="gchips" role="${p.multi ? "group" : "radiogroup"}" aria-label="${esc(r)}">${p.cols.map(c => {
        const on = p.multi ? (g[r] || []).includes(c) : g[r] === c;
        return `<button type="button" class="choice sm" data-act="grid" ${da} data-r="${esc(r)}" data-c="${esc(c)}" aria-pressed="${on}">${esc(c)}</button>`;
      }).join("")}</div></div>`).join("")}</div>`; break;
    }
    case "consent":
      h = `<label class="check consent"><input type="checkbox" id="${id}" ${da} data-re="1"${v ? " checked" : ""}><span>${esc(p.text)}<small>${esc(p.small)}</small></span></label>`;
      return wrapPart(q, p, h, true);
    case "links": {
      const L = v || {};
      h = `<div class="links" id="${id}">${p.fields.map(f => `<div class="link-row"><label for="${id}-${slug(f)}">${f}</label><input class="in" id="${id}-${slug(f)}" type="url" inputmode="url" data-kind="obj" data-f="${f}" ${da} placeholder="${f === "Site" ? "tonsite.fr" : f.toLowerCase() + ".com/…"}" value="${esc(L[f])}"></div>`).join("")}</div>`; break;
    }
    case "repeat": {
      const L = v && v.length ? v : Array(p.min).fill("");
      h = `<div class="links" id="${id}">${L.map((x, i) => `<div class="rep-row"><input class="in" type="url" inputmode="url" aria-label="Lien ${i + 1}" data-kind="arr" data-i="${i}" ${da} placeholder="instagram.com/compte-de-reference" value="${esc(x)}"><button type="button" class="icon-btn" data-act="rm" ${da} data-i="${i}" aria-label="Retirer le lien ${i + 1}"${L.length <= 1 ? " disabled" : ""}>×</button></div>`).join("")}</div>` +
        (L.length < p.max ? `<button type="button" class="btn btn-ghost add" data-act="add" ${da}>+ Ajouter un lien</button>` : ""); break;
    }
    case "file": {
      const F = v || [];
      h = `<label class="drop" data-drop="1" ${da}><input type="file" id="${id}" multiple accept="${p.accept}" ${da} data-kind="file"><span>Glisse tes fichiers ici ou <u>parcours ton appareil</u></span><small>${esc(p.fmtNote)}</small></label>` +
        (F.length ? `<ul class="files">${F.map((f, i) => `<li><span>${esc(f.name)}</span><small>${(f.size / 1048576).toFixed(1)} Mo</small><button type="button" class="btn-text" data-act="rmfile" ${da} data-i="${i}">Retirer</button></li>`).join("")}</ul>` : ""); break;
    }
  }
  return wrapPart(q, p, lab + h);
}
function othersHtml(q, p, sel) {
  const O = othersFor(p);
  return sel.filter(o => O[o]).map(o => {
    const k = p.k + "__" + slug(o), id = fid(q.n, k);
    return `<input class="in" id="${id}" type="text" maxlength="150" data-n="${q.n}" data-k="${k}" aria-label="${esc(O[o])}" placeholder="${esc(O[o])}" value="${esc(get(q.n, k))}">`;
  }).join("");
}
function wrapPart(q, p, inner) {
  return `<div class="part" data-part="${p.k}"${p.full ? ' style="grid-column:1/-1"' : ""}>${inner}<div class="err" id="e-${q.n}-${p.k}"></div></div>`;
}
function renderQ(q) {
  if (!visQ(q)) return `<div class="q" data-q="${q.n}" hidden></div>`;
  const parts = partsOf(q).filter(visP);
  const note = q.n === 46 && !NETS.some(x => !blank(get(6, "links")?.[x])) ? `<p class="note">Tu n'as pas renseigné de réseau social en section 1. Indique simplement ta plateforme principale.</p>` : "";
  return `<section class="q" data-q="${q.n}">
    <div class="q-head"><span class="q-num">${q.num}</span><h3 class="q-title">${esc(q.l)}${q.req ? "" : '<span class="tag">Facultatif</span>'}${q.route ? '<span class="tag gold">Oriente ton parcours</span>' : ""}</h3></div>
    <div class="q-body">${q.h ? `<p class="help">${esc(q.h)}</p>` : ""}${note}
      <div class="${q.row ? "row2" : "part"}" style="${q.row ? "" : "gap:16px"}">${parts.map(p => renderPart(q, p)).join("")}</div>
      <div class="err" id="e-${q.n}-_q"></div>
    </div></section>`;
}
function paintErrors(q) {
  const e = shown.has(q.n) ? qErrors(q) : {};
  const el = document.querySelector(`.q[data-q="${q.n}"]`);
  if (!el) return;
  el.querySelectorAll(".part").forEach(pe => {
    const k = pe.dataset.part, m = e[k] || "";
    pe.classList.toggle("bad", !!m);
    const er = document.getElementById(`e-${q.n}-${k}`); if (er) er.textContent = m;
  });
  const qe = document.getElementById(`e-${q.n}-_q`); if (qe) qe.textContent = e._q || "";
}
function rerenderQ(n) {
  const q = QMAP[n], el = document.querySelector(`.q[data-q="${n}"]`);
  if (!el) return;
  el.outerHTML = renderQ(q);
  paintErrors(q);
}

/* ======================= PROGRESS ======================= */
function progress() {
  let tot = 0, ok = 0;
  SECTIONS.forEach(s => s.qs.forEach(q => { if (q.req && visQ(q)) { tot++; if (qOk(q)) ok++; } }));
  return tot ? Math.round(ok / tot * 100) : 0;
}
function paintProgress() {
  const pc = S.screen === "done" ? 100 : progress();
  document.getElementById("prog").style.width = pc + "%";
  const lab = document.getElementById("sec-pc");
  if (lab) lab.textContent = pc + " %";
}
const secOk = si => SECTIONS[si].qs.every(qOk);

/* ======================= SCREENS ======================= */
const app = root.querySelector("#app"), bar = root.querySelector("#bar"), barIn = root.querySelector("#bar-in");

function applyDefaults(si) {
  SECTIONS[si].qs.forEach(q => (q.p || []).forEach(p => {
    if (p.def != null && get(q.n, p.k) == null) set(q.n, p.k, p.def);
  }));
  if (si === 7 && get(79, "v") == null && get(3, "email")) set(79, "v", get(3, "email"));
}

function render() {
  shown.clear();
  window.scrollTo(0, 0);
  if (S.screen === "section" || S.screen === "recap") save();
  ({ welcome: viewWelcome, section: viewSection, recap: viewRecap, done: viewDone })[S.screen]();
  paintProgress();
}

function viewWelcome() {
  const started = Object.keys(S.a).length > 0;
  const prenom = get(1, "prenom");
  bar.hidden = true;
  app.innerHTML = `<div class="fade">
    <div class="eyebrow"><em>Incubateur EVO</em><span>·</span><span>Questionnaire d'onboarding</span></div>
    <h1>${started && prenom ? `Content de te revoir, <i>${esc(prenom)}</i>.` : `Bienvenue chez <i>EVO</i>.`}</h1>
    <p class="lede">${started
      ? "Tes réponses sont enregistrées. Reprends là où tu t'étais arrêté, rien n'est perdu."
      : "Ce questionnaire pose les fondations de ton accompagnement. Plus tu es précis, plus on pourra construire un plan qui te ressemble dès le premier call."}</p>
    <ul class="facts">
      <li><strong>≈ 35 min</strong> environ</li>
      <li><strong>10</strong> sections</li>
      <li><strong>${QCOUNT}</strong> questions</li>
      <li><strong>Sauvegarde</strong> automatique</li>
    </ul>
    <div class="toc">${SECTIONS.map((s, i) => `<div class="${started && secOk(i) ? "done" : ""}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(s.t)}</div>`).join("")}</div>
    <div class="promise">
      <p>Tu peux quitter à tout moment et reprendre plus tard : garde bien le lien de cette page.</p>
      <p>Tu relis et modifies tout avant l'envoi final.</p>
      <p>On ne te demandera jamais de mot de passe ni d'identifiant.</p>
    </div>
    <div class="cta-row">
      <button class="btn btn-gold" data-act="start">${started ? `Reprendre · section ${S.sec + 1}` : "Commencer"} <span class="arrow">→</span></button>
    </div>
  </div>`;
}

function viewSection() {
  const si = S.sec, s = SECTIONS[si];
  applyDefaults(si);
  app.innerHTML = `<div class="fade">
    <div class="sec-head">
      <div class="eyebrow"><em>Section ${si + 1}/10</em><span>·</span><span id="sec-pc"></span><span>complété</span></div>
      <h1>${esc(s.t)}</h1>
      <p class="lede">${esc(s.d)}</p>
    </div>
    ${s.qs.map(renderQ).join("")}
  </div>`;
  bar.hidden = false;
  const last = si === SECTIONS.length - 1;
  barIn.innerHTML = `
    ${si > 0 && !S.fromRecap ? `<button class="btn btn-ghost" data-act="prev"><span class="arrow">←</span> Précédent</button>` : S.fromRecap ? "" : `<button class="btn btn-ghost" data-act="home"><span class="arrow">←</span> Accueil</button>`}
    <div class="bar-msg" id="bar-msg" role="status"></div>
    <button class="btn btn-gold" data-act="next">${S.fromRecap ? "Retour au récapitulatif" : last ? "Relire mes réponses" : "Continuer"} <span class="arrow">→</span></button>`;
  save();
}

function answerText(q, p) {
  const n = q.n, v = get(n, p.k), O = othersFor(p);
  const withOther = o => O[o] && get(n, p.k + "__" + slug(o)) ? `${o} (${get(n, p.k + "__" + slug(o))})` : o;
  switch (p.t) {
    case "number": return blank(v) ? "" : nb(v) + (p.eur ? " €" : "");
    case "tel": return blank(v) ? "" : (get(n, p.k + "__cc") || "+33") + " " + v;
    case "select": case "single": case "yesno": return blank(v) ? "" : withOther(v);
    case "multi": return blank(v) ? "" : v.map(withOther).join(", ");
    case "slider": return p.dunno && get(n, p.k + "__nsp") ? "Je ne sais pas" : v == null ? "" : sliderText(p, v);
    case "range2": return v ? `${v[0]} – ${v[1]} ans` : "";
    case "scale": return v == null ? "" : v + " / 10";
    case "grid": {
      const g = v || {};
      return p.rows.map(r => { const x = g[r]; return x && x.length ? `${r} : ${Array.isArray(x) ? x.join(", ") : x}` : null; }).filter(Boolean).join("\n");
    }
    case "consent": return v ? "Accepté" : "";
    case "links": return p.fields.filter(f => !blank((v || {})[f])).map(f => `${f} : ${v[f]}`).join("\n");
    case "repeat": return (v || []).filter(x => !blank(x)).join("\n");
    case "file": return (v || []).map(f => f.name).join(", ");
    case "date": return v ? new Date(v + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
    default: return v || "";
  }
}
function qAnswer(q) {
  return partsOf(q).filter(visP).map(p => { const t = answerText(q, p); return t ? (p.label && partsOf(q).length > 1 ? `${p.label} : ${t}` : t) : null; }).filter(Boolean).join("\n");
}

function viewRecap() {
  const route = ROUTES[get(49, "v")];
  app.innerHTML = `<div class="fade">
    <div class="eyebrow"><em>Dernière étape</em><span>·</span><span>Récapitulatif</span></div>
    <h1>Relis, ajuste, <i>envoie</i>.</h1>
    <p class="lede">Voici toutes tes réponses. Tu peux modifier chaque section avant l'envoi. Une fois envoyées, elles arrivent directement à l'équipe EVO.</p>
    ${route ? `<div class="route" style="margin-top:24px">Parcours prévu : <b>${esc(route)}</b></div>` : ""}
    ${SECTIONS.map((s, si) => `<section class="rc-sec">
      <div class="rc-head"><h2><span>${String(si + 1).padStart(2, "0")}</span>${esc(s.t)}</h2><button class="btn-text" data-act="edit" data-s="${si}">Modifier</button></div>
      ${s.qs.filter(visQ).map(q => { const a = qAnswer(q); return `<div class="rc-row"><div class="rc-q">${q.num}. ${esc(q.l)}</div><div class="rc-a${a ? "" : " empty"}">${a ? esc(a) : "Pas de réponse"}</div></div>`; }).join("")}
    </section>`).join("")}
  </div>`;
  bar.hidden = false;
  const missing = PREVIEW ? [] : SECTIONS.map((s, i) => secOk(i) ? null : i + 1).filter(Boolean);
  barIn.innerHTML = `<button class="btn btn-ghost" data-act="back-last"><span class="arrow">←</span> Retour</button>
    <div class="bar-msg" id="bar-msg" role="status">${missing.length ? `Il manque des réponses en section ${missing.join(", ")}.` : ""}</div>
    <button class="btn btn-gold" data-act="send"${missing.length ? " disabled style='opacity:.45;cursor:not-allowed'" : ""}>Envoyer <span class="arrow">→</span></button>`;
  save();
}

// Chiffres clés repris tels quels des réponses (jamais par l'IA)
function keyFigures() {
  const t = (n, k) => { const q = QMAP[n], p = partsOf(q).find(x => x.k === k); return answerText(q, p) || "—"; };
  const tot = get(16, "total"), now = get(16, "now");
  return [
    ["CA mensuel moyen", t(14, "v")], ["Meilleur mois", t(15, "amt")],
    ["Clients total / actuels", blank(tot) && blank(now) ? "—" : `${blank(tot) ? "—" : nb(tot)} / ${blank(now) ? "—" : nb(now)}`],
    ["Prix de l'offre", t(23, "prix")], ["Leads par semaine", t(50, "v")], ["Taux de closing", t(70, "v")],
    ["Budget ads envisagé", t(64, "v")], ["Objectif CA à 12 mois", t(80, "m12")],
  ];
}
function readable() {
  return SECTIONS.flatMap((s, si) => s.qs.filter(visQ).map(q => ({ n: q.n, numero: q.num, section: si + 1, sectionTitre: s.t, question: q.l, reponse: qAnswer(q) })));
}

function viewDone() {
  bar.hidden = true;
  const prenom = get(1, "prenom");
  app.innerHTML = `<div class="fade">
    <div class="eyebrow"><em>Envoyé</em><span>·</span><span>${new Date(S.sentAt || Date.now()).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span></div>
    <h1>Merci${prenom ? " " + esc(prenom) : ""}, <i>c'est parti</i>.</h1>
    <p class="lede">Tes réponses sont bien arrivées chez l'équipe EVO. On les étudie avant ton premier call pour arriver avec un plan concret, adapté à ta situation.</p>
    ${ROUTES[get(49, "v")] ? `<div class="route" style="margin-top:24px">Ton parcours démarre par <b>${esc(ROUTES[get(49, "v")])}</b>.</div>` : ""}
    ${accountHtml()}
  </div>`;
}

// Accès à l'espace client créés à l'envoi (affichés une seule fois, aussi envoyés par email)
function accountHtml() {
  const acc = S.account;
  if (acc && acc.password) return `<section class="team" style="margin-top:36px" aria-labelledby="acc-h">
      <div class="eyebrow"><em>Ton espace EVO</em><span>·</span><span>est prêt</span></div>
      <h2 id="acc-h">Tes accès</h2>
      <p class="lede">C'est là que tu suis ta progression et que tu déposes tes livrables. Note ces accès : tu les reçois aussi par email.</p>
      <div class="kpis" style="grid-template-columns:1fr">
        <div class="kpi"><small>Identifiant</small><b>${esc(acc.email)}</b></div>
        <div class="kpi"><small>Mot de passe</small><b style="font-family:ui-monospace,Menlo,monospace;letter-spacing:.02em">${esc(acc.password)}</b></div>
      </div>
      <div class="cta-row" style="margin-top:4px"><a class="btn btn-gold" href="/espace">Entrer dans mon espace <span class="arrow">→</span></a></div>
    </section>`;
  if (acc && acc.existing) return `<div class="promise" style="margin-top:36px"><p>Tu as déjà un espace EVO avec l'adresse ${esc(acc.email)}.</p></div>
    <div class="cta-row"><a class="btn btn-gold" href="/espace/connexion">Me connecter à mon espace <span class="arrow">→</span></a></div>`;
  if (opts.initial?.submitted) return `<div class="cta-row" style="margin-top:36px"><a class="btn btn-gold" href="/espace">Accéder à mon espace <span class="arrow">→</span></a></div>`;
  return `<div class="promise" style="margin-top:36px"><p>Tu peux fermer cette page.</p></div>`;
}

/* ======================= EVENTS ======================= */
function touchedChange(n, rerender) {
  if (rerender) rerenderQ(n);
  if (n === 59) { rerenderQ(60); rerenderQ(65); }
  if (shown.has(n)) paintErrors(QMAP[n]);
  save(); paintProgress();
  const m = document.getElementById("bar-msg"); if (m && S.screen === "section") m.textContent = "";
}

app.addEventListener("input", e => {
  const el = e.target, n = +el.dataset.n, k = el.dataset.k;
  if (!k || el.type === "file") return;
  const kind = el.dataset.kind;
  if (kind === "num") {
    const d = el.value.replace(/\D/g, "").slice(0, 9);
    set(n, k, d === "" ? "" : +d); el.value = d === "" ? "" : nb(+d);
  } else if (kind === "range") {
    const q = QMAP[n], p = partsOf(q).find(x => x.k === k), v = +el.value, pct = ((v - p.min) / (p.max - p.min)) * 100;
    set(n, k, v);
    const box = el.parentElement; box.classList.remove("idle"); box.style.setProperty("--p", pct + "%"); el.style.setProperty("--p", pct + "%");
    document.getElementById(el.id + "-o").textContent = sliderText(p, v); el.setAttribute("aria-valuetext", sliderText(p, v));
  } else if (kind === "r2") {
    const q = QMAP[n], p = q.p.find(x => x.k === k), cur = [...(get(n, k) || p.def)], i = +el.dataset.i;
    cur[i] = +el.value;
    if (cur[0] > cur[1]) { cur[i] = cur[1 - i]; el.value = cur[i]; }
    set(n, k, cur);
    const id = fid(n, k), w = p.max - p.min;
    document.getElementById(id + "-o").textContent = `${cur[0]} – ${cur[1]} ans`;
    const t = document.getElementById(id + "-t"); t.style.left = (cur[0] - p.min) / w * 100 + "%"; t.style.right = 100 - (cur[1] - p.min) / w * 100 + "%";
  } else if (kind === "obj") {
    set(n, k, { ...(get(n, k) || {}), [el.dataset.f]: el.value });
  } else if (kind === "arr") {
    const p = QMAP[n].p.find(x => x.k === k), L = [...(get(n, k) || Array(p.min).fill(""))];
    L[+el.dataset.i] = el.value; set(n, k, L);
  } else if (el.type !== "checkbox" && el.tagName !== "SELECT") {
    set(n, k, el.value);
    const c = document.getElementById(el.id + "-c");
    if (c) { const p = partsOf(QMAP[n]).find(x => x.k === k); c.textContent = `${nb(el.value.length)} / ${nb(p.max)}`; c.classList.toggle("over", el.value.length > p.max); }
  } else return;
  touchedChange(n, false);
});

app.addEventListener("change", e => {
  const el = e.target, n = +el.dataset.n, k = el.dataset.k;
  if (!k) return;
  if (el.type === "file") { addFiles(n, k, el.files); return; }
  if (el.type === "checkbox") { set(n, k, el.checked); touchedChange(n, true); return; }
  if (el.tagName === "SELECT") { set(n, k, el.value); touchedChange(n, !!el.dataset.re); return; }
});

app.addEventListener("pointerdown", e => {
  const el = e.target;
  if (el.dataset && el.dataset.kind === "range" && get(+el.dataset.n, el.dataset.k) == null) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
});
app.addEventListener("keydown", e => {
  const el = e.target;
  if (el.dataset && el.dataset.kind === "range" && get(+el.dataset.n, el.dataset.k) == null && /Arrow|Home|End|Page/.test(e.key)) {
    requestAnimationFrame(() => el.dispatchEvent(new Event("input", { bubbles: true })));
  }
});

function addFiles(n, k, list) {
  const p = partsOf(QMAP[n]).find(x => x.k === k), cur = [...(get(n, k) || [])], tooBig = [];
  [...list].forEach(f => { if (f.size > p.maxMB * 1048576) tooBig.push(f.name); else cur.push({ name: f.name, size: f.size, type: f.type }); });
  set(n, k, cur); touchedChange(n, true);
  if (tooBig.length) { const er = document.getElementById(`e-${n}-${k}`); if (er) er.textContent = `Fichier trop lourd (${p.maxMB} Mo max) : ${tooBig.join(", ")}.`; }
}
app.addEventListener("dragover", e => { const d = e.target.closest("[data-drop]"); if (d) { e.preventDefault(); d.classList.add("over"); } });
app.addEventListener("dragleave", e => { const d = e.target.closest("[data-drop]"); if (d) d.classList.remove("over"); });
app.addEventListener("drop", e => { const d = e.target.closest("[data-drop]"); if (!d) return; e.preventDefault(); addFiles(+d.dataset.n, d.dataset.k, e.dataTransfer.files); });

const onClick = async e => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const act = b.dataset.act, n = +b.dataset.n, k = b.dataset.k;
  const q = QMAP[n], p = q && partsOf(q).find(x => x.k === k);
  switch (act) {
    case "pick": {
      let v = b.dataset.v;
      if (p.t === "scale") v = +v;
      if (p.t === "multi") {
        let cur = [...(get(n, k) || [])];
        if (cur.includes(v)) cur = cur.filter(x => x !== v);
        else if ((p.excl || []).includes(v)) cur = [v];
        else cur = [...cur.filter(x => !(p.excl || []).includes(x)), v];
        set(n, k, cur);
      } else set(n, k, get(n, k) === v && p.t !== "scale" && !q.req ? undefined : v);
      touchedChange(n, true);
      const again = document.querySelector(`[data-act="pick"][data-n="${n}"][data-k="${k}"][data-v="${CSS.escape(b.dataset.v)}"]`);
      if (again) again.focus({ preventScroll: true });
      break;
    }
    case "grid": {
      const g = { ...(get(n, k) || {}) }, r = b.dataset.r, c = b.dataset.c;
      if (p.multi) { const a = g[r] || []; g[r] = a.includes(c) ? a.filter(x => x !== c) : [...a, c]; }
      else g[r] = g[r] === c ? undefined : c;
      set(n, k, g); touchedChange(n, true);
      break;
    }
    case "add": { const L = [...(get(n, k) || Array(p.min).fill(""))]; L.push(""); set(n, k, L); touchedChange(n, true);
      const ins = document.querySelectorAll(`.q[data-q="${n}"] [data-kind="arr"]`); ins[ins.length - 1]?.focus(); break; }
    case "rm": { const L = [...(get(n, k) || [])]; L.splice(+b.dataset.i, 1); set(n, k, L); touchedChange(n, true); break; }
    case "rmfile": { const L = [...(get(n, k) || [])]; L.splice(+b.dataset.i, 1); set(n, k, L); touchedChange(n, true); break; }
    case "start":
      if (!respId) {
        b.disabled = true;
        try { respId = await opts.onStart(); }
        catch (err) { b.disabled = false; b.insertAdjacentHTML("afterend", `<span class="sum-status err" role="alert">Impossible de démarrer. Vérifie ta connexion et réessaie.</span>`); return; }
      }
      S.screen = "section"; render(); break;
    case "home": S.screen = "welcome"; render(); break;
    case "prev": S.sec--; render(); break;
    case "next": {
      const s = SECTIONS[S.sec], bad = s.qs.filter(q => !qOk(q));
      if (bad.length && !PREVIEW) {
        bad.forEach(q => { shown.add(q.n); paintErrors(q); });
        const first = document.querySelector(`.q[data-q="${bad[0].n}"]`);
        first?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        document.getElementById("bar-msg").textContent = bad.length === 1 ? "1 question à compléter." : `${bad.length} questions à compléter.`;
        return;
      }
      if (S.fromRecap || S.sec === SECTIONS.length - 1) { S.fromRecap = false; S.screen = "recap"; }
      else S.sec++;
      render(); break;
    }
    case "edit": S.sec = +b.dataset.s; S.fromRecap = true; S.screen = "section"; render(); break;
    case "back-last": S.sec = SECTIONS.length - 1; S.screen = "section"; render(); break;
    case "send": {
      if (!PREVIEW && !SECTIONS.every((_, i) => secOk(i))) return;
      b.disabled = true; b.innerHTML = "Envoi…";
      clearTimeout(saveT);
      try {
        const res = await opts.onSubmit(respId, { answers: S.a, readable: readable(), figures: keyFigures(), route: ROUTES[get(49, "v")] || null });
        S.account = res && res.account ? res.account : null;
        S.sentAt = new Date().toISOString(); S.screen = "done"; dirty = false; render();
      } catch (err) {
        b.disabled = false; b.innerHTML = 'Envoyer <span class="arrow">→</span>';
        document.getElementById("bar-msg").textContent = "L'envoi n'a pas abouti. Vérifie ta connexion et réessaie.";
      }
      break;
    }
  }
};
root.addEventListener("click", onClick);

if (PREVIEW) document.querySelector(".brand span").textContent = "Onboarding · Mode aperçu";
if (opts.initial?.submitted) { S.screen = "done"; }
render();

return () => {
  clearTimeout(saveT);
  root.removeEventListener("click", onClick);
  window.removeEventListener("pagehide", onLeave);
  document.removeEventListener("visibilitychange", onLeave);
};

}
