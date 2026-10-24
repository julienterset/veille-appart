/* Génère regles.md à partir des réglages. Utilisé par reglages.html (navigateur) et par Node. */
(function (root) {
  const ZONES = [
    { id: "antibes", label: "Antibes" },
    { id: "juan", label: "Juan-les-Pins" },
    { id: "golfe", label: "Golfe-Juan" },
    { id: "cannes", label: "Cannes (hors La Bocca)" },
    { id: "bocca", label: "Cannes La Bocca" },
    { id: "vallauris", label: "Vallauris (hors Golfe-Juan)" },
    { id: "cannet", label: "Le Cannet" },
    { id: "mougins", label: "Mougins" },
    { id: "biot", label: "Biot" },
    { id: "vloubet", label: "Villeneuve-Loubet" },
    { id: "mandelieu", label: "Mandelieu-la-Napoule" }
  ];

  const DEFAUTS = {
    zones: ["antibes", "juan", "golfe", "cannes"],
    prixMin: 400000, prixMax: 500000,
    pieces: [3, 4],
    surfaceMin: 70, surfaceMax: 90,
    exterieur: true, ascenseur: true,
    parking: true, parkingOption: true,
    lotsMin: 10, lotsMax: 50, lotsInconnusOk: true,
    neuf: "les-deux", exclureBRS: true, exclureViager: true,
    reverifHeures: 12,
    notes: ""
  };

  const nb = n => Number(n).toLocaleString("fr-FR").replace(/ | /g, " ");
  const euros = n => nb(n) + " €";

  function listeFr(arr, mot) {
    if (arr.length <= 1) return arr.join("");
    return arr.slice(0, -1).join(", ") + " " + (mot || "ou") + " " + arr[arr.length - 1];
  }

  function piecesTexte(p) {
    const s = [...p].sort((a, b) => a - b);
    const lab = s.map(n => n >= 5 ? "5 pièces et plus" : String(n));
    const t = s.map(n => n >= 5 ? "T5+" : "T" + n);
    let court = s.length === 1 ? (s[0] >= 5 ? "5 pièces et plus" : s[0] + " pièces") : listeFr(lab) + (s[s.length - 1] >= 5 ? "" : " pièces");
    return { court, long: court + " (" + listeFr(t) + ")" };
  }

  function fourchette(min, max, unite) {
    const f = unite === "€" ? euros : n => nb(n) + " " + unite;
    if (min && max) return { court: nb(min) + " à " + f(max), long: "Entre " + f(min) + " et " + f(max) + ", bornes incluses." };
    if (max) return { court: "Jusqu'à " + f(max), long: "Au maximum " + f(max) + "." };
    if (min) return { court: "À partir de " + f(min), long: "Au minimum " + f(min) + "." };
    return { court: "", long: "Pas de limite." };
  }

  function generer(r) {
    r = Object.assign({}, DEFAUTS, r || {});
    const z = new Set(r.zones);
    const zonesOk = ZONES.filter(x => z.has(x.id)).map(x => x.label);
    const prix = fourchette(r.prixMin, r.prixMax, "€");
    const surf = fourchette(r.surfaceMin, r.surfaceMax, "m²");
    const pcs = piecesTexte(r.pieces.length ? r.pieces : [3]);

    const resume = [zonesOk.join(" · ")];
    if (prix.court) resume.push(prix.court);
    resume.push(pcs.court);
    if (surf.court) resume.push(surf.court);
    if (r.exterieur) resume.push("Terrasse ou balcon");
    if (r.ascenseur) resume.push("Ascenseur");
    if (r.parking) resume.push("Parking");
    resume.push("Résidence de " + r.lotsMin + " à " + r.lotsMax + " lots");
    resume.push(r.neuf === "ancien" ? "Ancien uniquement" : r.neuf === "neuf" ? "Neuf uniquement" : "Ancien ou neuf");

    const zone = ["- Acceptées : " + zonesOk.join(", ") + "."];
    if (z.has("golfe") && !z.has("vallauris")) {
      zone.push("- Golfe-Juan fait partie de la commune de Vallauris (06220). Une annonce « Vallauris » n'est acceptée que si elle situe explicitement le bien à Golfe-Juan (port, plages, front de mer, centre de Golfe-Juan).");
      zone.push("- Exclues : le reste de Vallauris (centre-ville de Vallauris, Pertuades, Fumades, Hauts de Vallauris…) et toute annonce Vallauris dont la localisation est floue.");
    } else if (z.has("vallauris") && !z.has("golfe")) {
      zone.push("- Vallauris est acceptée, sauf le secteur de Golfe-Juan (port, plages, front de mer).");
    } else if (z.has("vallauris") && z.has("golfe")) {
      zone.push("- Toute la commune de Vallauris (06220) est acceptée, Golfe-Juan compris.");
    }
    if (z.has("cannes") && !z.has("bocca")) zone.push("- Exclue : Cannes La Bocca (06150, Bocca Nord, Bocca Sud, Ranguin, Abadie, Gourguettes…).");
    if (z.has("bocca") && !z.has("cannes")) zone.push("- À Cannes, seul le secteur de La Bocca (06150) est accepté ; le reste de Cannes est exclu.");
    if (z.has("antibes") && !z.has("juan")) zone.push("- Exclu : le secteur de Juan-les-Pins (06160).");
    if (z.has("juan") && !z.has("antibes")) zone.push("- À Antibes, seul le secteur de Juan-les-Pins (06160) est accepté.");
    zone.push("- Toute autre commune est exclue.");

    const equip = [];
    equip.push(r.exterieur ? "- Terrasse ou balcon." : "- Terrasse ou balcon souhaité mais pas obligatoire ; le signaler dans les atouts.");
    equip.push(r.ascenseur ? "- Ascenseur, explicitement mentionné dans l'annonce." : "- Ascenseur souhaité mais pas obligatoire ; le signaler dans les atouts s'il y en a un.");
    if (r.parking) {
      equip.push("- Parking : une place, un box ou un garage privatif explicitement inclus.");
      if (r.parkingOption) equip.push("  - Un parking ou garage « en option » est accepté seulement si prix + option ≤ " + euros(r.prixMax || 1e9) + ". Le signaler dans les atouts (ex. « Garage en option +30 000 € »).");
      else equip.push("  - Un parking ou garage seulement « en option » ne suffit pas.");
      equip.push("  - Un « parking collectif » ou un « stationnement aisé » sans place attribuée ne compte pas.");
    } else {
      equip.push("- Parking souhaité mais pas obligatoire ; le signaler dans les atouts s'il y en a un.");
    }

    const neuf = [];
    if (r.neuf === "ancien") neuf.push("- Ancien uniquement : exclure les programmes neufs, la VEFA et les annonces « neuf » ou « livraison prévue ».");
    else if (r.neuf === "neuf") neuf.push("- Neuf uniquement (VEFA, programme neuf, construction récente jamais habitée). Indiquer « Neuf » et la date de livraison dans les atouts.");
    else neuf.push("- Les deux sont acceptés. Pour le neuf (VEFA, programme neuf), indiquer « Neuf » et la date de livraison dans les atouts.");
    const excl = [];
    if (r.exclureBRS) excl.push("bail réel solidaire (BRS)");
    if (r.exclureViager) excl.push("ventes en viager");
    if (excl.length) neuf.push("- Exclus : " + listeFr(excl, "et") + ".");

    const oblig = ["zone", "prix", "surface"];
    if (r.ascenseur) oblig.push("ascenseur");
    if (r.parking) oblig.push("parking");

    const reglages = JSON.stringify(Object.assign({}, r, { zones: ZONES.map(x => x.id).filter(id => z.has(id)) }));

    const md = [
"# Règles de la veille appartement",
"",
"Ce fichier est la **seule source** des critères de recherche. La tâche planifiée le relit à chaque passage et applique ce qui y est écrit.",
"Pour changer un critère, utilisez la page Réglages : https://julienterset.github.io/veille-appart/reglages.html",
"Vous pouvez aussi modifier ce fichier à la main ; la page Réglages vous préviendra alors avant d'écraser ces modifications.",
"",
"## Résumé affiché sur la page",
"",
"Une ligne par critère, reprise telle quelle en haut de la page :",
"",
...resume.map(l => "- " + l),
"",
"## Critères obligatoires",
"",
"### Zone",
...zone,
"",
"### Prix",
"- " + prix.long,
"",
"### Type et surface",
"- " + pcs.long + ".",
"- Surface : " + surf.long.charAt(0).toLowerCase() + surf.long.slice(1),
"",
"### Équipements",
...equip,
"",
"### Statut",
"- Exclure les biens vendus, sous offre, sous compromis ou réservés.",
"",
"## Ancien ou neuf",
...neuf,
"",
"## Taille de la résidence : " + r.lotsMin + " à " + r.lotsMax + " lots",
"- Nombre de lots indiqué : garder uniquement de " + r.lotsMin + " à " + r.lotsMax + " lots, et mettre « N lots » dans les atouts.",
"- Écarter les grandes résidences même sans chiffre : « grande résidence », « grand ensemble », « domaine », résidence avec gardien + piscine + tennis, programme neuf de plus de " + r.lotsMax + " logements.",
"- Écarter les très petites copropriétés : moins de " + r.lotsMin + " lots, maison divisée, immeuble de 1 ou 2 étages avec seulement quelques appartements.",
r.lotsInconnusOk
  ? "- Nombre de lots non indiqué et aucun indice de grande ou de minuscule résidence : garder l'annonce avec l'atout « Nombre de lots à vérifier »."
  : "- Nombre de lots non indiqué : ne pas ajouter l'annonce.",
"",
"## Qualité des annonces",
"- **Lien direct obligatoire** : l'URL doit mener à la fiche du bien, jamais à une page de résultats. La fiche doit avoir été ouverte et vérifiée (localisation, prix, surface, extérieur, ascenseur, parking, lots, statut). Sinon, ne pas ajouter l'annonce.",
"- **Photo** : URL de la photo principale (og:image de la fiche, première image de la galerie, ou image de l'e-mail d'alerte), recopiée telle quelle. Sans photo trouvée, l'annonce est quand même ajoutée.",
"- **Doublons** : même commune, surface à ±1 m² et prix à ±3 % = même bien.",
"- **En cas de doute** sur un critère obligatoire (" + oblig.join(", ") + ") : ne pas ajouter.",
"",
"## Biens vendus et changements de prix",
"- Revérifier chaque annonce listée au moins toutes les " + r.reverifHeures + " heures.",
"- Retirer l'annonce si la fiche indique vendu, sous offre, sous compromis, réservé, annonce retirée, supprimée, expirée ou plus disponible, si la page renvoie 404 ou 410, ou si elle redirige vers une page qui n'est plus la fiche. Un e-mail d'alerte qui l'annonce compte aussi.",
"- Si la fiche ne peut pas être lue (erreur réseau, page bloquée, erreur serveur) : ne rien retirer, réessayer au passage suivant.",
"- Prix modifié : mettre à jour le prix et ajouter « Prix baissé » ou « Prix augmenté » dans les atouts. Si le nouveau prix sort de la fourchette, retirer l'annonce.",
"- Un bien retiré ne revient pas, sauf si sa fiche est de nouveau en vente.",
"",
"## Sources",
"- Alertes e-mail Leboncoin et SeLoger dans Gmail (ainsi que PAP, Bien'ici, Logic-Immo s'il y en a), quel que soit le dossier.",
"- Recherche web : portails, agences et promoteurs, en partant des critères ci-dessus.",
"",
"## Notifications",
"- Notifier en cas de nouvelle annonce, d'annonce retirée ou de baisse de prix. Sinon, rien de particulier.",
...(r.notes && r.notes.trim() ? ["", "## Règles complémentaires", "", r.notes.trim()] : []),
"",
"<!-- REGLAGES (lu par la page Réglages, ne pas modifier)",
reglages,
"-->",
""
    ].join("\n");
    return md;
  }

  function lireReglages(md) {
    const m = /<!-- REGLAGES[^\n]*\n([\s\S]*?)\n-->/.exec(md || "");
    if (!m) return null;
    try { return Object.assign({}, DEFAUTS, JSON.parse(m[1])); } catch (e) { return null; }
  }

  const api = { ZONES, DEFAUTS, generer, lireReglages };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Regles = api;
})(typeof window !== "undefined" ? window : globalThis);
