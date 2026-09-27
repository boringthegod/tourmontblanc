// Données du tour — éditables ici.
// Chiffres d'étapes = estimations standard TMB (le site source ne publie pas tout).

export type Waypoint = {
  name: string;
  lat: number;
  lng: number;
  alt: number; // m
  km: number; // km cumulé depuis le départ de l'étape
};

export type Lodging = {
  id: string;
  name: string;
  place: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  bookingUrl?: string;
  status: "confirme" | "a_reserver";
  notes: string[];
  lat?: number;
  lng?: number;
};

export type Day = {
  n: number;
  date: string; // ISO
  kind: "travel" | "hike";
  title: string;
  start?: string;
  end?: string;
  distanceKm?: number;
  dplus?: number;
  dminus?: number;
  duration?: string;
  description: string;
  waypoints: Waypoint[];
  lodgingId?: string;
  // Nuit éclatée sur plusieurs logements (prioritaire sur lodgingId si présent).
  nights?: { lodgingId: string; who: string }[];
  transportNote?: string;
};

export const USERS = [
  "Alice",
  "Émile",
  "Bruno",
  "Chloé",
  "David",
  "Farid",
] as const;

export const LODGINGS: Lodging[] = [
  {
    id: "base",
    name: "Location à Chamonix",
    place: "Chamonix",
    address: "Chamonix-Mont-Blanc, 74400",
    status: "confirme",
    lat: 45.9237,
    lng: 6.8694,
    notes: [
      "Nuits du 17/09 (avant le départ) et du 24/09 (retour de rando).",
    ],
  },
  {
    id: "pres",
    name: "Refuge des Prés",
    place: "Les Contamines-Montjoie",
    address: "La Rollaz, 74170 Les Contamines-Montjoie",
    website: "https://www.lerefugedespres.com",
    status: "confirme",
    lat: 45.76315,
    lng: 6.70155,
    notes: [
      "Ce n'est PAS au village : le refuge est à 1 940 m dans la réserve naturelle, 2h30 et +730 m au-dessus de Notre-Dame de la Gorge.",
    ],
  },
  {
    id: "mottets",
    name: "Refuge des Mottets",
    place: "Vallée des Glaciers, Bourg-Saint-Maurice",
    address: "Vallée des Glaciers, 73700 Bourg-Saint-Maurice",
    website: "https://www.lesmottets.com",
    status: "confirme",
    lat: 45.73714,
    lng: 6.77904,
    notes: [
      "Ancienne ferme d'alpage, ambiance montagne.",
      "Alice, Émile et Farid dorment ici ; les trois autres aux Chambres du Soleil (Les Chapieux).",
    ],
  },
  {
    id: "soleil",
    name: "Gîte Les Chambres du Soleil",
    place: "Les Chapieux (vallée des Glaciers)",
    address: "Les Chapieux, 73700 Bourg-Saint-Maurice",
    status: "confirme",
    lat: 45.69691,
    lng: 6.73399,
    notes: [
      "David, Chloé et Bruno dorment ici.",
      "Aux Chapieux, à ~6 km avant les Mottets sur le tracé : le lendemain, remonter la vallée des Glaciers pour rejoindre les autres.",
    ],
  },
  {
    id: "montebianco",
    name: "Rifugio Monte Bianco",
    place: "Courmayeur (Val Vény)",
    address: "Località La Zerotta, 11013 Courmayeur (AO), Italie",
    status: "confirme",
    lat: 45.80058,
    lng: 6.93089,
    notes: [
      "Prévenir si on arrive après 16h.",
      "Ce n'est PAS à Courmayeur : le refuge est à 1 680 m dans le val Vény, 1 km sous le col Chécrouit côté Zerotta.",
    ],
  },
  {
    id: "elena",
    name: "Rifugio Elena",
    place: "Val Ferret (Italie)",
    address: "Località Pré de Bar, 11013 Courmayeur (AO), Italie",
    phone: "+39 0165 844688",
    email: "prenotazioni@rifugioelena.it",
    website: "https://www.rifugioelena.it/fr",
    status: "confirme",
    lat: 45.88472,
    lng: 7.06564,
    notes: [
      "RÉSERVATION CONFIRMÉE pour les 6 — demi-pension, 85 €/pers. Nuit du 21 au 22/09.",
      "Check-in 14h30 – 19h00 · check-out avant 9h30 · pièce d'identité demandée.",
      "Drap de sac obligatoire (5 € sur place sinon). Couvertures fournies, douche incluse.",
      "Dîner + petit-déj inclus (demi-pension). Picnic du départ à demander au check-in.",
      "Allergies / intolérances : à signaler au check-in.",
      "CB acceptée (POS) mais connexion aléatoire → prévoir du cash.",
      "No-show : prévenir avant 16h le jour d'arrivée, sinon résa annulée et acompte perdu.",
      "Urgences : +39 0165 844688.",
    ],
  },
  {
    id: "bonabri",
    name: "Gîte Bon Abri",
    place: "Champex-Lac (Suisse)",
    address: "Route de Champex 57, 1938 Champex-Lac, Suisse",
    website: "http://www.gite-bon-abri.com",
    status: "confirme",
    lat: 46.03551,
    lng: 7.0991,
    notes: [
      "Francs suisses ou euros — vérifier les moyens de paiement.",
      "À 1,5 km à l'ouest du lac, sur la route de Champex-d'en-Bas (direction Plan de l'Au).",
    ],
  },
  {
    id: "boerne",
    name: "Auberge la Boerne",
    place: "Tré-le-Champ (Argentière)",
    address: "288 Chemin des Aiguilles, Tré-le-Champ, 74400 Chamonix",
    website: "https://la-boerne.fr",
    status: "confirme",
    lat: 45.99495,
    lng: 6.92768,
    notes: [],
  },
];

