// src/pages/Proprietaire/FacturesDocuments.tsx
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Wrench,
  Zap,
  Droplet,
  ShieldCheck,
  Landmark,
  Home,
  Shield,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/pages/Proprietaire/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import sucette from "@/assets/SuccetteIcon.svg";
import monIcone from "@/assets/downloadIcon.svg";
import Eye from "@/assets/oeil.png";
import Pencil from "@/assets/pencilIcon.svg";
// Types
type DocumentDivers = {
  id: string;
  type: string;
  categorie: string;
  titre: string;
  locataire: string;
  ville: string;
  bien: string;
  prestataire?: string;
  fournisseur?: string;
  compagnie?: string;
  diagnostiqueur?: string;
  numeroFacture?: string;
  reference?: string;
  police?: string;
  attestation?: string;
  montant?: number;
  cout?: number;
  prime?: number;
  date?: string;
  dateVisite?: string;
  validite?: string;
  dateLimite?: string;
  consommation?: string;
  resultat?: string;
  creeLe: string;
  organisme?: string;
  clientNumber?: string;
  periode?: string;
  dateEntretien?: string;
  dateDelivrance?: string;
  contrat?: string;
  classeEnergie?: string;
  anneeFiscal?: string;
};

// Stats mock
const mockStats = {
  totalDocuments: 87,
  facturesCeMois: 12,
  depenses2025: 8450,
  aRenouveler: 3,
};

// Documents mock
const mockDocuments: DocumentDivers[] = [
  {
    id: "1",
    type: "travaux",
    categorie: "FACTURE TRAVAUX",
    titre: "Réparation fuite d'eau",
    locataire: "Thomas Moreau",
    ville: "Marseille",
    bien: "Appartement Vieux-Port",
    prestataire: "Plomberie Express",
    numeroFacture: "PL-2025-0089",
    date: "12/02/2025",
    montant: 245,
    creeLe: "12/02/2025",
  },
  {
    id: "2",
    type: "diagnostic",
    categorie: "DIAGNOSTIC AMIANTE",
    titre: "Diagnostic amiante avant travaux",
    locataire: "Marie Lefevre",
    ville: "Lyon 6ème",
    bien: "Appartement Centre",
    diagnostiqueur: "Control Habitat",
    resultat: "Absence d'amiante",
    dateVisite: "05 Jan 2025",
    cout: 180,
    creeLe: "05/01/2025",
  },
  {
    id: "3",
    type: "assurance",
    categorie: "ASSURANCE GLI",
    titre: "Garantie Loyers Impayés 2025",
    locataire: "Martin Dupont",
    ville: "Boulogne-Billancourt",
    bien: "Maison avec jardin",
    compagnie: "AXA Assurances",
    police: "GLI-789456123",
    validite: "01/01 - 31/12/25",
    prime: 280,
    creeLe: "01/01/2025",
  },
  {
    id: "4",
    type: "travaux",
    categorie: "FACTURE TRAVAUX",
    titre: "Remise en peinture batiment",
    locataire: "Antoine Mercier",
    ville: "Bordeaux",
    bien: "Villa bleue",
    prestataire: "Color Pro",
    numeroFacture: "CP-2024-1245",
    date: "15/01/2025",
    montant: 1850,
    creeLe: "15/01/2025",
  },
  {
    id: "5",
    type: "energie",
    categorie: "FACTURE EAU",
    titre: "Consommation eau Janvier 2025",
    locataire: "Jean-Pierre Roussel",
    ville: "La Rochelle",
    bien: "Résidence du Parc",
    fournisseur: "Veolia Eau",
    consommation: "12 m³",
    montant: 45,
    periode: "Janvier 2025",
    creeLe: "05/02/2025",
  },
  {
    id: "6",
    type: "certificat",
    categorie: "CERTIFICAT",
    titre: "Certificat de conformté d'électricité",
    locataire: "Claude Dubois",
    ville: "Bordeaux",
    bien: "Villa bleue",
    organisme: "Consuel",
    dateDelivrance: "18/12/2024",
    attestation: "CON-2024-89456",
    resultat: "conforme",
    creeLe: "18/12/2024",
  },
  {
    id: "7",
    type: "travaux",
    categorie: "FACTURE TRAVAUX",
    titre: "Réparation chaudière",
    date: "20/01/2025",
    numeroFacture: "CP-2025-0456",
    montant: 620,
    locataire: "Claire Dubois",
    prestataire: "Chauffage Pro",
    ville: "Nantes",
    bien: "Studio Centre",
    creeLe: "18/12/2024",
  },
  {
    id: "8",
    type: "assurance",
    categorie: "ASSURANCE HABITATION",
    titre: "Assurance PNO 2025",
    locataire: "Sophia Bernard",
    ville: "Paris 15ème",
    bien: "Appartement Tour Eiffel",
    compagnie: "AXA Assurances",
    contrat: "AXA-45678912",
    validite: "01/01/25 - 31/12/25",
    prime: 420,
    creeLe: "01/01/2025",
  },
  {
    id: "9",
    type: "diagnostic",
    categorie: "DIAGNOSTIC DPE",
    titre: "Diagnostic de performance énergétique ",
    diagnostiqueur: "Expert Diag",
    locataire: "Martin Dupont",
    ville: "Boulogne-Billancourt",
    bien: "Maison avec jardin",
    validite: "jusqu'au 10/01/2030",
    dateVisite: "10/01/2025",
    classeEnergie: "C(120 kWh/m²)",
    creeLe: "01/01/2025",
  },
  {
    id: "10",
    type: "taxe",
    categorie: "TAXE FONCIÈRE",
    titre: "Taxe foncière 2024",
    locataire: "Jean-Pierre Roussel",
    ville: "La Rochelle",
    bien: "Résidence du Parc",
    reference: "TF-2024-8945",
    anneeFiscal: "2024",
    montant: 1280,
    dateLimite: "15/10/2024",
    creeLe: "15/10/2024",
  },
  {
    id: "11",
    type: "energie",
    categorie: "FACTURE ÉNERGIE",
    titre: "Électricité Janvier 2025",
    locataire: "Monique Alba",
    ville: "Villeurbanne",
    bien: "Appartement 8",
    fournisseur: "EDF",
    clientNumber: "1234567890",
    montant: 89,
    periode: "janvier 2025",
    creeLe: "03/02/2025",
  },
  {
    id: "12",
    type: "attestation",
    categorie: "ATTESTATION",
    titre: "Atttestation entretien chaudière",
    locataire: "Martin Dupont",
    ville: "Boulogne-Billancourt",
    bien: "Maison avec jardin",
    prestataire: "Gaz Service Plus",
    dateEntretien: "20/12/2024",
    validite:"jusqu'au 20/12/2025",
    cout: 125,
    creeLe: "20/12/2024",
  },
];

