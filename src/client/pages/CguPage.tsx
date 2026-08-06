import { LegalPageLayout, LegalSection } from '../components/LegalPageLayout'

export default function CguPage() {
  return (
    <LegalPageLayout title="Conditions générales d'utilisation">
      <LegalSection heading="Objet">
        <p>
          Les présentes CGU régissent l'utilisation d'UrbanFlow SmartRoute, plateforme de mobilité
          urbaine multimodale pour Nantes Métropole : calcul d'itinéraires (bus, tramway,
          navibus, train, vélo, marche, trottinette), gamification (points, badges) et
          récompenses auprès de partenaires.
        </p>
      </LegalSection>

      <LegalSection heading="Accès au service">
        <p>
          Le service est accessible gratuitement, avec ou sans compte (« Continuer sans compte »).
          La création d'un compte (email + mot de passe) permet de sauvegarder son profil de
          mobilité, son historique de trajets et ses points de gamification.
        </p>
      </LegalSection>

      <LegalSection heading="Fiabilité des itinéraires">
        <p>
          Les itinéraires, horaires et temps de trajet affichés sont calculés à partir d'APIs
          tierces (Transitous pour les transports en commun, OSRM pour les modes actifs) et sont
          fournis à titre indicatif. Aucune garantie de disponibilité, de ponctualité ou
          d'exactitude en temps réel n'est apportée, notamment lorsque le mode démo est activé
          (données statiques de démonstration).
        </p>
      </LegalSection>

      <LegalSection heading="Compte utilisateur">
        <p>
          L'utilisateur est responsable de la confidentialité de son mot de passe. Le compte peut
          être supprimé à tout moment, de façon définitive et irréversible, depuis l'écran
          Paramètres.
        </p>
      </LegalSection>

      <LegalSection heading="Gamification et récompenses">
        <p>
          Les points gagnés et les récompenses proposées par des partenaires fictifs n'ont aucune
          valeur monétaire réelle et sont fournis dans un cadre strictement démonstratif.
        </p>
      </LegalSection>

      <LegalSection heading="Disponibilité du service">
        <p>
          Le service est hébergé sur des offres gratuites ou étudiantes (Vercel, Render, Supabase)
          et ne bénéficie d'aucune garantie de disponibilité continue.
        </p>
      </LegalSection>

      <LegalSection heading="Droit applicable">
        <p>Les présentes CGU sont soumises au droit français.</p>
      </LegalSection>
    </LegalPageLayout>
  )
}
