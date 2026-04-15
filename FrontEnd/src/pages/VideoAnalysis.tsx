import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Clock, FileText, BarChart3, Info, MapPin, Play, Pause } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { UpgradeModal } from '@/components/UpgradeModal';
import { formatTime, formatPct } from '@/lib/helpers';
import { toast } from 'sonner';
import type { Video, GameEvent, ActionType, VideoStats } from '@/types';

interface AthleteItem {
  id: string;
  name: string;
}

const actionButtons: { type: ActionType; label: string; group: string; style: string }[] = [
  { type: '2PT_MADE', label: '✓ 2PT', group: 'shots', style: 'btn-action-made' },
  { type: '2PT_MISS', label: '✗ 2PT', group: 'shots', style: 'btn-action-miss' },
  { type: '3PT_MADE', label: '✓ 3PT', group: 'shots', style: 'btn-action-made' },
  { type: '3PT_MISS', label: '✗ 3PT', group: 'shots', style: 'btn-action-miss' },
  { type: '1PT_MADE', label: '✓ 1PT', group: 'shots', style: 'btn-action-made' },
  { type: '1PT_MISS', label: '✗ 1PT', group: 'shots', style: 'btn-action-miss' },
  { type: 'REB', label: 'REB', group: 'other', style: 'btn-action-made' },
  { type: 'ASS', label: 'ASS', group: 'other', style: 'btn-action-made' },
  { type: 'RB', label: 'RB', group: 'other', style: 'btn-action-made' },
  { type: 'ERR', label: 'ERR', group: 'other', style: 'btn-action-miss' },
];

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

