import { LegalPageLayout, LegalSection } from '../components/LegalPageLayout'

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPageLayout title="Politique de confidentialité">
      <LegalSection heading="Responsable de traitement">
        <p>
          Le développeur du projet UrbanFlow SmartRoute est responsable du traitement des données
          personnelles décrit ci-dessous. Contact :{' '}
          <a href="mailto:coussotelwen@gmail.com" className="text-primary underline">
            coussotelwen@gmail.com
          </a>
        </p>
      </LegalSection>

      <LegalSection heading="Données collectées">
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>Email et mot de passe (haché, jamais stocké en clair) pour la création de compte.</li>
          <li>
            Profil de mobilité : modes de transport préférés, seuil de marche, préférence
            (éco/rapide/équilibré), besoin d'accessibilité PMR.
          </li>
          <li>
            Position GPS : utilisée uniquement le temps du calcul d'un itinéraire ou du suivi
            d'un trajet en cours, avec consentement préalable — jamais stockée en base au-delà de
            cette requête.
          </li>
          <li>
            Historique de trajets : modes utilisés, CO2 économisé, points gagnés et date —{' '}
            <b className="text-text">sans aucune coordonnée GPS</b>, qui ne permet pas de
            reconstituer un trajet réel.
          </li>
          <li>Badges débloqués et récompenses échangées auprès de partenaires.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Finalités du traitement">
        <p>
          Calcul et affichage d'itinéraires multimodaux, gamification (points, badges), tableau de
          bord de statistiques de mobilité personnelles, gestion du compte utilisateur.
        </p>
      </LegalSection>

      <LegalSection heading="Base légale">
        <p>
          Le traitement du compte repose sur l'exécution du contrat d'utilisation du service. La
          géolocalisation repose exclusivement sur le consentement explicite de l'utilisateur,
          recueilli avant toute activation et révocable à tout moment depuis Paramètres.
        </p>
      </LegalSection>

      <LegalSection heading="Destinataires et sous-traitants">
        <p>
          Aucune donnée n'est partagée à des fins commerciales ou publicitaires. Des
          sous-traitants techniques interviennent pour le fonctionnement du service : Transitous
          et OSRM (calcul d'itinéraire — coordonnées transmises arrondies à 4 décimales, environ
          10 mètres de précision), OpenWeatherMap (météo), CartoDB (fond de carte), Vercel, Render
          et Supabase (hébergement, région eu-west-3).
        </p>
      </LegalSection>

      <LegalSection heading="Durée de conservation">
        <p>
          Le compte est conservé tant qu'il reste actif. L'historique de trajets et les
          récompenses échangées sont conservés 12 mois, puis supprimés automatiquement par un job
          de purge planifié quotidien. La suppression du compte entraîne l'effacement immédiat et
          définitif de l'ensemble des données associées.
        </p>
      </LegalSection>

      <LegalSection heading="Sécurité">
        <p>
          Mots de passe hachés (bcrypt), jetons d'authentification de courte durée (15 minutes),
          jeton de rafraîchissement en cookie HttpOnly/Secure/SameSite=Strict, connexions
          chiffrées.
        </p>
      </LegalSection>

      <LegalSection heading="Vos droits">
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>Droit d'accès : vos données sont visibles dans votre profil.</li>
          <li>
            Droit à la portabilité : export JSON de l'ensemble de vos données personnelles,
            disponible depuis Paramètres.
          </li>
          <li>
            Droit à l'effacement : suppression définitive et immédiate du compte, disponible
            depuis Paramètres.
          </li>
          <li>
            Droit d'opposition : désactivation de la géolocalisation à tout moment, saisie
            manuelle du point de départ toujours possible.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          Seul un cookie technique HttpOnly (jeton de rafraîchissement de session) est utilisé.
          Les préférences de thème et de consentement géolocalisation sont stockées localement
          dans le navigateur (localStorage), jamais transmises à un tiers. Aucun cookie publicitaire
          ou de suivi tiers n'est déposé.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
