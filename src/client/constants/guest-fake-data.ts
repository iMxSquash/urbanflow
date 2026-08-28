import type { BadgeWithStatus, DashboardStats } from '../services/gamification.service'
import type { RewardCatalog, UserRedemption } from '../services/rewards.service'
import type { MobilityProfile } from '@shared/types/index'

// ── Invité ─────────────────────────────────────────────────────────────────────
// Données plausibles affichées floutées derrière `GuestLocked` (DashboardPage,
// DashboardBadgesPage, RewardsPage, ProfilePage) — un invité n'a pas de compte
// serveur (aucun trajet, badge, profil ou solde de points réel pour lui).
// Source unique pour toutes les constantes invité, pour éviter la dérive entre
// pages qui partagent conceptuellement la même donnée (ex : `totalPoints`, le
// même `users.total_points` fictif, affiché à la fois sur Dashboard et Rewards)
// (DRY, cf. CLAUDE.md).

export const GUEST_FAKE_TOTAL_POINTS = 340

export const GUEST_FAKE_BADGES: BadgeWithStatus[] = [
  {
    id: 'guest-badge-1',
    name: 'premier-trajet',
    description: 'Premier trajet enregistré',
    thresholdType: 'total_trips',
    thresholdValue: 1,
    modeFilter: null,
    unlocked: true,
    unlockedAt: '2026-05-03',
    currentValue: 1,
  },
  {
    id: 'guest-badge-2',
    name: 'explorateur',
    description: '5 trajets enregistrés',
    thresholdType: 'total_trips',
    thresholdValue: 5,
    modeFilter: null,
    unlocked: true,
    unlockedAt: '2026-05-20',
    currentValue: 5,
  },
  {
    id: 'guest-badge-3',
    name: 'cycliste',
    description: '10 trajets à vélo',
    thresholdType: 'total_trips',
    thresholdValue: 10,
    modeFilter: 'bike',
    unlocked: true,
    unlockedAt: '2026-06-14',
    currentValue: 10,
  },
  {
    id: 'guest-badge-4',
    name: 'eco-citoyen',
    description: '100 g de CO₂ économisés vs voiture',
    thresholdType: 'total_co2_saved_grams',
    thresholdValue: 100,
    modeFilter: null,
    unlocked: true,
    unlockedAt: '2026-06-02',
    currentValue: 100,
  },
  {
    id: 'guest-badge-5',
    name: 'militant-vert',
    description: '1 kg de CO₂ économisés vs voiture',
    thresholdType: 'total_co2_saved_grams',
    thresholdValue: 1000,
    modeFilter: null,
    unlocked: true,
    unlockedAt: '2026-07-25',
    currentValue: 1000,
  },
  {
    id: 'guest-badge-6',
    name: 'habitue',
    description: '20 trajets enregistrés',
    thresholdType: 'total_trips',
    thresholdValue: 20,
    modeFilter: null,
    unlocked: false,
    unlockedAt: null,
    currentValue: 14,
  },
  {
    id: 'guest-badge-7',
    name: 'champion-co2',
    description: '10 kg de CO₂ économisés vs voiture',
    thresholdType: 'total_co2_saved_grams',
    thresholdValue: 10000,
    modeFilter: null,
    unlocked: false,
    unlockedAt: null,
    currentValue: 3400,
  },
]

export const GUEST_FAKE_STATS: DashboardStats = {
  period: 'month',
  summary: {
    co2SavedGrams: 1800,
    tripCount: 9,
    totalPoints: GUEST_FAKE_TOTAL_POINTS,
  },
  weeklyCo2: [
    { weekStart: '2026-07-20', co2SavedGrams: 300 },
    { weekStart: '2026-07-27', co2SavedGrams: 600 },
    { weekStart: '2026-08-03', co2SavedGrams: 400 },
    { weekStart: '2026-08-10', co2SavedGrams: 500 },
  ],
  modeBreakdown: [
    { mode: 'tramway', count: 4 },
    { mode: 'bike', count: 3 },
    { mode: 'walk', count: 2 },
  ],
}

export const GUEST_FAKE_CATALOG: RewardCatalog = {
  totalPoints: GUEST_FAKE_TOTAL_POINTS,
  rewards: [
    {
      id: 'guest-1',
      name: 'Entrée Château des ducs de Bretagne',
      description: "Billet plein tarif pour l'exposition permanente",
      rewardType: 'museum_ticket',
      pointsCost: 250,
      partnerName: 'Château des ducs de Bretagne',
      affordable: true,
    },
    {
      id: 'guest-2',
      name: '10 % chez Bio&Co',
      description: 'Code de réduction valable en magasin',
      rewardType: 'discount_code',
      pointsCost: 150,
      partnerName: 'Bio&Co Nantes',
      affordable: true,
    },
    {
      id: 'guest-3',
      name: 'Entrée Muséum d’histoire naturelle',
      description: 'Billet plein tarif, valable 3 mois',
      rewardType: 'museum_ticket',
      pointsCost: 400,
      partnerName: 'Muséum de Nantes',
      affordable: false,
    },
    {
      id: 'guest-4',
      name: '15 % chez Nova Vélo',
      description: 'Réduction sur accessoires et entretien',
      rewardType: 'discount_code',
      pointsCost: 500,
      partnerName: 'Nova Vélo',
      affordable: false,
    },
  ],
}

export const GUEST_FAKE_REDEMPTIONS: UserRedemption[] = []

// Profil fictif — jamais persisté ni envoyé au serveur, purement décoratif.
export const GUEST_PROFILE: MobilityProfile = {
  userId: 'guest',
  preferredModes: ['walk', 'bike', 'tramway'],
  maxWalkMinutes: 15,
  preference: 'eco',
  pmrAccessibility: false,
  updatedAt: new Date().toISOString(),
}