const VideoAnalysis = () => {
  type TabKey = 'timeline' | 'stats' | 'tactics' | 'info';

  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { player, currentTime, isPlayerReady } = usePlayerStore();
  const [video, setVideo] = useState<Video | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('timeline');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [lastAthleteId, setLastAthleteId] = useState<string | null>(null);
  const [tacticAthleteId, setTacticAthleteId] = useState<string | null>(null);
  const [pendingTacticalNote, setPendingTacticalNote] = useState<string | null>(null);
  const [statsAthleteId, setStatsAthleteId] = useState<string | null>(null);
  const [tacticsAthleteId, setTacticsAthleteId] = useState<string | null>(null);

  // Timer manual para modo presencial (live)
  const [liveTime, setLiveTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLiveMode = video?.context?.analysisMode === 'presencial' || video?.source.type === 'live';
  const athletes: AthleteItem[] = video?.context?.athletes || [];
  const isMultiAthlete = video?.context?.scope === 'multi atleta';
  const analysisType = video?.context?.analysisType;
  const showStatisticalAnalysis = analysisType !== 'tática';
  const showTacticalAnalysis = analysisType !== 'estatística';
  // Em modo presencial, o timestamp vem do timer manual;
  // em modo vídeo, vem do player do YouTube
  const activeTimestamp = isLiveMode ? liveTime : currentTime;
  // Botões ficam habilitados se: modo presencial (sempre) ou player pronto, e não concluído
  const isCompleted = video?.analysisStatus === 'completed';
  const canRegister = (isLiveMode ? true : isPlayerReady) && !isCompleted && (!isMultiAthlete || athletes.length > 0);

  // Gerenciar timer manual do modo presencial
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setLiveTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  useEffect(() => {
    if (!showStatisticalAnalysis) {
      setPendingAction(null);
    }
  }, [showStatisticalAnalysis]);

  useEffect(() => {
    if (!showTacticalAnalysis) {
      setPendingTacticalNote(null);
      setTacticAthleteId(null);
    }
  }, [showTacticalAnalysis]);

  useEffect(() => {
    if (activeTab === 'stats' && !showStatisticalAnalysis) {
      setActiveTab('timeline');
    }
    if (activeTab === 'tactics' && !showTacticalAnalysis) {
      setActiveTab('timeline');
    }
  }, [activeTab, showStatisticalAnalysis, showTacticalAnalysis]);

  const fetchStats = useCallback(async () => {
    if (!videoId) return;
    try {
      const res = await api.get(`/stats/videos/${videoId}`);
      setStats(res.data.data);
    } catch {}
  }, [videoId]);

  useEffect(() => {
    if (!videoId) return;
    const fetch = async () => {
      try {
        const [vRes, sRes] = await Promise.allSettled([
          api.get(`/videos/${videoId}`),
          api.get(`/stats/videos/${videoId}`),
        ]);
        if (vRes.status === 'fulfilled') {
          setVideo(vRes.value.data.data.video);
          setEvents(vRes.value.data.data.events || []);
        }
        if (sRes.status === 'fulfilled') setStats(sRes.value.data.data);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetch();
  }, [videoId]);

  const handleRegister = useCallback(async (actionType: ActionType, athlete?: AthleteItem) => {
    if (!videoId) return;
    const timestamp = isLiveMode ? liveTime : (player?.getCurrentTime() ?? 0);

    if (isMultiAthlete && (!athlete || !athlete.id || !athlete.name)) {
      toast.error('Selecione um atleta para registrar esta ação');
      return;
    }

    try {
      const res = await api.post('/analysis/events', {
        videoId,
        videoTimestampSeconds: timestamp,
        category: 'stat',
        actionType,
        athleteId: athlete?.id,
        athleteName: athlete?.name,
      });
      setEvents((prev) => [...prev, res.data.data].sort((a, b) => a.videoTimestampSeconds - b.videoTimestampSeconds));
      toast.success(`✓ ${actionType} em ${formatTime(timestamp)}`);
      if (athlete?.id) {
        setLastAthleteId(athlete.id);
      }
      setPendingAction(null);
      fetchStats();
    } catch (err: any) {
      if (err.response?.data?.code === 'EVENT_LIMIT_REACHED') {
        setUpgradeOpen(true);
      } else {
        toast.error(getErrorMessage(err));
      }
    }
  }, [isLiveMode, liveTime, player, videoId, fetchStats, isMultiAthlete]);

  const handleActionClick = (actionType: ActionType) => {
    if (isMultiAthlete) {
      if (athletes.length === 0) {
        toast.error('Adicione atletas para iniciar a análise multi atleta');
        return;
      }
      setPendingAction(actionType);
      return;
    }

    handleRegister(actionType);
  };

  const handleAthleteClick = (athlete: AthleteItem) => {
    if (!pendingAction) {
      toast.info('Selecione uma ação antes de escolher o atleta');
      return;
    }

    handleRegister(pendingAction, athlete);
  };

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

  const submitAnnotation = async (noteText: string, athlete?: AthleteItem) => {
    if (!videoId) return;
    const timestamp = isLiveMode ? liveTime : (player?.getCurrentTime() ?? 0);
    try {
      const res = await api.post('/analysis/events', {
        videoId,
        videoTimestampSeconds: timestamp,
        category: 'annotation',
        note: noteText,
        athleteId: athlete?.id,
        athleteName: athlete?.name,
      });
      setEvents((prev) => [...prev, res.data.data].sort((a, b) => a.videoTimestampSeconds - b.videoTimestampSeconds));
      setNote('');
      setPendingTacticalNote(null);
      setTacticAthleteId(null);
      toast.success(`Anotação em ${formatTime(timestamp)}`);
    } catch (err: any) {
      if (err.response?.data?.code === 'EVENT_LIMIT_REACHED') {
        setUpgradeOpen(true);
      } else {
        toast.error(getErrorMessage(err));
      }
    }
  };

  const handleAnnotation = async () => {
    if (!note.trim() || !videoId) return;

    if (showTacticalAnalysis && isMultiAthlete) {
      setPendingTacticalNote(note.trim());
      toast.info('Agora selecione o atleta em "Atletas da partida" para atribuir a anotação');
      return;
    }

    await submitAnnotation(note.trim());
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await api.delete(`/analysis/events/${eventId}`);
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      toast.success('Registro removido');
      fetchStats();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleFinalizeVideo = async () => {
    if (!video) return;
    const newStatus = video.analysisStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.patch(`/videos/${videoId}`, { analysisStatus: newStatus });
      setVideo({ ...video, analysisStatus: newStatus });
      toast.success(newStatus === 'completed' ? 'Partida finalizada e enviada para a carreira!' : 'Partida reaberta p/ edição.');
      if (newStatus === 'completed') {
        navigate('/');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleSeek = (seconds: number) => {
    if (!player) return;
    const target = Math.max(0, seconds - 10);
    player.seekTo(target, true);
    player.playVideo();
  };

  const filteredEvents = events.filter((e) => {
    if (filterCat === 'all') return true;
    return e.category === filterCat;
  });

  const filteredTacticalEvents = events.filter((e) => {
    if (e.category !== 'annotation') return false;
    if (!tacticsAthleteId) return true;
    return e.athleteId === tacticsAthleteId;
  });

  if (loading) {
    return <div className="p-6 lg:p-8 animate-pulse"><div className="h-96 glass-card" /></div>;
  }

  if (!video) {
    return <div className="p-6 lg:p-8 text-center text-text-secondary">Vídeo não encontrado.</div>;
  }

  const tabs: { key: TabKey; label: string; shortLabel: string; icon: typeof Clock }[] = [
    { key: 'timeline', label: 'Linha do tempo', shortLabel: 'Linha', icon: Clock },
    ...(showStatisticalAnalysis ? [{ key: 'stats' as TabKey, label: 'Estatísticas', shortLabel: 'Stats', icon: BarChart3 }] : []),
    ...(showTacticalAnalysis ? [{ key: 'tactics' as TabKey, label: 'Táticas', shortLabel: 'Táticas', icon: FileText }] : []),
    { key: 'info', label: 'Informações', shortLabel: 'Info', icon: Info },
  ];

  const ytId = video.source.videoId;

  return (
    <div className="px-4 pt-4 pb-2 max-w-[1600px] mx-auto animate-fade-in flex flex-col min-h-screen lg:h-[100dvh] lg:px-6 lg:pt-6 lg:pb-3">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-xl font-bold text-foreground truncate pr-4">{video.title}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleFinalizeVideo}
            className={`flex items-center justify-center min-w-[140px] gap-2 text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
              video.analysisStatus === 'completed' 
                ? 'bg-elevated border border-border text-text-secondary hover:text-foreground hover:border-primary/50' 
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            {video.analysisStatus === 'completed' ? 'Editar' : 'Finalizar'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Left: Player + Controls */}
        <div className="flex-[3] min-w-0 flex flex-col gap-3 min-h-0">
          {/* Player ou painel presencial */}
          {isLiveMode ? (
            <div className="glass-card p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4 flex-none min-h-[220px] sm:min-h-[260px] justify-center">
              <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Análise Presencial</span>
              </div>
              <div className="text-4xl sm:text-5xl leading-none font-mono font-bold text-foreground tabular-nums shrink-0">
                {formatTime(liveTime)}
              </div>
              <div className="w-full max-w-sm grid grid-cols-2 gap-2 shrink-0">
                <button
                  onClick={() => setTimerRunning((r) => !r)}
                  className={`inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    timerRunning
                      ? 'bg-warning/10 text-warning border-warning/40 hover:bg-warning/20'
                      : 'bg-primary text-primary-foreground border-primary hover:opacity-90'
                  }`}
                >
                  {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {timerRunning ? 'Pausar' : 'Iniciar'}
                </button>
                <button
                  onClick={() => { setLiveTime(0); setTimerRunning(false); }}
                  className="inline-flex items-center justify-center w-full px-5 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:border-primary/50 hover:bg-elevated transition-colors"
                >
                  Resetar
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center px-2 sm:px-0">
                Inicie o cronômetro e use os botões abaixo para registrar eventos no tempo real do jogo.
              </p>
            </div>
          ) : (
            ytId ? (
              <div className="w-full h-48 sm:h-64 md:h-96 lg:flex-1 lg:min-h-0 bg-black rounded-lg overflow-hidden flex flex-col relative">
                <YouTubePlayer videoId={ytId} />
              </div>
            ) : (
              <div className="flex-1 min-h-0 glass-card flex items-center justify-center text-muted-foreground rounded-lg">
                Player não disponível para esta fonte
              </div>
            )
          )}

          {/* Time indicator */}
          <div className="flex items-center gap-2 text-sm shrink-0">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-foreground font-mono font-medium">{formatTime(activeTimestamp)}</span>
          </div>

          {/* Analysis panels */}
          <div className="space-y-3 shrink-0">
            {isMultiAthlete && (
              <div className="glass-card p-3">
                <p className="text-sm font-medium text-foreground">Atletas da partida</p>
                <p className="text-xs text-text-secondary mb-2">
                  {showStatisticalAnalysis && !showTacticalAnalysis
                    ? 'Selecione uma ação estatística e depois toque no atleta correspondente.'
                    : showTacticalAnalysis && !showStatisticalAnalysis
                    ? 'Digite a anotação, clique em Registrar e depois selecione o atleta.'
                    : 'Use para atribuir anotações táticas ou estatísticas ao devido jogador.'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {athletes.map((athlete) => {
                    const canAssignTactical = showTacticalAnalysis && !!pendingTacticalNote && canRegister;
                    const canAssignStat = showStatisticalAnalysis && !!pendingAction && canRegister;
                    const canClickAthlete = canRegister;
                    const isSelected =
                      (showStatisticalAnalysis && !!pendingAction && lastAthleteId === athlete.id) ||
                      (showTacticalAnalysis && !!pendingTacticalNote && tacticAthleteId === athlete.id);

                    return (
                      <button
                        key={athlete.id}
                        type="button"
                        onClick={async () => {
                          if (canAssignStat) {
                            handleAthleteClick(athlete);
                            return;
                          }

                          if (canAssignTactical && pendingTacticalNote) {
                            setTacticAthleteId(athlete.id);
                            await submitAnnotation(pendingTacticalNote, athlete);
                            return;
                          }

                          if (showTacticalAnalysis) {
                            toast.info('Digite a anotação e clique em Registrar antes de escolher o atleta');
                          } else {
                            toast.info('Selecione uma ação antes de escolher o atleta');
                          }
                        }}
                        disabled={!canRegister}
                        className={`rounded-lg border px-3 py-2 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-card text-foreground hover:border-primary/60'
                        } ${!canClickAthlete ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="text-sm font-medium truncate">{athlete.name}</div>
                        {canAssignStat && (
                          <div className="text-[11px] text-text-secondary">
                            Registrar {pendingAction}
                          </div>
                        )}
                        {canAssignTactical && (
                          <div className="text-[11px] text-text-secondary">Atribuir anotação tática</div>
                        )}
                        {!canAssignStat && !canAssignTactical && (
                          <div className="text-[11px] text-text-secondary">
                            {showTacticalAnalysis ? 'Aguardando clique em Registrar' : 'Selecione uma ação'}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showStatisticalAnalysis && (
              <div className="glass-card p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Análise Estatística</p>
                  {pendingAction && isMultiAthlete && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      Ação ativa: {pendingAction}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-2 font-medium">Arremessos</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {actionButtons.filter((b) => b.group === 'shots').map((btn) => (
                      <button
                        key={btn.type}
                        onClick={() => handleActionClick(btn.type)}
                        disabled={!canRegister}
                        className={`${btn.style} disabled:opacity-30 disabled:cursor-not-allowed ${pendingAction === btn.type ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-2 font-medium">Outros</p>
                  <div className="grid grid-cols-4 gap-2">
                    {actionButtons.filter((b) => b.group === 'other').map((btn) => (
                      <button
                        key={btn.type}
                        onClick={() => handleActionClick(btn.type)}
                        disabled={!canRegister}
                        className={`${btn.style} disabled:opacity-30 disabled:cursor-not-allowed ${pendingAction === btn.type ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showTacticalAnalysis && (
              <div className="glass-card p-3 space-y-2">
                <p className="text-sm font-semibold text-foreground">Análise Tática</p>
                <p className="text-xs text-text-secondary">Campo dedicado para anotações táticas da partida.</p>
                <div className="flex gap-2">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anotação tática..."
                    disabled={!canRegister}
                    className="flex-1 px-3 py-2 rounded-lg bg-elevated border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-sm disabled:opacity-30"
                    onKeyDown={(e) => e.key === 'Enter' && handleAnnotation()}
                  />
                  <button
                    onClick={handleAnnotation}
                    disabled={!canRegister || !note.trim()}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-30"
                  >
                    Registrar
                  </button>
                </div>


              </div>
            )}


          </div>
        </div>

        {/* Right: Timeline */}
        <div className="flex-[2] min-w-0 flex flex-col min-h-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border mb-4 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-2.5 text-xs sm:gap-1.5 sm:px-3 sm:text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-foreground'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>

          {activeTab === 'timeline' && (
            <div className="flex flex-col flex-1 min-h-0 space-y-3 overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <p className="text-sm text-text-secondary">Registros ({events.length})</p>
                <div className="flex gap-1">
                  {['all', 'stat', 'annotation'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setFilterCat(c)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${filterCat === c ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {c === 'all' ? 'Todos' : c === 'stat' ? 'Estatísticas' : 'Notas'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                {filteredEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">Nenhum registro ainda</p>
                ) : (
                  filteredEvents.slice().reverse().map((ev) => (
                    <div
                      key={ev._id}
                      className="glass-card flex items-start gap-3 p-3 rounded-lg hover:bg-elevated/50 transition-colors group cursor-pointer"
                      onClick={() => handleSeek(ev.videoTimestampSeconds)}
                    >
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded shrink-0 mt-0.5">
                        {formatTime(ev.videoTimestampSeconds)}
                      </span>
                      <div className="flex-1 min-w-0">
                        {ev.category === 'annotation' ? (
                          <p className="text-sm text-foreground">{ev.note}</p>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-sm text-foreground font-medium">{ev.actionType?.includes('MADE') ? '✓' : ev.actionType?.includes('MISS') ? '✗' : ''} {ev.actionType}</p>
                            {ev.athleteName && (
                              <span className="inline-flex items-center rounded-full bg-elevated px-2 py-0.5 text-[11px] text-text-secondary">
                                {ev.athleteName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!isCompleted && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(ev._id); }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {showStatisticalAnalysis && activeTab === 'stats' && (
            <div className="glass-card p-4 overflow-y-auto flex-1 min-h-0 flex flex-col">
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

          {showTacticalAnalysis && activeTab === 'tactics' && (
            <div className="glass-card p-4 overflow-y-auto flex-1 min-h-0 flex flex-col">
              {isMultiAthlete && (
                <div className="mb-4 pb-4 border-b border-border">
                  <p className="text-xs font-medium text-text-secondary mb-2">Atleta</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <button
                      onClick={() => setTacticsAthleteId(null)}
                      className={`rounded-lg border px-3 py-2 text-left transition-all text-sm ${
                        tacticsAthleteId === null
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/60'
                      }`}
                    >
                      <div className="font-medium truncate">Todos</div>
                    </button>
                    {athletes.map((athlete) => (
                      <button
                        key={athlete.id}
                        onClick={() => setTacticsAthleteId(athlete.id)}
                        className={`rounded-lg border px-3 py-2 text-left transition-all text-sm ${
                          tacticsAthleteId === athlete.id
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
                {filteredTacticalEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">Sem anotações táticas</p>
                ) : (
                  filteredTacticalEvents.slice().reverse().map((ev) => (
                    <div
                      key={ev._id}
                      className="glass-card flex items-start gap-3 p-3 rounded-lg hover:bg-elevated/50 transition-colors cursor-pointer"
                      onClick={() => handleSeek(ev.videoTimestampSeconds)}
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

          {activeTab === 'info' && (
            <div className="glass-card p-4 space-y-3 text-sm overflow-y-auto flex-1 min-h-0">
              <div>
                <span className="text-text-secondary">Título:</span>
                <span className="text-foreground ml-2">{video.title}</span>
              </div>
              {video.context?.eventType && (
                <div>
                  <span className="text-text-secondary">Tipo:</span>
                  <span className="text-foreground ml-2">{formatContextValue(video.context.eventType)}</span>
                </div>
              )}
              {video.context?.analysisType && (
                <div>
                  <span className="text-text-secondary">Análise:</span>
                  <span className="text-foreground ml-2">{formatContextValue(video.context.analysisType)}</span>
                </div>
              )}
              {video.context?.scope && (
                <div>
                  <span className="text-text-secondary">Escopo:</span>
                  <span className="text-foreground ml-2">{formatContextValue(video.context.scope)}</span>
                </div>
              )}
              {video.context?.gameType && (
                <div>
                  <span className="text-text-secondary">Tipo de partida:</span>
                  <span className="text-foreground ml-2">{formatContextValue(video.context.gameType)}</span>
                </div>
              )}
              {video.context?.analysisMode && (
                <div>
                  <span className="text-text-secondary">Modo:</span>
                  <span className="text-foreground ml-2">{formatContextValue(video.context.analysisMode)}</span>
                </div>
              )}
              {video.context?.athletes?.length ? (
                <div>
                  <span className="text-text-secondary block mb-1">Atletas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {video.context.athletes.map((athlete) => (
                      <span key={athlete.id} className="px-2 py-0.5 rounded-full bg-elevated text-xs text-text-secondary">
                        {athlete.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {video.context?.opponent && (
                <div>
                  <span className="text-text-secondary">Adversário:</span>
                  <span className="text-foreground ml-2">{video.context.opponent}</span>
                </div>
              )}
              {video.tags?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {video.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-elevated text-xs text-text-secondary">{t}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        message="A geração de vídeo de melhores momentos está disponível apenas no plano Pro."
      />
    </div>
  );
};

export default VideoAnalysis;
