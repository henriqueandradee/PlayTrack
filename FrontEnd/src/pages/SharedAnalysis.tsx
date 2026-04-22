import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Clock, Info, LogIn, MapPin, ChevronRight, ArrowRight, BarChart3, FileText } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { formatTime, formatPct } from '@/lib/helpers';
import type { Video, GameEvent } from '@/types';

interface AthleteItem {
  id: string;
  name: string;
}

const contextValueLabels: Record<string, string> = {
  game: 'Jogo',
  study: 'Estudo',
  training: 'Treino',
  other: 'Outro',
  athlete: 'Atleta',
  'multi athlete': 'Vários atletas',
  'multi atleta': 'Vários atletas',
  team: 'Time completo',
  meu_time: 'Meu Time',
  outro_time: 'Outro Time',
  tactical: 'Tática',
  statistical: 'Estatística',
  both: 'Ambos',
  live: 'Presencial',
};

const formatContextValue = (value?: string) => {
  if (!value) return '';
  const normalized = value.toLowerCase().trim();
  return contextValueLabels[normalized] || value;
};

const SharedAnalysis = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { player } = usePlayerStore();

  const [video, setVideo] = useState<Video | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  type TabKey = 'timeline' | 'stats' | 'tactics';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabKey>('timeline');
  const [statsAthleteId, setStatsAthleteId] = useState<string | null>(null);

  const isLiveMode = video?.context?.analysisMode === 'presencial' || video?.source.type === 'live';
  const analysisType = video?.context?.analysisType;
  const showStatisticalAnalysis = analysisType !== 'tática';
  const showTacticalAnalysis = analysisType !== 'estatística';
  const athletes: AthleteItem[] = video?.context?.athletes || [];
  const isMultiAthlete = ['meu_time', 'outro_time', 'multi atleta', 'time'].includes(video?.context?.scope || '');

  useEffect(() => {
    if (activeTab === 'stats' && !showStatisticalAnalysis) {
      setActiveTab('timeline');
    }
  }, [activeTab, showStatisticalAnalysis]);

  useEffect(() => {
    if (!token) {
      setError('Token inválido');
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const res = await api.get(`/sharing/validate/${token}`);
        const metadata = res.data.data;
        setVideo(metadata);

        const eventsRes = await api.get('/analysis/events', {
          params: {
            videoId: metadata.videoId,
            shareToken: token,
          },
        });
        setEvents(eventsRes.data.data || []);
      } catch (err) {
        setError('Análise não encontrada ou link expirado');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [token]);

  const filteredEvents = events.filter((e) => {
    if (filterCat === 'all') return true;
    return e.category === filterCat;
  });

  const computeStatsForAthlete = (athleteId: string | null) => {
    const filterEvents = athleteId
      ? events.filter(e => e.category === 'stat' && e.athleteId === athleteId)
      : events.filter(e => e.category === 'stat');

    const agg = {
      pts: 0, fgm: 0, fga: 0, ftm: 0, fta: 0,
      '2ptm': 0, '2pta': 0, '3ptm': 0, '3pta': 0,
      reb: 0, ass: 0, rb: 0, err: 0,
    };

    for (const event of filterEvents) {
      const v = event.value || 1;
      switch (event.actionType) {
        case '1PT_MADE': agg.ftm += v; agg.fta += v; break;
        case '1PT_MISS': agg.fta += v; break;
        case '2PT_MADE': agg['2ptm'] += v; agg['2pta'] += v; break;
        case '2PT_MISS': agg['2pta'] += v; break;
        case '3PT_MADE': agg['3ptm'] += v; agg['3pta'] += v; break;
        case '3PT_MISS': agg['3pta'] += v; break;
        case 'REB': agg.reb += v; break;
        case 'ASS': agg.ass += v; break;
        case 'RB': agg.rb += v; break;
        case 'ERR': agg.err += v; break;
      }
    }

    agg.fgm = agg['2ptm'] + agg['3ptm'];
    agg.fga = agg['2pta'] + agg['3pta'];
    agg.pts = (agg.ftm * 1) + (agg['2ptm'] * 2) + (agg['3ptm'] * 3);

    const safeDiv = (n: number, d: number) => d === 0 ? 0 : parseFloat((n / d).toFixed(4));

    return {
      aggregates: agg,
      computed: {
        fg_pct: safeDiv(agg.fgm, agg.fga),
        two_pt_pct: safeDiv(agg['2ptm'], agg['2pta']),
        three_pt_pct: safeDiv(agg['3ptm'], agg['3pta']),
        ft_pct: safeDiv(agg.ftm, agg.fta),
        eff: (agg.pts + agg.reb + agg.ass + agg.rb) - ((agg.fga - agg.fgm) + (agg.fta - agg.ftm) + agg.err),
      }
    };
  };

  const tabs: { key: TabKey; label: string; shortLabel: string; icon: typeof Clock }[] = [
    { key: 'timeline', label: 'Timeline', shortLabel: 'Timeline', icon: Clock },
    ...(showStatisticalAnalysis ? [{ key: 'stats' as TabKey, label: 'Box-Score', shortLabel: 'Box-Score', icon: BarChart3 }] : []),
    ...(showTacticalAnalysis ? [{ key: 'tactics' as TabKey, label: 'Táticas', shortLabel: 'Táticas', icon: FileText as any }] : []),
  ];

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Carregando análise...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-8 text-center max-w-md mx-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Info className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-foreground font-medium mb-2">Link inválido ou expirado</p>
          <p className="text-text-secondary text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  // ── Not found state ──
  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Análise não encontrada</p>
      </div>
    );
  }

  const ytId = video.source?.videoId;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Logo + App name */}
          <button
            onClick={() => navigate(user ? '/videos' : '/login')}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <img src="/logo.png" alt="PlayTrack" className="h-8 w-8 object-contain group-hover:scale-105 transition-transform" />
            <span className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">PlayTrack</span>
          </button>

          {/* Right: Login or Back to app */}
          {!user ? (
            <button
              onClick={() => navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all shrink-0"
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Entrar</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/videos')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-elevated border border-border text-foreground text-sm font-medium hover:border-primary/50 hover:text-primary transition-all shrink-0"
            >
              <span>Voltar ao app</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left: Player + Info ── */}
          <div className="flex-[3] min-w-0 flex flex-col gap-4">
            {/* Player */}
            {video.source.type === 'youtube' && ytId ? (
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
                <YouTubePlayer videoId={ytId} />
              </div>
            ) : isLiveMode ? (
              <div className="glass-card p-6 flex flex-col items-center gap-3 min-h-[200px] justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">Análise Presencial</span>
                </div>
                <p className="text-xs text-text-secondary text-center max-w-sm">
                  Esta é uma análise presencial. Os eventos são marcados pelo cronômetro manual do treinador.
                </p>
              </div>
            ) : null}

            {/* Metadata card */}
            <div className="glass-card p-4 sm:p-5 space-y-3 text-sm">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Informações da Análise
              </h3>
              <div>
                <h2 className="text-lg font-bold text-foreground">{video.title}</h2>
                {video.description && (
                  <p className="text-sm text-text-secondary mt-0.5">{video.description}</p>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                {video.context?.analysisType && (
                  <div>
                    <p className="text-xs text-text-secondary mb-0.5">Tipo de Análise</p>
                    <p className="text-foreground font-medium">{formatContextValue(video.context.analysisType)}</p>
                  </div>
                )}
                {video.context?.scope && (
                  <div>
                    <p className="text-xs text-text-secondary mb-0.5">Escopo</p>
                    <p className="text-foreground font-medium">{formatContextValue(video.context.scope)}</p>
                  </div>
                )}
                {video.context?.gameType && (
                  <div>
                    <p className="text-xs text-text-secondary mb-0.5">Tipo de Jogo</p>
                    <p className="text-foreground font-medium">{formatContextValue(video.context.gameType)}</p>
                  </div>
                )}

                {video.context?.opponent && (
                  <div>
                    <p className="text-xs text-text-secondary mb-0.5">Adversário</p>
                    <p className="text-foreground font-medium">{video.context.opponent}</p>
                  </div>
                )}
                {video.context?.location && (
                  <div>
                    <p className="text-xs text-text-secondary mb-0.5">Local</p>
                    <p className="text-foreground font-medium">{video.context.location}</p>
                  </div>
                )}
              </div>
              {video.context?.athletes?.length ? (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-text-secondary mb-2">Atletas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {video.context.athletes.map((athlete: AthleteItem) => (
                      <span key={athlete.id} className="px-2.5 py-1 rounded-full bg-elevated text-xs text-text-secondary border border-border">
                        {athlete.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Right: Tabs ── */}
          <div className="flex-[2] min-w-0 flex flex-col min-h-0">
            <div className="glass-card flex flex-col lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]">
              {/* Tabs */}
              <div className="flex border-b border-border shrink-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1 px-4 py-3 text-xs sm:gap-1.5 sm:px-4 sm:text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-foreground'
                      }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.shortLabel}</span>
                  </button>
                ))}
              </div>

              {activeTab === 'timeline' && (
                <div className="flex flex-col flex-1 min-h-0 p-4">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <p className="text-sm text-text-secondary">Registros ({events.length})</p>
                  </div>

                  {filteredEvents.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center py-12">
                      <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
                      {filteredEvents.map((event) => (
                        <div
                          key={event._id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-elevated/50 border border-border/50 hover:border-primary/30 hover:bg-elevated transition-all cursor-pointer group"
                          onClick={() => {
                            if (!isLiveMode && player) {
                              const target = Math.max(0, event.videoTimestampSeconds - 10);
                              player.seekTo(target, true);
                              player.playVideo();
                            }
                          }}
                        >
                          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded shrink-0 mt-0.5">
                            {formatTime(event.videoTimestampSeconds)}
                          </span>
                          <div className="flex-1 min-w-0">
                            {event.category === 'annotation' ? (
                              <p className="text-sm text-foreground">{event.note}</p>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-sm text-foreground font-medium">
                                  {event.actionType?.includes('MADE') ? '✓' : event.actionType?.includes('MISS') ? '✗' : ''} {event.actionType}
                                </p>
                              </div>
                            )}
                            {event.athleteName && (
                              <span className="inline-flex items-center rounded-full bg-elevated px-2 py-0.5 text-[11px] text-text-secondary mt-1">
                                {event.athleteName}
                              </span>
                            )}
                            {event.note && event.category !== 'annotation' && (
                              <p className="text-xs text-muted-foreground mt-1 italic">{event.note}</p>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tactics' && showTacticalAnalysis && (
                <div className="flex flex-col flex-1 min-h-0 p-4 overflow-y-auto">
                  {isMultiAthlete && (
                    <div className="mb-4 pb-4 border-b border-border">
                      <p className="text-xs font-medium text-text-secondary mb-2">Atleta</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <button
                          onClick={() => setStatsAthleteId(null)}
                          className={`rounded-lg border px-3 py-2 text-left transition-all text-sm ${
                            statsAthleteId === null
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border bg-card text-foreground hover:border-primary/60'
                          }`}
                        >
                          <div className="font-medium truncate">Todos</div>
                        </button>
                        {athletes.map((athlete) => (
                          <button
                            key={athlete.id}
                            onClick={() => setStatsAthleteId(athlete.id)}
                            className={`rounded-lg border px-3 py-2 text-left transition-all text-sm ${
                              statsAthleteId === athlete.id
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border bg-card text-foreground hover:border-primary/60'
                            }`}
                          >
                            <div className="font-medium truncate">{athlete.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                    {events.filter(e => e.category === 'annotation' && (!statsAthleteId || e.athleteId === statsAthleteId)).length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-8">Sem anotações táticas</p>
                    ) : (
                      events.filter(e => e.category === 'annotation' && (!statsAthleteId || e.athleteId === statsAthleteId)).slice().reverse().map((ev) => (
                        <div
                          key={ev._id}
                          className="glass-card flex items-start gap-3 p-3 rounded-lg hover:bg-elevated/50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (!isLiveMode && player) {
                              const target = Math.max(0, ev.videoTimestampSeconds - 10);
                              player.seekTo(target, true);
                              player.playVideo();
                            }
                          }}
                        >
                          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded shrink-0 mt-0.5">
                            {formatTime(ev.videoTimestampSeconds)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{ev.note}</p>
                            {ev.athleteName && (
                              <span className="inline-flex items-center rounded-full bg-elevated px-2 py-0.5 text-[11px] text-text-secondary mt-1">
                                {ev.athleteName}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && showStatisticalAnalysis && (
                <div className="flex flex-col flex-1 min-h-0 p-4 overflow-y-auto">
                  {isMultiAthlete && (
                    <div className="mb-4 pb-4 border-b border-border">
                      <p className="text-xs font-medium text-text-secondary mb-2">Atleta</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <button
                          onClick={() => setStatsAthleteId(null)}
                          className={`rounded-lg border px-3 py-2 text-left transition-all text-sm ${statsAthleteId === null
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border bg-card text-foreground hover:border-primary/60'
                            }`}
                        >
                          <div className="font-medium truncate">Todos</div>
                        </button>
                        {athletes.map((athlete) => (
                          <button
                            key={athlete.id}
                            onClick={() => setStatsAthleteId(athlete.id)}
                            className={`rounded-lg border px-3 py-2 text-left transition-all text-sm ${statsAthleteId === athlete.id
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border bg-card text-foreground hover:border-primary/60'
                              }`}
                          >
                            <div className="font-medium truncate">{athlete.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {(() => {
                    const computedStats = computeStatsForAthlete(statsAthleteId);
                    const stats = computedStats;
                    return (
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-border">
                          {[
                            ['Pontos', stats.aggregates.pts],
                            ['Arremesso de Quadra', <span><span className="text-xs text-muted-foreground mr-1">({stats.aggregates.fgm}/{stats.aggregates.fga})</span> {formatPct(stats.computed.fg_pct)}</span>],
                            ['Arremesso de 2 Pontos', <span><span className="text-xs text-muted-foreground mr-1">({stats.aggregates['2ptm']}/{stats.aggregates['2pta']})</span> {formatPct(stats.computed.two_pt_pct)}</span>],
                            ['Arremesso de 3 Pontos', <span><span className="text-xs text-muted-foreground mr-1">({stats.aggregates['3ptm']}/{stats.aggregates['3pta']})</span> {formatPct(stats.computed.three_pt_pct)}</span>],
                            ['Lances Livres', <span><span className="text-xs text-muted-foreground mr-1">({stats.aggregates.ftm}/{stats.aggregates.fta})</span> {formatPct(stats.computed.ft_pct)}</span>],
                            ['Rebotes', stats.aggregates.reb],
                            ['Assistências', stats.aggregates.ass],
                            ['Roubos de Bola', stats.aggregates.rb],
                            ['Erros', stats.aggregates.err],
                            ['Eficiência', stats.computed.eff || 0],
                          ].map(([label, value]) => (
                            <tr key={label as string} className="py-1">
                              <td className="py-2 text-text-secondary">{label}</td>
                              <td className="py-2 text-foreground font-medium text-right">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA Footer ── */}
      {!user && (
        <div className="border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Quer analisar seus próprios jogos?</p>
              <p className="text-xs text-text-secondary">Crie sua conta gratuita no PlayTrack e comece agora.</p>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all shrink-0"
            >
              Criar conta grátis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedAnalysis;
