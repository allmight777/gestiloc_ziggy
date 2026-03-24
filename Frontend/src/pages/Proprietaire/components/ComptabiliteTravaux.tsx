// src/pages/Proprietaire/ComptabiliteTravaux.tsx
import { useState } from "react";
import { Plus, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import upload from "@/assets/Upload.png"

const loyersData = [
  { mois: "Jan", recus: 5200, attendus: 5200 },
  { mois: "Fév", recus: 4800, attendus: 5200 },
  { mois: "Mar", recus: 5400, attendus: 5200 },
  { mois: "Avr", recus: 5100, attendus: 5200 },
  { mois: "Mai", recus: 5600, attendus: 5200 },
  { mois: "Juin", recus: 5300, attendus: 5200 },
];

// Mock data
const mockTransactions = [
  {
    date: "06 Fév 2025",
    type: "REVENU",
    description: "Loyer Février 2025 - Montée Alba",
    bien: "Villeurbanne",
    categorie: "Loyer",
    montant: 815,
  },
  {
    date: "05 Fév 2025",
    type: "REVENU",
    description: "Loyer Février 2025 - Thomas Moreau",
    bien: "Marseille",
    categorie: "Loyer",
    montant: 1250,
  },
  {
    date: "04 Fév 2025",
    type: "CHARGE",
    description: "Assurance PNO 2025",
    bien: "Paris 15eme",
    categorie: "Assurance",
    montant: -420,
  },
  {
    date: "03 Fév 2025",
    type: "REVENU",
    description: "Loyer Février 2025 - Sophia Bernard",
    bien: "Paris 15eme",
    categorie: "Loyer",
    montant: 1300,
  },
  {
    date: "30 Jan 2025",
    type: "REVENU",
    description: "Loyer Février 2025 - Jean-Pierre Roussel",
    bien: "La Rochelle",
    categorie: "Loyer",
    montant: 1050,
  },
  {
    date: "29 Jan 2025",
    type: "CHARGE",
    description: "Facture électricité Janvier",
    bien: "Villeurbanne",
    categorie: "Charges",
    montant: -89,
  },
  {
    date: "28 Jan 2025",
    type: "CHARGE",
    description: "Réparation plomberie",
    bien: "Marseille",
    categorie: "Travaux",
    montant: -245,
  },
  {
    date: "25 Jan 2025",
    type: "CHARGE",
    description: "Taxe foncière 2024",
    bien: "La Rochelle",
    categorie: "Taxes",
    montant: -1280,
  },
  {
    date: "20 Jan 2025",
    type: "CHARGE",
    description: "Assurance GLI",
    bien: "Boulogne-Billancourt",
    categorie: "Assurance",
    montant: -280,
  },
  {
    date: "15 Jan 2025",
    type: "CHARGE",
    description: "Diagnostic DPE",
    bien: "Lyon 6eme",
    categorie: "Diagnostic",
    montant: -180,
  },
  {
    date: "10 Jan 2025",
    type: "REVENU",
    description: "Loyer Janvier 2025 - Marie Lefevre",
    bien: "Lyon 6eme",
    categorie: "Loyer",
    montant: 1150,
  },
  {
    date: "05 Jan 2025",
    type: "REVENU",
    description: "Loyer Janvier 2025 - Thomas Moreau",
    bien: "Marseille",
    categorie: "Loyer",
    montant: 1250,
  },
  {
    date: "02 Jan 2025",
    type: "REVENU",
    description: "Loyer Janvier 2025 - Montée Alba",
    bien: "Villeurbanne",
    categorie: "Loyer",
    montant: 815,
  },
  {
    date: "01 Jan 2025",
    type: "REVENU",
    description: "Loyer Janvier 2025 - Sophia Bernard",
    bien: "Paris 15eme",
    categorie: "Loyer",
    montant: 1300,
  },
];


export default function ComptabiliteTravaux() {
  const [activeTab, setActiveTab] = useState("Toutes les transactions");

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Comptabilité et travaux</h1>
          <p className="text-gray-600 mt-1">
            Suivez vos revenus et dépenses locatives en temps réel.
            <br />
            Exportez vos données comptables et générez vos déclarations
            fiscales.
          </p>
        </div>
        <div className="flex flex-col gap-3 items-center">
          <Button variant="outline" className="gap-2 bg-orange-500 w-fit">
            <img src={upload} alt="exporter" className="w-6 h-6" />
            Exporter
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 gap-2">
            <Plus className="h-4 w-4" /> Ajouter une transaction
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border border-gray-100 bg-gray-200">
        <Card className="bg-green-600 text-white">
          <CardContent className="p-5">
            <p className="text-sm opacity-90">RÉSULTAT NET 2025</p>
            <p className="text-3xl font-bold mt-2">+33 330 F CFA</p>
            <p className="text-xs mt-1 opacity-75">+12% vs 2024</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">REVENUS LOCATIFS</p>
            <p className="text-3xl font-bold mt-2">45 780 F CFA</p>
            <p className="text-xs text-gray-500 mt-1">12 biens actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">CHARGES TOTALES</p>
            <p className="text-3xl font-bold mt-2 text-red-600">12 450 F CFA</p>
            <p className="text-xs text-gray-500 mt-1">34 transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">TAUX DE RENTABILITÉ</p>
            <p className="text-3xl font-bold mt-2 text-green-600">5.8%</p>
            <p className="text-xs text-gray-500 mt-1">Brut annuel</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Loyers chart */}
        <Card className="lg:col-span-5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  📊
                </div>
                <div>
                  <p className="font-semibold text-lg">Loyers</p>
                  <p className="text-xs text-gray-500">Montant (FCFA)</p>
                </div>
              </div>
              <Select defaultValue="2025">
                <SelectTrigger className="w-40 border-green-500 focus:ring-green-500">
                  <SelectValue>Cette année</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">Cette année</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loyersData} barCategoryGap={12} barGap={4}>
                  <XAxis
                    dataKey="mois"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    domain={[0, 6000]}
                    ticks={[0, 1000, 2000, 3000, 4000, 5000]}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: "20px" }}
                  />
                  <Bar
                    dataKey="recus"
                    name="Loyers reçus"
                    fill="#22c55e"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />
                  <Bar
                    dataKey="attendus"
                    name="Loyers attendus"
                    fill="#f97316"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Taux d'occupation - Version finale */}
        <Card className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md mx-auto shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-center text-gray-800 mb-6">
            Taux d'occupation
          </h3>

          <div className="relative w-56 h-56 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              {/* Définitions pour les effets */}
              <defs>
                <filter
                  id="shadow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="2"
                    stdDeviation="2"
                    floodOpacity="0.1"
                  />
                </filter>
              </defs>

              {/* Cercle de fond */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="3.5"
                strokeDasharray="100, 0"
              />

              {/* Segment vert (occupés) */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3.5"
                strokeDasharray="80, 20"
                strokeLinecap="round"
                filter="url(#shadow)"
              />

              {/* Segment jaune (vacants) */}
              <circle
                cx="18"
                cy="18"
                r="15.9155"
                fill="none"
                stroke="#facc15"
                strokeWidth="3.5"
                strokeDasharray="20, 80"
                strokeDashoffset="-80"
                strokeLinecap="round"
                filter="url(#shadow)"
              />
            </svg>
          </div>

          {/* Légende avec indicateurs */}
          <div className="flex items-center justify-center gap-6 mt-8 text-xl">
            <div className="flex flex-col items-center px-4 py-2">
              <span className="font-bold text-green-700">12</span>
              <span className="font-bold text-green-700">Occupés</span>
            </div>
            <div className="flex flex-col items-center px-4 py-2">
              <span className="font-bold text-yellow-700 ">3 </span>
              <span className="font-bold text-yellow-700"> Vacants</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Petits tableaux */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold mb-4 text-sm">Revenus par catégorie</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span>Loyers perçus</span>
                <span className="font-medium">45 780 F CFA</span>
              </div>
              <div className="flex justify-between">
                <span>Charges récupérables</span>
                <span className="font-medium">3 240 F CFA</span>
              </div>
              <div className="flex justify-between">
                <span>Autres revenus</span>
                <span className="font-medium">450 F CFA</span>
              </div>
              <div className="border-t pt-3 font-bold flex justify-between">
                <span>Total revenus</span>
                <span className="text-primary-light">49 470 F CFA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold mb-4 text-sm">Charges par catégorie</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span>Travaux et réparations</span>
                <span className="font-medium">5 800 F CFA</span>
              </div>
              <div className="flex justify-between">
                <span>Charges non récupérables</span>
                <span className="font-medium">2 450 F CFA</span>
              </div>
              <div className="flex justify-between">
                <span>Assurances</span>
                <span className="font-medium">1 680 F CFA</span>
              </div>
              <div className="flex justify-between">
                <span>Taxe foncière</span>
                <span className="font-medium">2 520 F CFA</span>
              </div>
              <div className="border-t pt-3 font-bold flex justify-between text-red-600">
                <span>Total charges</span>
                <span className="text-red-500">12 450 F CFA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-bold mb-4 text-sm">Répartition par bien</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span>Paris 15ème</span>
                <span className="font-medium text-green-600">+8 450 €</span>
              </div>
              <div className="flex justify-between">
                <span>La Rochelle</span>
                <span className="font-medium text-green-600">+6 780 €</span>
              </div>
              <div className="flex justify-between">
                <span>Lyon 6ème</span>
                <span className="font-medium text-green-600">+5 920 €</span>
              </div>
              <div className="flex justify-between">
                <span>Autres biens (9)</span>
                <span className="font-medium text-green-600">+12 180 €</span>
              </div>
              <div className="border-t pt-3 font-bold flex justify-between">
                <span>Résultat total</span>
                <span className="text-green-600">+33 330 €</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Filtre + Tableau */}
      <div className="bg-white rounded-xl ">
        <Tabs
          defaultValue="Toutes les transactions"
          onValueChange={setActiveTab}
        >
          <TabsList className="bg-gray-50 flex flex-wrap h-auto justify-between text-black w-fit gap-7 rounded-full">
            {[
              "Toutes les transactions",
              "Revenus",
              "Charges",
              "Janvier 2025",
              "Fevrier 2025",
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

        <div className="mt-5 p-5 border border-gray-200 bg-gray-50 space-y-5 rounded-lg">
          <h3 className="font-light text-sm">FILTRER LES TRANSACTIONS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select>
              <SelectTrigger className="border-green-500  bg-white">
                <SelectValue placeholder="Tous les biens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les biens</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="border-green-500  bg-white">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les catégories</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher"
                className="pl-10 border-green-500 bg-white w-full"
              />
            </div>
            <div className="text-sm text-gray-500 self-center whitespace-nowrap pl-9">
              142 transactions
            </div>
          </div>
        </div>

        <div className="overflow-x-auto mt-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 font-medium text-gray-500">
                  DATE
                </th>
                <th className="text-left p-4 font-medium text-gray-500">
                  TYPE
                </th>
                <th className="text-left p-4 font-medium text-gray-500">
                  DESCRIPTION
                </th>
                <th className="text-left p-4 font-medium text-gray-500">
                  BIEN
                </th>
                <th className="text-left p-4 font-medium text-gray-500">
                  CATÉGORIE
                </th>
                <th className="text-right p-4 font-medium text-gray-500">
                  MONTANT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockTransactions.map((tx, i) => (
                <tr key={i}>
                  <td className="p-4">{tx.date}</td>
                  <td>
                    <Badge
                      className={
                        tx.type === "REVENU"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {tx.type}
                    </Badge>
                  </td>
                  <td className="font-medium">{tx.description}</td>
                  <td>{tx.bien}</td>
                  <td>{tx.categorie}</td>
                  <td
                    className={`text-right font-medium ${tx.montant > 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {tx.montant > 0 ? "+" : ""}
                    {tx.montant} F CFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