export const DAYS: Day[] = [
  {
    n: 0,
    date: "2026-09-17",
    kind: "travel",
    title: "Arrivée à Chamonix",
    description:
      "Vol → Genève, puis bus Genève → Chamonix. Installation au logement, derniers achats (gaz, lyophilisés, cash).",
    waypoints: [],
    lodgingId: "base",
    transportNote:
      "Avion → Genève (GVA), puis bus Genève→Chamonix (~1h30).",
  },
  {
    n: 1,
    date: "2026-09-18",
    kind: "hike",
    title: "Les Houches → Refuge des Prés",
    start: "Les Houches",
    end: "Refuge des Prés",
    distanceKm: 24,
    dplus: 1800,
    dminus: 840,
    duration: "9h",
    description:
      "Pas une mise en jambes : col de Voza (1 653 m), descente par Bionnassay sur Les Contamines, puis remontée du val Montjoie par Notre-Dame de la Gorge et le chemin romain jusqu'au Refuge des Prés (1 940 m), 2h30 au-dessus du village.",
    waypoints: [
      { name: "Les Houches", lat: 45.8908, lng: 6.7986, alt: 1008, km: 0 },
      { name: "Col de Voza", lat: 45.87686, lng: 6.7614, alt: 1653, km: 4.2 },
      { name: "Bionnassay", lat: 45.86552, lng: 6.7578, alt: 1314, km: 6.1 },
      { name: "Les Contamines", lat: 45.8225, lng: 6.7267, alt: 1167, km: 14.4 },
      { name: "N-D de la Gorge", lat: 45.8033, lng: 6.7271, alt: 1210, km: 17.7 },
      { name: "Nant Borrant", lat: 45.77844, lng: 6.71425, alt: 1459, km: 21 },
      { name: "Refuge des Prés", lat: 45.76315, lng: 6.70155, alt: 1940, km: 24 },
    ],
    lodgingId: "pres",
    transportNote:
      "Le matin : bus Ligne 1 de Chamonix à l'arrêt Bellevue (Les Houches).",
  },
  {
    n: 2,
    date: "2026-09-19",
    kind: "hike",
    title: "Refuge des Prés → Refuge des Mottets",
    start: "Refuge des Prés",
    end: "Refuge des Mottets",
    distanceKm: 18,
    dplus: 950,
    dminus: 1010,
    duration: "6h30",
    description:
      "Départ déjà en altitude : traversée vers le col du Bonhomme (2 329 m) puis col de la Croix du Bonhomme (2 479 m). Descente sur Les Chapieux et remontée de la vallée des Glaciers jusqu'aux Mottets. Variante par le col des Fours (2 665 m) pour couper, selon conditions.",
    waypoints: [
      { name: "Refuge des Prés", lat: 45.76315, lng: 6.70155, alt: 1940, km: 0 },
      { name: "Col du Bonhomme", lat: 45.73501, lng: 6.7066, alt: 2329, km: 4.7 },
      { name: "Col de la Croix du Bonhomme", lat: 45.72214, lng: 6.71874, alt: 2479, km: 6.8 },
      { name: "Les Chapieux", lat: 45.69668, lng: 6.73358, alt: 1554, km: 11.7 },
      { name: "Ville des Glaciers", lat: 45.72336, lng: 6.76492, alt: 1789, km: 15.7 },
      { name: "Refuge des Mottets", lat: 45.73714, lng: 6.77904, alt: 1870, km: 18 },
    ],
    lodgingId: "mottets",
    nights: [
      { lodgingId: "mottets", who: "Alice, Émile, Farid" },
      { lodgingId: "soleil", who: "David, Chloé, Bruno" },
    ],
  },
  {
    n: 3,
    date: "2026-09-20",
    kind: "hike",
    title: "Les Mottets → Rifugio Monte Bianco",
    start: "Refuge des Mottets",
    end: "Rifugio Monte Bianco",
    distanceKm: 19.5,
    dplus: 1180,
    dminus: 1360,
    duration: "7h30",
    description:
      "Montée au col de la Seigne (2 516 m) et passage en Italie. Descente du val Vény : refuge Elisabetta, lac Combal, remontée sur l'arête du Mont-Favre puis col Chécrouit, et courte descente versant val Vény jusqu'au Rifugio Monte Bianco (1 680 m). Courmayeur, c'est pour demain matin.",
    waypoints: [
      { name: "Refuge des Mottets", lat: 45.73714, lng: 6.77904, alt: 1870, km: 0 },
      { name: "Col de la Seigne — Italie", lat: 45.7511, lng: 6.808, alt: 2516, km: 4.5 },
      { name: "Rif. Elisabetta", lat: 45.767, lng: 6.83744, alt: 2195, km: 7.8 },
      { name: "Lac Combal", lat: 45.77248, lng: 6.86126, alt: 1960, km: 10 },
      { name: "Arête du Mont-Favre", lat: 45.77208, lng: 6.88971, alt: 2435, km: 13.4 },
      { name: "Col Chécrouit", lat: 45.79085, lng: 6.93126, alt: 1956, km: 17.9 },
      { name: "Rifugio Monte Bianco", lat: 45.80058, lng: 6.93089, alt: 1680, km: 19.4 },
    ],
    lodgingId: "montebianco",
  },
  {
    n: 4,
    date: "2026-09-21",
    kind: "hike",
    title: "Rifugio Monte Bianco → Rifugio Elena",
    start: "Rifugio Monte Bianco",
    end: "Rifugio Elena",
    distanceKm: 28,
    dplus: 1900,
    dminus: 1500,
    duration: "11h",
    description:
      "D'abord descendre du val Vény sur Courmayeur, puis grosse montée au refuge Bertone (1 989 m) et magnifique balcon du val Ferret face aux Grandes Jorasses : refuge Bonatti, descente sur Arnouvaz et remontée finale au refuge Elena (2 062 m).",
    waypoints: [
      { name: "Rifugio Monte Bianco", lat: 45.80058, lng: 6.93089, alt: 1680, km: 0 },
      { name: "Courmayeur", lat: 45.7967, lng: 6.9691, alt: 1226, km: 6.5 },
      { name: "Rif. Bertone", lat: 45.80924, lng: 6.97886, alt: 1989, km: 10.7 },
      { name: "Rif. Bonatti", lat: 45.84691, lng: 7.03364, alt: 2025, km: 20.5 },
      { name: "Arnouvaz", lat: 45.87155, lng: 7.05375, alt: 1773, km: 25.8 },
      { name: "Rifugio Elena", lat: 45.88472, lng: 7.06564, alt: 2062, km: 28.2 },
    ],
    lodgingId: "elena",
    transportNote:
      "Le matin, la navette du val Vény (La Zerotta → Courmayeur) évite 6,5 km et 1h30 de descente — vérifier qu'elle roule encore fin septembre.",
  },
  {
    n: 5,
    date: "2026-09-22",
    kind: "hike",
    title: "Rifugio Elena → Champex",
    start: "Rifugio Elena",
    end: "Gîte Bon Abri (Champex)",
    distanceKm: 26,
    dplus: 1020,
    dminus: 1630,
    duration: "9h",
    description:
      "Montée directe au Grand col Ferret (2 537 m) et passage en Suisse. Longue descente du val Ferret suisse : La Fouly, Praz de Fort, Issert, puis remontée finale en forêt vers Champex, tour du lac et encore 1,5 km jusqu'au gîte Bon Abri.",
    waypoints: [
      { name: "Rifugio Elena", lat: 45.88472, lng: 7.06564, alt: 2062, km: 0 },
      { name: "Grand col Ferret — Suisse", lat: 45.88903, lng: 7.07786, alt: 2537, km: 2.3 },
      { name: "La Fouly", lat: 45.93312, lng: 7.09897, alt: 1610, km: 9.7 },
      { name: "Praz de Fort", lat: 45.98949, lng: 7.12509, alt: 1151, km: 17.9 },
      { name: "Issert", lat: 46.00271, lng: 7.12575, alt: 1055, km: 19.7 },
      { name: "Champex-Lac", lat: 46.03058, lng: 7.11682, alt: 1466, km: 24.2 },
      { name: "Gîte Bon Abri", lat: 46.03551, lng: 7.0991, alt: 1438, km: 26.2 },
    ],
    lodgingId: "bonabri",
  },
  {
    n: 6,
    date: "2026-09-23",
    kind: "hike",
    title: "Champex → Tré-le-Champ",
    start: "Gîte Bon Abri (Champex)",
    end: "Tré-le-Champ (La Boerne)",
    distanceKm: 26.5,
    dplus: 1690,
    dminus: 1740,
    duration: "10h30",
    description:
      "La plus longue journée. Alpage de Bovine (1 987 m) — ou variante fenêtre d'Arpette (2 665 m) pour les costauds —, col de la Forclaz, Trient, puis montée au col de Balme (2 191 m) et retour en France. Descente sur Tré-le-Champ.",
    waypoints: [
      { name: "Gîte Bon Abri", lat: 46.03551, lng: 7.0991, alt: 1438, km: 0 },
      { name: "Plan de l'Au", lat: 46.043, lng: 7.093, alt: 1330, km: 1.1 },
      { name: "Bovine", lat: 46.05547, lng: 7.04959, alt: 1987, km: 7.4 },
      { name: "Col de la Forclaz", lat: 46.05773, lng: 7.00135, alt: 1526, km: 12 },
      { name: "Trient", lat: 46.05595, lng: 6.99537, alt: 1300, km: 13.8 },
      { name: "Col de Balme — France", lat: 46.02637, lng: 6.97029, alt: 2191, km: 19.5 },
      { name: "Auberge la Boerne", lat: 45.99495, lng: 6.92768, alt: 1396, km: 26.5 },
    ],
    lodgingId: "boerne",
  },
  {
    n: 7,
    date: "2026-09-24",
    kind: "hike",
    title: "Tré-le-Champ → Chamonix",
    start: "Tré-le-Champ (La Boerne)",
    end: "Chamonix",
    distanceKm: 14.5,
    dplus: 940,
    dminus: 1290,
    duration: "6h",
    description:
      "Final en beauté sur le balcon sud : échelles de l'Aiguillette d'Argentière, Tête aux Vents (2 132 m), La Flégère — détour possible au lac Blanc — puis descente sur Chamonix (ou téléphérique).",
    waypoints: [
      { name: "Auberge la Boerne", lat: 45.99495, lng: 6.92768, alt: 1396, km: 0 },
      { name: "Aiguillette d'Argentière", lat: 45.98502, lng: 6.91276, alt: 1870, km: 2.6 },
      { name: "Tête aux Vents", lat: 45.98248, lng: 6.9065, alt: 2132, km: 3.5 },
      { name: "La Flégère", lat: 45.96054, lng: 6.88707, alt: 1877, km: 7 },
      { name: "Chamonix", lat: 45.9237, lng: 6.8694, alt: 1035, km: 14 },
    ],
    lodgingId: "base",
  },
  {
    n: 8,
    date: "2026-09-25",
    kind: "travel",
    title: "Retour",
    description:
      "Bus Chamonix → Genève à 11h (arrivée gare routière place Dorcière), après-midi à Genève, puis vols retour le soir.",
    waypoints: [],
    transportNote:
      "Bus 11h Chamonix → Genève (Swisstours, arrivée place Dorcière). Avions retour le soir.",
  },
];

