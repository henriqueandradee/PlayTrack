import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Clock, Info, LogIn, MapPin, ChevronRight, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { formatTime } from '@/lib/helpers';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');

  const isLiveMode = video?.context?.analysisMode === 'presencial' || video?.source.type === 'live';

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
            onClick={() => navigate(user ? '/dashboard' : '/login')}
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
              onClick={() => navigate('/dashboard')}
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

          {/* ── Right: Timeline ── */}
          <div className="flex-[2] min-w-0 flex flex-col min-h-0">
            <div className="glass-card p-4 flex flex-col lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Timeline de Eventos
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {events.length} registro{events.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Filters */}
              <div className="flex gap-1 mb-3 shrink-0">
                {['all', 'stat', 'annotation'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilterCat(c)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      filterCat === c
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-elevated'
                    }`}
                  >
                    {c === 'all' ? 'Todos' : c === 'stat' ? 'Estatísticas' : 'Notas'}
                  </button>
                ))}
              </div>

              {/* Events list */}
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
