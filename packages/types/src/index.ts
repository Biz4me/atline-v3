// ==========================================
// ATLINE V3 – Types partagés
// ==========================================

// ─── Utilisateur & Auth ───────────────────

export type UserRole = 'distributor' | 'client' | 'admin';

export interface AtlineUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  // Accès
  hasLicence: boolean;       // Licence distributeur (99€/an)
  hasCoach: boolean;         // Atline Coach MLM (39€/mois)
  // MLM
  referralCode: string;
  sponsorId?: string;
  mlmLevel: number;          // Niveau débloqué (1-7)
  directCount: number;       // Filleuls directs actifs
  createdAt: Date;
}

// ─── Réseau MLM ───────────────────────────

export interface NetworkNode {
  id: string;
  userId: string;
  name: string;
  email: string;
  level: number;             // Profondeur dans l'arbre
  isActive: boolean;         // Abonné actif
  joinedAt: Date;
  products: string[];        // IDs produits actifs
  monthlyCommission: number; // Commission générée ce mois
  children?: NetworkNode[];
}

export interface CommissionEntry {
  id: string;
  fromUserId: string;
  fromUserName: string;
  productId: string;
  productName: string;
  amount: number;            // Montant en €
  level: number;             // Niveau MLM (1-7)
  month: string;             // "2026-05"
  status: 'pending' | 'paid';
  createdAt: Date;
}

// ─── Simulateur Vocal ─────────────────────

export type SimulatorPersona =
  | 'curious'     // Le Curieux     (débutant)
  | 'skeptic'     // Le Sceptique   (intermédiaire)
  | 'busy'        // Le Pressé      (intermédiaire)
  | 'hostile'     // L'Hostile      (avancé, score > 75)
  | 'close';      // Le Proche      (avancé, score > 75)

export interface SimulatorSession {
  id: string;
  userId: string;
  persona: SimulatorPersona;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds: number;
  transcript: TranscriptEntry[];
  debrief?: SimulatorDebrief;
}

export interface TranscriptEntry {
  role: 'user' | 'prospect';
  text: string;
  timestamp: number;         // secondes depuis début
}

export interface SimulatorDebrief {
  score: number;             // 0-100
  pointsForts: string[];
  axesAmelioration: DebriefAxis[];
  modulesRecommandes: RecommendedModule[];
  prochainExercice: NextExercise;
  actionPrioritaire: string;
  debloquerPersona: SimulatorPersona | null;
  rdvCoachHumain: boolean;
  tendance: 'improving' | 'stable' | 'declining';
}

export interface DebriefAxis {
  point: string;
  timestamp?: string;        // "3:20"
}

export interface RecommendedModule {
  id: string;
  titre: string;
  raison: string;
}

export interface NextExercise {
  persona: SimulatorPersona;
  focus: string;
  dureeSuggeree: number;     // minutes
}

// ─── Quota simulateur ─────────────────────

export interface SimulatorQuota {
  used: number;              // secondes utilisées
  remaining: number;         // secondes restantes
  monthly: number;           // quota mensuel (7200 = 2h)
  month: string;             // "2026-05"
}

// ─── Produits & Abonnements ───────────────

export type ProductId =
  | 'licence_distributor'
  | 'coach_mlm'
  | 'smm_pro'
  | 'secretaire_starter'
  | 'secretaire_standard'
  | 'secretaire_pro'
  | 'mailpilot'
  | 'agendaai'
  | 'meetingbrief'
  | 'contentloop'
  | 'relanceai'
  | 'veillebot'
  | 'reputeai';

export interface Subscription {
  id: string;
  userId: string;
  productId: ProductId;
  stripeSubscriptionId: string;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodEnd: Date;
  createdAt: Date;
}

// ─── CRM ──────────────────────────────────

export type ProspectStatus =
  | 'new'
  | 'contacted'
  | 'follow_up'
  | 'converted'
  | 'lost';

export interface Prospect {
  id: string;
  userId: string;            // Distributeur propriétaire
  name: string;
  phone?: string;
  email?: string;
  status: ProspectStatus;
  notes: string;
  nextContact?: Date;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── WebSocket Messages ───────────────────

export type WsMessageType =
  | 'audio_chunk'
  | 'transcript'
  | 'llm_response'
  | 'audio_response'
  | 'quota_exceeded'
  | 'session_end'
  | 'error';

export interface WsMessage {
  type: WsMessageType;
  payload?: unknown;
}
