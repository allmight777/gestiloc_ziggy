// src/pages/Proprietaire/ArchivageDocuments.tsx
import { useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import CheckIcon from "@/assets/coches.png"
import sucette from "@/assets/SuccetteIcon.svg";
import fichierFinance from "@/assets/fichierFinance.png";
import telephone from "@/assets/telephone.png";
import croix from "@/assets/croix.png";
import mecanicien from "@/assets/mecanicien.png";
import dossier from "@/assets/dossier.png";
import fichier from "@/assets/fichier.png"
import eyeIcon from "@/assets/oeil.png";
import download from "@/assets/downloadIcon.svg";
import trashIcon from "@/assets/trash-bin.png";
import justiceIcon from "@/assets/justice-scale.png";
import pencilIcon from "@/assets/pencilIcon.svg";
import returnIcon from "@/assets/return.png";
import fichierIcon from "@/assets/attention.png";
import calendrierIcon from "@/assets/calendrier.png";
import boxIcon from "@/assets/box.png";
import cercleIcon from '@/assets/cercle.png'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Type mock
type Intervention = {
  id: string;
  statut: "urgent" | "en Cours" | "planifie" | "terminee";
  titre: string;
  locataire: string;
  ville: string;
  type:
    | "Plomberie"
    | "Chauffage"
    | "Électricité"
    | "Menuiserie"
    | "Serrurerie"
    | "Autre";
  priorite?: "Urgente" | "Moyenne" | "Faible";
  demandeLe?: string;
  debutTravaux?: string;
  datePrevue?: string;
  dateRealisation?: string;
  prestataire?: string;
  devisEstime?: number;
  devisAccepte?: number;
  devisEnAttente?: boolean;
  devis?: number;
  avancement?: number;
  coutFinal?: number;
  statutPaiement?: "Payée" | "En attente";
  creeLe?: string;
  finPrevue?: string;
  planifieLe?: string;
  termineLe?: string;
  dateIntervention?: string
};

// Mock data
const mockInterventions: Intervention[] = [
  {
    id: "1",
    statut: "urgent",
    titre: "Fuite d'eau salle de bain",
    locataire: "Sophia Bernard",
    ville: "Paris 15ème",
    type: "Plomberie",
    priorite: "Urgente",
    demandeLe: "05 Fév 2025",
    prestataire: "À affecter",
    devisEstime: 350,
    creeLe: "Créé le 05 Fév 2025",
  },
  {
    id: "2",
    statut: "en Cours",
    titre: "Remplacement chaudière",
    locataire: "Montée Alba",
    ville: "Villeurbanne",
    type: "Chauffage",
    priorite: "Moyenne",
    debutTravaux: "03 Fév 2025",
    prestataire: "Chauffage Pro",
    devisAccepte: 2800,
    avancement: 60,
    finPrevue: "Fin prévue le 10 Fév 2025",
  },
  {
    id: "3",
    statut: "planifie",
    titre: "Révision annuelle chaudière",
    locataire: "Jean-Pierre Roussel",
    ville: "La Rochelle",
    type: "Chauffage",
    priorite: "Faible",
    datePrevue: "15 Fév 2025",
    prestataire: "Gaz Service Plus",
    devis: 125,
    planifieLe: "Planifié le 28 Jan 2025",
  },
  {
    id: "4",
    statut: "urgent",
    titre: "Panne électrique cuisine",
    locataire: "Martin Dupont",
    ville: "Boulogne-Billancourt",
    type: "Électricité",
    priorite: "Urgente",
    demandeLe: "06 Fév 2025",
    prestataire: "Électro Express",
    devisEnAttente: true,
    dateIntervention: "Intervention prévue pour aujourd'hui"
  },
  {
    id: "5",
    statut: "en Cours",
    titre: "Réparation volets roulants",
    locataire: "Thomas Moreau",
    ville: "Marseille",
    type: "Menuiserie",
    priorite: "Moyenne",
    debutTravaux: "01 Fév 2025",
    prestataire: "Fermetures Plus",
    devisAccepte: 580,
    avancement: 85,
    finPrevue: "Fin prévue le 08 Fév 2025",
  },
  {
    id: "6",
    statut: "terminee",
    titre: "Changement serrure porte d'entrée",
    locataire: "Marie Lefevre",
    ville: "Lyon 6ème",
    type: "Serrurerie",
    dateRealisation: "30 Jan 2025",
    prestataire: "Serrure Service",
    coutFinal: 195,
    statutPaiement: "Payée",
    termineLe: "Terminé le 30 Jan 2025",
  },
];
export default function RepartitionTravaux() {
  const [search, setSearch] = useState("");
  const [filterBien] = useState("Tous les biens");
  const [filterAnnee] = useState("Toutes les années");

  const filtered = mockInterventions.filter(
    (d) =>
      d.titre.toLowerCase().includes(search.toLowerCase()) ||
      d.locataire.toLowerCase().includes(search.toLowerCase()),
  );

  function setActiveTab(value: string): void {
    throw new Error("Function not implemented.");
  }

  function handleMoreOptions(doc: Intervention): void {
    throw new Error("Function not implemented.");
  }

  function handleEdit(doc: Intervention): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Répartitions et travaux</h1>
          <p className="text-2sm font-light mt-2">
            Gérez vos interventions, suivez les demandes de vos locataires et
            planifiez les travaux. <br /> Centralisez tous les devis, factures
            et suivis de chantier au même endroit.
          </p>
        </div>
        <Button className="bg-primary-light hover:bg-primary-deep">
          <Plus className="mr-2 h-4 w-4 text-purple-600" /> Crée une interaction
        </Button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 bg-gray-100 pb-1">
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm text-gray-500 uppercase">
              Interventions urgentes
            </p>
            <p className="text-2xl font-medium text-red-600">3</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm text-gray-500 uppercase">en cours</p>
            <p className="text-2xl font-medium text-blue-600">5</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm text-gray-500 uppercase">planifié</p>
            <p className="text-2xl font-medium ">8</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm text-gray-500 uppercase">cout total 2025</p>
            <p className="text-2xl font-medium text-orange-600">12 480 F CFA</p>
          </CardContent>
        </Card>
      </div>
      {/* Filtres catégories */}

      {/* Filtres */}

      <Tabs defaultValue="Tous" onValueChange={setActiveTab}>
        <TabsList className="bg-gray-50 flex flex-wrap h-auto justify-between text-black w-fit gap-4 rounded-3xl ">
          {["Tous", "Urgentes", "En cours", "Planifiées", "Terminées"].map(
            (tab) => (
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
            ),
          )}
        </TabsList>
      </Tabs>
      {/* Filtres + recherche */}
      <div className="bg-white border border-gray-300 rounded-xl p-5 space-y-5">
        <h3 className="text-lg font-semibold text-gray-900">FILTRE</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select>
            <SelectTrigger className="border-green-500  bg-white">
              <SelectValue placeholder="Tous les biens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les biens</SelectItem>
              {/* autres biens */}
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="border-green-500 bg-white">
              <SelectValue placeholder="Toutes les années" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toutes">Toutes les années</SelectItem>
              {/* autres années */}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher"
            className="pl-10 border-green-500 bg-white"
          />
        </div>
      </div>
      {/* Grille */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 bg-gray-100 p-1">
        {filtered.map((doc) => (
          <Card
            key={doc.id}
            className="overflow-hidden bg-white border rounded-xl shadow-sm hover:shadow-md transition"
          >
            <CardContent className="p-5 space-y-4">
              <div
                className={`text-xs flex gap-2 h-7 items-center w-fit pr-2 rounded-3xl uppercase ${
                  doc.statut.includes("urgent")
                    ? "bg-red-100 text-red-500"
                    : doc.statut.includes("en Cours")
                      ? "bg-blue-100 text-blue-500"
                      : doc.statut.includes("planifie")
                        ? "bg-orange-100 text-orange-500"
                        : "bg-green-100 text-green-500"
                }`}
              >
                <img
                  src={
                    doc.statut.includes("urgent")
                      ? fichierIcon
                      : doc.statut.includes("en Cours")
                        ? cercleIcon
                        : doc.statut.includes("planifie")
                          ? calendrierIcon
                          : CheckIcon
                  }
                  alt=""
                  className="ml-2 h-3.5 w-3.5"
                />
                {doc.statut}
              </div>
              <h3 className="font-bold text-sm text-gray-700">{doc.titre}</h3>
              <p className="text-sm flex items-center gap-1.5 text-gray-500">
                <img src={sucette} alt="Succette" className="w-4 h-4" />
                {doc.locataire} • {doc.ville}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* TYPE D'INTERVENTION */}
                {doc.type && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Type
                    </span>
                    <p className="font-medium">{doc.type}</p>
                  </div>
                )}

                {/* PRIORITÉ */}
                {doc.priorite && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Priorité
                    </span>
                    <p className="font-medium">{doc.priorite}</p>
                  </div>
                )}

                {/* DATES */}
                {doc.demandeLe && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Demandé le
                    </span>
                    <p className="font-medium">{doc.demandeLe}</p>
                  </div>
                )}

                {doc.datePrevue && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Date prévue
                    </span>
                    <p className="font-medium">{doc.datePrevue}</p>
                  </div>
                )}

                {doc.debutTravaux && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Début travaux
                    </span>
                    <p className="font-medium">{doc.debutTravaux}</p>
                  </div>
                )}

                {/*doc.finPrevue && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Fin prévue
                    </span>
                    <p className="font-medium">{doc.finPrevue}</p>
                  </div>
                )*/}

                {doc.dateRealisation && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Date réalisation
                    </span>
                    <p className="font-medium">{doc.dateRealisation}</p>
                  </div>
                )}

                {/*doc.planifieLe && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Planifié le
                    </span>
                    <p className="font-medium">{doc.planifieLe}</p>
                  </div>
                )}

                {doc.termineLe && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Terminé le
                    </span>
                    <p className="font-medium">{doc.termineLe}</p>
                  </div>
                )}

                {/* INTERVENANTS */}
                {doc.prestataire && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Prestataire
                    </span>
                    <p className="font-medium">{doc.prestataire}</p>
                  </div>
                )}

                {/* DEVIS ET MONTANTS */}
                {doc.devisEstime !== undefined && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Devis estimé
                    </span>
                    <p className="font-medium  text-orange-600">
                      {doc.devisEstime.toLocaleString("fr-FR")} €
                    </p>
                  </div>
                )}

                {doc.devisAccepte !== undefined && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Devis accepté
                    </span>
                    <p className="font-medium text-orange-600">
                      {doc.devisAccepte.toLocaleString("fr-FR")} €
                    </p>
                  </div>
                )}

                {doc.devis !== undefined && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Devis
                    </span>
                    <p className="font-medium  text-orange-600">
                      {doc.devis.toLocaleString("fr-FR")} €
                    </p>
                  </div>
                )}

                {doc.devisEnAttente !== undefined && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Devis en attente
                    </span>
                    <p className="font-medium  text-orange-600">
                      {doc.devisEnAttente ? "Oui" : "Non"}
                    </p>
                  </div>
                )}

                {/* COÛTS ET PAIEMENTS */}

                {doc.coutFinal !== undefined && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Coût final
                    </span>
                    <p className="font-medium text-orange-600">
                      {doc.coutFinal.toLocaleString("fr-FR")} F CFA
                    </p>
                  </div>
                )}

                {doc.statutPaiement && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Statut paiement
                    </span>
                    <p className="font-medium">{doc.statutPaiement}</p>
                  </div>
                )}
                {doc.avancement !== undefined && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase">
                      Avancement
                    </span>
                    <p className="text-xs font-medium">{doc.avancement}%</p>
                  </div>
                )}

                {/* DATE DE CRÉATION (toujours en bas) */}
              </div>{" "}
              <div className="flex justify-between text-xs text-gray-500 pt-3 border-t">
                {doc.creeLe && <span>{doc.creeLe}</span>}
                {doc.finPrevue && <span>{doc.finPrevue}</span>}
                {doc.planifieLe && <span>{doc.planifieLe}</span>}
                {doc.dateIntervention && <span>{doc.dateIntervention}</span>}
                {doc.termineLe && <span>{doc.termineLe}</span>}
                <div className="flex gap-3">
                  {doc.statut.includes("urgent") && (
                    <div className="flex justify-between gap-3">
                      <img
                        src={eyeIcon}
                        alt="voir"
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                      <img
                        src={mecanicien}
                        alt=""
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                      <img
                        src={pencilIcon}
                        alt="modifier"
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                    </div>
                  )}
                  {doc.statut.includes("en Cours") && (
                    <div className="flex justify-between gap-3">
                      <img
                        src={eyeIcon}
                        alt="voir"
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                      <img
                        src={fichierFinance}
                        alt=""
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                      <img
                        src={telephone}
                        alt="modifier"
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                    </div>
                  )}
                  {doc.statut.includes("planifie") && (
                    <div className="flex justify-between gap-3">
                      <img
                        src={eyeIcon}
                        alt=""
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                      <img
                        src={calendrierIcon}
                        alt=""
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                      <img
                        src={croix}
                        alt=""
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                    </div>
                  )}
                  {doc.statut.includes("terminee") && (
                    <div className="flex justify-between gap-3">
                      <img
                        src={eyeIcon}
                        alt=""
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                      <img
                        src={fichier}
                        alt=""
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                      <img
                        src={dossier}
                        alt=""
                        className="w-6 h-6 p-1 border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
