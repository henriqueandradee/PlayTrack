export interface User {
  id: string;
  username: string;
  email: string;
  plan: 'free' | 'pro';
  usage: { videoCount: number };
}

export interface VideoSource {
  type: 'youtube' | 'live';
  videoId: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

export interface VideoContext {
  sport: string;
  analysisType?: 'estatística' | 'tática' | 'ambos';
  scope?: 'eu' | 'outro atleta' | 'multi atleta' | 'time';
  gameType?: 'jogo' | 'estudo';
  analysisMode?: 'presencial' | 'YouTube';
  eventType?: 'game' | 'training' | 'study' | 'other';
  athletes?: { id: string; name: string }[];
  opponent?: string;
  location?: string;
}

export interface Video {
  _id: string;
  userId: string;
  title: string;
  description: string;
  source: VideoSource;
  context: VideoContext;
  analysisStatus: 'pending' | 'completed';
  eventCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ActionType =
  | '1PT_MADE' | '1PT_MISS'
  | '2PT_MADE' | '2PT_MISS'
  | '3PT_MADE' | '3PT_MISS'
  | 'REB' | 'ASS' | 'RB' | 'ERR';

export type EventCategory = 'stat' | 'annotation' | 'tactic' | 'custom';

export interface GameEvent {
  _id: string;
  videoId: string;
  userId: string;
  videoTimestampSeconds: number;
  category: EventCategory;
  actionType?: ActionType;
  athleteId?: string;
  athleteName?: string;
  value: number;
  note?: string;
  meta?: Record<string, unknown>;
  deletedAt: null | string;
  createdAt: string;
}

export interface VideoStats {
  _id: string;
  videoId: string;
  videosAnalyzed?: number;
  aggregates: {
    pts: number; fgm: number; fga: number;
    ftm: number; fta: number;
    '2ptm': number; '2pta': number;
    '3ptm': number; '3pta': number;
    reb: number; ass: number; rb: number; err: number;
  };
  computed: {
    fg_pct: number;
    two_pt_pct: number;
    three_pt_pct: number;
    ft_pct: number;
    eff: number;
  };
  computedAt: string;
}

export interface SubscriptionStatus {
  plan: { type: 'free' | 'pro'; isPro: boolean; expiresAt: string | null };
  usage: {
    videoCount: number;
    maxVideos: number | null;
    maxEventsPerVideo: number | null;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string;
    canceledAt: string | null;
  } | null;
}