// Liste de base du matos (liste.txt), + drap de sac et cash exigés/conseillés par le Rifugio Elena.
export const GEAR_ITEMS: { label: string; shared: boolean }[] = [
  { label: "Tee-shirt manches longues mérinos (86 % laine)", shared: false },
  { label: "Crampons", shared: false },
  { label: "Repas lyophilisés ou 120 g semoule + cajou + raisins secs + épices", shared: false },
  { label: "Réchaud gaz", shared: true },
  { label: "Popote + couverts", shared: true },
  { label: "Compote, barres, gel cacahuète, Coca", shared: false },
  { label: "Gourdes", shared: false },
  { label: "Pastilles traitement d'eau", shared: true },
  { label: "Gourde Oko", shared: false },
  { label: "Buff + bonnet + chapeau", shared: false },
  { label: "Crème solaire", shared: true },
  { label: "Sac de randonnée", shared: false },
  { label: "Couverture de survie", shared: false },
  { label: "Veste Gore-Tex / doudoune", shared: false },
  { label: "Lunettes de soleil", shared: false },
  { label: "Sac de couchage", shared: false },
  { label: "Drap de sac (obligatoire en refuge — 5 € à Elena sinon)", shared: false },
  { label: "Lampe frontale", shared: false },
  { label: "Gants fins", shared: false },
  { label: "Briquet", shared: true },
  { label: "Batterie externe", shared: false },
  { label: "Chaussures La Sportiva", shared: false },
  { label: "Crème anti-friction", shared: true },
  { label: "2 paires de chaussettes + pansements", shared: false },
  { label: "Montre Garmin + GPX téléchargés", shared: false },
  { label: "Bâtons de marche", shared: false },
  { label: "PQ + gel hydroalcoolique", shared: true },
  { label: "Bouchons d'oreilles + bandeau yeux", shared: false },
  { label: "Du journal", shared: false },
  { label: "Tongs", shared: false },
  { label: "Espèces (cash pour les refuges)", shared: false },
];