// Config catégories + icônes
const categoryConfig: Record<
  string,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  "FACTURE TRAVAUX": {
    bg: "bg-orange-100",
    text: "text-orange-400 font-extrabold",
    icon: <Wrench className="h-3.5 w-3.5" />,
  },
  "DIAGNOSTIC AMIANTE": {
    bg: "bg-blue-100",
    text: "text-blue-400 font-extrabold",
    icon: <Search className="h-3.5 w-3.5" />,
  },
  "DIAGNOSTIC DPE": {
    bg: "bg-blue-100",
    text: "text-blue-400 font-extrabold",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  "FACTURE EAU": {
    bg: "bg-yellow-100",
    text: "text-orange-400 font-extrabold",
    icon: <Droplet className="h-3.5 w-3.5" />,
  },
  "FACTURE ÉNERGIE": {
    bg: "bg-yellow-100",
    text: "text-orange-400 font-extrabold",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  CERTIFICAT: {
    bg: "bg-gray-100",
    text: "text-gray-400 font-extrabold",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  "TAXE FONCIÈRE": {
    bg: "bg-red-100",
    text: "text-red-400 font-extrabold",
    icon: <Landmark className="h-3.5 w-3.5" />,
  },
  "ASSURANCE GLI": {
    bg: "bg-purple-100",
    text: "text-purple-400 font-extrabold",
    icon: <Shield className="h-3.5 w-3.5" />,
  },
  "ASSURANCE HABITATION": {
    bg: "bg-purple-100",
    text: "text-purple-400 font-extrabold",
    icon: <Home className="h-3.5 w-3.5" />,
  },
  default: {
    bg: "bg-gray-100",
    text: "text-gray-400 font-extrabold",
    icon: <FileText className="h-3.5 w-3.5" />,
  },
};

export default function FacturesDocuments() {
  const [filterBien, setFilterBien] = useState("Tous les biens");
  const [filterType, setFilterType] = useState("Tous");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Tous");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesTab =
      activeTab === "Tous" ||
      doc.categorie.includes(activeTab) ||
      doc.type === activeTab.toLowerCase();
    const matchesBien =
      filterBien === "Tous les biens" || doc.bien.includes(filterBien);
    const matchesSearch =
      !search ||
      doc.titre.toLowerCase().includes(search.toLowerCase()) ||
      doc.locataire.toLowerCase().includes(search.toLowerCase()) ||
      doc.ville.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesBien && matchesSearch;
  });

  const biensList = [
    "Tous les biens",
    ...new Set(mockDocuments.map((d) => d.bien)),
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Factures et documents divers
          </h1>
          <p className="text-gray-600 mt-2">
            Centralisez tous vos documents importants : factures de travaux,
            assurances, diagnostics, attestations.
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 gap-2">
          <Plus className="h-4 w-4 text-purple-400" /> Ajouter un document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 w-16 bg-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 uppercase">
                  TOTAL DOCUMENTS
                </p>
                <p className="text-3xl font-bold">{mockStats.totalDocuments}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 uppercase">
                  FACTURES CE MOIS
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {mockStats.facturesCeMois}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 uppercase">DÉPENSES 2025</p>
                <p className="text-3xl font-bold text-purple-600">
                  {mockStats.depenses2025} €
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 uppercase">À RENOUVELER</p>
                <p className="text-3xl font-bold text-orange-600">
                  {mockStats.aRenouveler}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filtres */}
      <div className={loading ? "opacity-50 pointer-events-none" : ""}>
        <Tabs defaultValue="Tous" onValueChange={setActiveTab}>
          <TabsList className="bg-gray-50 flex flex-wrap h-auto justify-between text-black w-fit gap-4 rounded-3xl ">
            {[
              "Tous",
              "Facture",
              "Travaux",
              "Assurances",
              "Diagnostics",
              "Autres",
            ].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="
        px-10 py-3 
        text-sm
        bg-primary-light 
        hover:bg-primary-deep
        data-[state=active]:bg-primary-light
        data-[state=active]:text-white
        data-[state=inactive]:bg-gray-200
      "
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl space-y-4">
          <label className="block text-sm font-medium uppercase text-gray-700">
            Filtrer par bien et par type
          </label>
          <div className="grid md:grid-cols-2 gap-4 ">
            <Select value={filterBien} onValueChange={setFilterBien}>
              <SelectTrigger className="border-primary-light text-gray-500 font-medium bg-white">
                <SelectValue placeholder="Tous les biens" />
              </SelectTrigger>
              <SelectContent>
                {biensList.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="border-primary-light text-gray-500 font-medium bg-white">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tous">Tous les types</SelectItem>
                <SelectItem value="Facture">Facture</SelectItem>
                {/* autres */}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              className="pl-9 border-primary-light text-gray-500 font-medium bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Résultats */}
      {!loading && (
        <div className="text-sm text-gray-500">
          {filteredDocuments.length} document
          {filteredDocuments.length !== 1 ? "s" : ""} trouvé
          {filteredDocuments.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Grille */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="overflow-hidden rounded-xl border animate-pulse"
              >
                <div className="h-2 bg-gray-300"></div>
                <CardContent className="p-5 space-y-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          : filteredDocuments.map((doc) => {
              const config =
                categoryConfig[doc.categorie] || categoryConfig.default;

              return (
                <Card
                  key={doc.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all"
                >
                  <div
                    className={`h-5 mt-5 ml-5 rounded-lg w-fit flex items-center gap-2 p-3 text-xs ${config.bg} ${config.text}`}
                  >
                    {config.icon}
                    {doc.categorie}
                  </div>
                  <CardContent className=" space-y-4">
                    <h3 className="font-bold text-sm text-gray-700 truncate">
                      {doc.titre}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <img src={sucette} alt="Succette" className="w-4 h-4" />
                      {doc.locataire} • {doc.ville}
                    </p>

                    <div className="space-y-3">
                      {/* Première ligne : prestataire, diagnostiqueur, compagnie, fournisseur, organisme, année fiscale, date, date visite, validité, periode, date délivrance, date limite date entretient*/}
                      <div className="grid grid-cols-2 gap-4">
                        {doc.prestataire && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              PRESTATAIRE
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.prestataire}
                            </p>
                          </div>
                        )}
                        {doc.diagnostiqueur && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              DIAGNOSTIQUEUR
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.diagnostiqueur}
                            </p>
                          </div>
                        )}
                        {doc.fournisseur && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              FOURNISSEUR
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.fournisseur}
                            </p>
                          </div>
                        )}
                        {doc.compagnie && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              COMPAGNIE
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.compagnie}
                            </p>
                          </div>
                        )}
                        {doc.organisme && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              ORGANISME
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.organisme}
                            </p>
                          </div>
                        )}
                        {doc.dateDelivrance && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              Date délivrance
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.dateDelivrance}
                            </p>
                          </div>
                        )}
                        {doc.police && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              N° POLICE
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.police}
                            </p>
                          </div>
                        )}
                        {doc.date && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              DATE
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.date}
                            </p>
                          </div>
                        )}
                        {doc.dateVisite && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              DATE DE VISITE
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.dateVisite}
                            </p>
                          </div>
                        )}
                        {doc.validite && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              VALIDITÉ
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.validite}
                            </p>
                          </div>
                        )}
                        {doc.contrat && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              CONTRAT
                            </p>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.contrat}
                            </p>
                          </div>
                        )}
                        {doc.anneeFiscal && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              ANNÉE FISCALE
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.anneeFiscal}
                            </p>
                          </div>
                        )}
                        {doc.dateLimite && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              DATE LIMITE
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.dateLimite}
                            </p>
                          </div>
                        )}

                        {doc.attestation && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              N° ATTESTATION
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.attestation}
                            </p>
                          </div>
                        )}
                        {doc.resultat && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              RÉSULTAT
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.resultat}
                            </p>
                          </div>
                        )}
                        {doc.clientNumber && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              N° CLIENT
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.clientNumber}
                            </p>
                          </div>
                        )}
                        {doc.cout && (
                          <div className="top-0">
                            <p className="text-xs uppercase text-gray-600 font-light">
                              COÛT
                            </p>
                            <p className="text-base font-bold text-orange-600">
                              {doc.cout.toLocaleString("fr-FR")} €
                            </p>
                          </div>
                        )}
                        {doc.dateEntretien && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              DATE ENTRETIEN
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.dateEntretien}
                            </p>
                          </div>
                        )}
                        {doc.prime && (
                          <div className="">
                            <p className="text-xs uppercase text-gray-600 font-light">
                              PRIME ANNUELLE
                            </p>
                            <p className="text-base font-bold text-orange-600">
                              {doc.prime.toLocaleString("fr-FR")} €
                            </p>
                          </div>
                        )}
                        {doc.consommation && (
                          <div className="">
                            <p className="text-xs uppercase text-gray-600 font-light">
                              CONSOMMATION
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.consommation}
                            </p>
                          </div>
                        )}
                        {doc.classeEnergie && (
                          <div>
                            <p className="text-xs uppercase text-gray-600 font-light">
                              CLASSE ÉNERGIE
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.classeEnergie}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Deuxième ligne : N° Facture, montant ttc, résultat, cout, n° police, prime annuelle, consommation, n° attestaton, n°contrat, validité, classe énergie, réference, montant, n° */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="">
                          {doc.numeroFacture && (
                            <div>
                              <p className="text-xs uppercase text-gray-600 font-light">
                                N° FACTURE
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {doc.numeroFacture}
                              </p>
                            </div>
                          )}

                          {doc.reference && (
                            <div>
                              <p className="text-xs uppercase text-gray-600 font-light">
                                RÉFÉRENCE
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {doc.reference}
                              </p>
                            </div>
                          )}

                          {doc.periode && (
                            <div>
                              <p className="text-xs uppercase text-gray-600 font-light">
                                PÉRIODE
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {doc.periode}
                              </p>
                            </div>
                          )}
                        </div>

                        {doc.montant && (
                          <div className="">
                            <p className="text-xs uppercase text-gray-600 font-light">
                              MONTANT TTC
                            </p>
                            <p className="text-base font-bold text-orange-600">
                              {doc.montant.toLocaleString("fr-FR")} €
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t text-xs">
                      <p className="text-gray-500">
                        Créé le {doc.creeLe || "N/A"}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="null"
                          size="icon"
                          className="h-7 w-7 border border-gray-200"
                        >
                          <img src={Eye} alt="Voir" className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="null"
                          size="icon"
                          className="h-7 w-7 border border-gray-200"
                        >
                          <img
                            src={monIcone}
                            alt="Télécharger"
                            className="h-5 w-5"
                          />
                        </Button>
                        <Button
                          variant="null"
                          size="icon"
                          className="h-7 w-7 border border-gray-200"
                        >
                          <img
                            src={Pencil}
                            alt="Modifier"
                            className="h-5 w-5"
                          />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {!loading && filteredDocuments.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Aucun document trouvé</h3>
          <p className="mt-2 text-sm text-gray-500">Modifiez vos filtres.</p>
        </div>
      )}
    </div>
  );
}
