// src/pages/Proprietaire/Parametres.tsx
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Parametres() {
  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-gray-600 mt-1">
          Gérez votre compte, vos préférences et votre abonnement
        </p>
      </div>

      {/* 1. Préférences de notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Préférences de notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Notifications par email</p>
              <p className="text-sm text-gray-500">
                Recevoir les notifications importantes par email
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Rappels de paiement</p>
              <p className="text-sm text-gray-500">
                Alertes pour les loyers impayés
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Échéances de bail</p>
              <p className="text-sm text-gray-500">
                Notifications avant expiration des baux
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Travaux et réparations</p>
              <p className="text-sm text-gray-500">
                Mises à jour sur les interventions
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Newsletter mensuelle</p>
              <p className="text-sm text-gray-500">
                Conseils et actualités de la gestion locative
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* 2. Abonnement */}
      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-600 text-white rounded-2xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Plan Premium</p>
                <p className="text-4xl font-bold mt-1">29,99 €</p>
                <p className="text-sm opacity-75">
                  par mois • Renouvelé le 15 mars 2025
                </p>
              </div>
              <Badge className="bg-white text-green-700">Actif</Badge>
            </div>
            <ul className="mt-6 space-y-2 text-sm">
              <li>✓ Biens illimités</li>
              <li>✓ Stockage illimité</li>
              <li>✓ Génération automatique des documents</li>
              <li>✓ Support prioritaire</li>
              <li>✓ Exports comptables avancés</li>
            </ul>
            <Button className="mt-6 w-full bg-white text-green-700 hover:bg-gray-100">
              Gérer l’abonnement
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Mode de paiement</p>
              <p className="font-medium">Carte bancaire •••• 4242</p>
            </div>
            <Button variant="outline" className="md:justify-self-end">
              Modifier
            </Button>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div>
              <p className="text-gray-500">Historique de facturation</p>
              <p className="text-xs text-gray-400">Téléchargez vos factures</p>
            </div>
            <Button variant="outline">Voir l’historique</Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Apparence */}
      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Thème</p>
              <p className="text-sm text-gray-500">
                Choix du thème de l’application
              </p>
            </div>
            <Select defaultValue="clair">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clair">Clair</SelectItem>
                <SelectItem value="sombre">Sombre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Langue</p>
              <p className="text-sm text-gray-500">Langue de l’interface</p>
            </div>
            <Select defaultValue="fr">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Fuseau horaire</p>
              <p className="text-sm text-gray-500">
                Heure d’affichage des dates et heures
              </p>
            </div>
            <Select defaultValue="gmt1">
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gmt1">Europe/Paris (GMT+1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Format de date</p>
              <p className="text-sm text-gray-500">
                Comment afficher les dates
              </p>
            </div>
            <Select defaultValue="jjmm">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jjmm">JJ/MM/AAAA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 4. Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle>Sécurité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Mot de passe</p>
              <p className="text-sm text-gray-500">
                Dernière modification il y a 3 mois
              </p>
            </div>
            <Button variant="outline">Changer le mot de passe</Button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Authentification à deux facteurs</p>
              <p className="text-sm text-gray-500">
                Sécurité renforcée pour votre compte
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Sessions actives</p>
              <p className="text-sm text-gray-500">
                Gérer les appareils connectés
              </p>
            </div>
            <Button variant="outline">Voir les sessions</Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
            <span>ℹ️</span>
            Nous recommandons d’activer l’authentification à deux facteurs pour
            une sécurité maximale.
          </div>
        </CardContent>
      </Card>

      {/* 5. Paramètres avancés */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres avancés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Exporter mes données</p>
              <p className="text-sm text-gray-500">
                Télécharger toutes vos données au format JSON
              </p>
            </div>
            <Button variant="outline">Exporter</Button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Sauvegarde automatique</p>
              <p className="text-sm text-gray-500">
                Sauvegarder automatiquement vos documents
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Mode développeur</p>
              <p className="text-sm text-gray-500">
                Activer les fonctionnalités de développement
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* 6. Zone de danger */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Zone de danger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Désactiver le compte</p>
              <p className="text-sm text-gray-600">
                Désactiver temporairement votre compte
              </p>
            </div>
            <Button variant="destructive" className="bg-red-600">
              Désactiver
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Supprimer le compte</p>
              <p className="text-sm text-gray-600">
                Supprimer définitivement votre compte et toutes vos données
              </p>
            </div>
            <Button variant="destructive">Supprimer le compte</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
