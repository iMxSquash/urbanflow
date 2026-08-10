import { LegalPageLayout, LegalSection } from '../components/LegalPageLayout'

export default function MentionsLegalesPage() {
  return (
    <LegalPageLayout title="Mentions légales">
      <LegalSection heading="Éditeur">
        <p>
          UrbanFlow SmartRoute est un projet académique réalisé dans le cadre du Titre 6 Concepteur
          Développeur Solutions Digitales (RNCP 36146), session de septembre 2026, par Elwen
          COUSSOT, développeur solo.
        </p>
        <p>
          Contact :{' '}
          <a href="mailto:contact@elwen.dev" className="inline text-primary underline">
            contact@elwen.dev
          </a>
        </p>
      </LegalSection>

      <LegalSection heading="Nature du projet">
        <p>
          Ce site est un prototype de démonstration sans vocation commerciale, développé à des fins
          pédagogiques. Il n'est pas destiné à un usage grand public en production et peut être
          interrompu ou modifié à tout moment.
        </p>
      </LegalSection>

      <LegalSection heading="Hébergement">
        <p>
          Frontend : Vercel Inc. — Backend : Render — Base de données : Supabase (PostgreSQL, région
          eu-west-3, Paris).
        </p>
      </LegalSection>

      <LegalSection heading="Directeur de publication">
        <p>Elwen COUSSOT, identifié au paragraphe « Éditeur » ci-dessus.</p>
      </LegalSection>

      <LegalSection heading="Propriété intellectuelle">
        <p>
          Le code source, les textes, la charte graphique et les éléments visuels du site sont la
          propriété d'Elwen COUSSOT, sauf mention contraire (bibliothèques tierces utilisées sous
          leurs licences respectives).
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
