import { useEffect, useState, useCallback } from 'react';
import { useTourStore } from '@/stores/tourStore';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Video as VideoIcon, X, MapPin, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api, { getErrorMessage } from '@/lib/api';
import type { Video } from '@/types';
import { getYouTubeThumbnail } from '@/lib/helpers';
import { toast } from 'sonner';
import { UpgradeModal } from '@/components/UpgradeModal';

interface Athlete {
  id: string;
  name: string;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-warning/10 text-warning' },
  completed: { label: 'Concluído', className: 'bg-success/10 text-success' },
};

const statusFilters = ['all', 'pending', 'completed'] as const;

const Videos = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // States para Match
  const [matchTitle, setMatchTitle] = useState('');
  const [selectedAnalysisTypes, setSelectedAnalysisTypes] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<'meu_time' | 'outro_time' | ''>('');
  const [analysisMode, setAnalysisMode] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [newAthleteName, setNewAthleteName] = useState('');
  const [createMatchError, setCreateMatchError] = useState('');
  const [createMatchErrors, setCreateMatchErrors] = useState<string[]>([]);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [roster, setRoster] = useState<Athlete[]>([]);
  const [gameAthletes, setGameAthletes] = useState<Athlete[]>([]);

  const canAddVideo = user?.plan === 'pro' || (user?.usage.videoCount ?? 0) < 5;

  useEffect(() => {
    fetchVideos();
    // Fetch roster for management
    api.get('/auth/roster').then((res) => setRoster(res.data.data || [])).catch(() => {});
    // Fetch athletes from completed games for suggestions
    api.get('/stats/athletes-from-games').then((res) => setGameAthletes(res.data.data || [])).catch(() => {});

    // Listen for custom event from Joyride tour
    const handleTourOpenModal = () => {
      if (canAddVideo) {
        setModalOpen(true);
      } else {
        setUpgradeOpen(true);
      }
    };
    window.addEventListener('tour:open-modal', handleTourOpenModal);
    return () => window.removeEventListener('tour:open-modal', handleTourOpenModal);
  }, [canAddVideo]);

  const fetchVideos = async () => {
    try {
      const res = await api.get('/videos?limit=100');
      setVideos(res.data.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  // Funções para gerenciar atletas
  const handleAddAthlete = () => {
    if (!newAthleteName.trim()) {
      toast.error('Digite o nome do atleta');
      return;
    }

    const normalizedName = newAthleteName.trim();
    if (athletes.some((athlete) => athlete.name.toLowerCase() === normalizedName.toLowerCase())) {
      toast.error('Esse atleta já foi adicionado');
      return;
    }

    const newAthlete: Athlete = {
      id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
      name: normalizedName,
    };
    const updatedAthletes = [...athletes, newAthlete];
    setAthletes(updatedAthletes);
    setNewAthleteName('');

    // Auto-sync to roster if meu_time
    if (scope === 'meu_time') {
      const rosterNames = roster.map((a) => a.name.toLowerCase());
      if (!rosterNames.includes(normalizedName.toLowerCase())) {
        const updatedRoster = [...roster, newAthlete];
        setRoster(updatedRoster);
        api.put('/auth/roster', { roster: updatedRoster }).catch(() => {});
      }
    }
  };

  const handleRemoveAthlete = (id: string) => {
    setAthletes(athletes.filter((a) => a.id !== id));
  };

  const validateCreateMatch = useCallback((): boolean => {
    const errors: string[] = [];
    if (!matchTitle.trim()) errors.push('Título é obrigatório');
    if (selectedAnalysisTypes.size === 0) errors.push('Selecione pelo menos um tipo de análise');
    if (!scope) errors.push('Selecione "Meu Time" ou "Outro Time"');
    if (!analysisMode) errors.push('Modo de análise é obrigatório');
    if (analysisMode === 'YouTube' && !youtubeUrl.trim()) {
      errors.push('URL do YouTube é obrigatória para modo YouTube');
    }
    if (analysisMode === 'YouTube' && youtubeUrl.trim()) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/.+/;
      if (!youtubeRegex.test(youtubeUrl)) {
        errors.push('URL do YouTube inválida. Formatos aceitos: youtu.be/VIDEO_ID, youtube.com/watch?v=VIDEO_ID, youtube.com/live/VIDEO_ID, link de compartilhamento ou embed');
      }
    }
    setCreateMatchErrors(errors);
    return errors.length === 0;
  }, [matchTitle, selectedAnalysisTypes, scope, analysisMode, youtubeUrl]);

  const resetForm = () => {
    setMatchTitle('');
    setSelectedAnalysisTypes(new Set());
    setScope('');
    setAnalysisMode('');
    setYoutubeUrl('');
    setAthletes([]);
    setNewAthleteName('');
    setCreateMatchError('');
    setCreateMatchErrors([]);
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMatchError('');
    
    if (!validateCreateMatch()) {
      return;
    }
    
    setCreatingMatch(true);
    try {
      // Criar partida como vídeo com metadados completos
      const derivedAnalysisType = selectedAnalysisTypes.has('estatística') && selectedAnalysisTypes.has('tática')
        ? 'ambos'
        : selectedAnalysisTypes.has('estatística') ? 'estatística' : 'tática';

      const videoPayload: Record<string, unknown> = {
        title: matchTitle.trim(),
        description: '',
        sourceType: analysisMode === 'YouTube' ? 'youtube' : 'live',
        context: {
          sport: 'basketball',
          analysisType: derivedAnalysisType,
          scope,
          gameType: 'jogo',
          analysisMode,
          eventType: 'game',
          athletes: athletes,
        },
      };

      if (analysisMode === 'YouTube') {
        videoPayload.sourceUrl = youtubeUrl.trim();
      }

      const videoRes = await api.post('/videos', videoPayload);
      const videoId = videoRes.data.data._id;
      updateUser({ usage: { videoCount: (user?.usage.videoCount ?? 0) + 1 } });
      
      toast.success('Partida criada com sucesso!');
      setModalOpen(false);
      resetForm();
      
      const { stepIndex, setStepIndex, run } = useTourStore.getState();
      if (run && stepIndex === 3) setStepIndex(4);
      
      // Redirecionar para análise da partida
      setTimeout(() => {
        navigate(`/videos/${videoId}`);
      }, 500);
    } catch (err: any) {
      setCreateMatchError(getErrorMessage(err));
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleDeleteVideo = async (videoId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja apagar esta partida? Todos os registros associados serão perdidos permanentemente.')) return;
    
    try {
      await api.delete(`/videos/${videoId}`);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      updateUser({ usage: { videoCount: Math.max(0, (user?.usage.videoCount ?? 1) - 1) } });
      toast.success('Partida apagada com sucesso!');
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  const filtered = videos.filter((v) => {
    if (statusFilter !== 'all' && v.analysisStatus !== statusFilter) return false;
    if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });


  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Minhas Partidas</h1>
        <button
          id="tour-new-match"
          onClick={() => {
            if (canAddVideo) {
              setModalOpen(true);
            } else {
              setUpgradeOpen(true);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" /> Nova Partida
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-elevated border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-sm"
          />
        </div>
        <div className="flex gap-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-elevated text-text-secondary hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'Todos' : statusLabels[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="glass-card h-48 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium">Nenhuma partida encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((video) => {
            const isLive = video.source.type === 'live';
            const thumb = !isLive && video.source.videoId ? getYouTubeThumbnail(video.source.videoId) : null;
            const status = statusLabels[video.analysisStatus] || statusLabels.pending;
            return (
              <Link
                key={video._id}
                to={`/videos/${video._id}`}
                className="glass-card overflow-hidden hover:border-primary/30 hover:scale-[1.02] transition-all duration-200"
              >
                <div className="aspect-video bg-elevated relative flex items-center justify-center">
                  {thumb
                    ? <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                    : <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <MapPin className="h-8 w-8" />
                        <span className="text-xs">Análise Presencial</span>
                      </div>
                  }
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-foreground truncate flex-1 pr-2">{video.title}</h3>
                    <button
                      onClick={(e) => handleDeleteVideo(video._id, e)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Apagar partida"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                    <span className="text-xs text-muted-foreground">{video.eventCount} registros</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Add Match Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Criar Partida</h2>
                <p className="text-sm text-text-secondary mt-1">Defina os parâmetros básicos da análise</p>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="p-6 space-y-6">
              {createMatchError && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  {createMatchError}
                </div>
              )}

              {createMatchErrors.length > 0 && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm font-medium text-amber-900 mb-2">Corrija os erros abaixo:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {createMatchErrors.map((err, i) => (
                      <li key={i} className="text-sm text-amber-800">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Título da Partida *
                </label>
                <input
                  type="text"
                  value={matchTitle}
                  onChange={(e) => setMatchTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-elevated border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="ex: Final do campeonato"
                />
              </div>

              {/* Tipo de Análise (multi-toggle) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Tipo de Análise *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['estatística', 'tática'].map((type) => {
                    const isSelected = selectedAnalysisTypes.has(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setSelectedAnalysisTypes((prev) => {
                            const next = new Set(prev);
                            if (next.has(type)) next.delete(type);
                            else next.add(type);
                            return next;
                          });
                        }}
                        className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-elevated border border-border text-foreground hover:border-primary'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    );
                  })}
                </div>
                {selectedAnalysisTypes.size === 2 && (
                  <p className="text-xs text-primary mt-1.5">✓ Estatística + Tática selecionados</p>
                )}
              </div>

              {/* Quem analisar */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Quem analisar? *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{value: 'meu_time', label: 'Meu Time'}, {value: 'outro_time', label: 'Outro Time'}].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setScope(opt.value as 'meu_time' | 'outro_time');
                        setAthletes([]);
                        setNewAthleteName('');
                      }}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                        scope === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-elevated border border-border text-foreground hover:border-primary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Atletas (shown for both scopes once selected) */}
              {scope && (
                <div className="p-4 bg-elevated rounded-lg border border-border">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Atletas {scope === 'meu_time' ? 'do Meu Time' : 'do Outro Time'}
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">
                    {scope === 'meu_time'
                      ? 'Adicione os jogadores do seu time. Eles ficam salvos para partidas futuras.'
                      : 'Adicione os jogadores do time adversário para esta partida.'}
                  </p>

                  {/* Game athletes suggestions for meu_time */}
                  {scope === 'meu_time' && gameAthletes.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-text-secondary mb-1.5">Atletas de jogos finalizados (clique para adicionar):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {gameAthletes
                          .filter((r) => !athletes.some((a) => a.id === r.id))
                          .map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                            >
                              <button
                                type="button"
                                onClick={() => setAthletes([...athletes, r])}
                                className="hover:underline"
                              >
                                + {r.name}
                              </button>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Roster management for meu_time */}
                  {scope === 'meu_time' && roster.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-text-secondary mb-1.5">Gerenciar roster salvo (× para remover):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {roster
                          .filter((r) => !athletes.some((a) => a.id === r.id))
                          .map((r) => (
                          <span
                            key={r.id}
                            className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium border border-primary/30"
                          >
                            <button
                              type="button"
                              onClick={() => setAthletes([...athletes, r])}
                              className="hover:underline text-left outline-none"
                            >
                              {r.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedRoster = roster.filter((a) => a.id !== r.id);
                                setRoster(updatedRoster);
                                setAthletes(athletes.filter((a) => a.id !== r.id));
                                api.put('/auth/roster', { roster: updatedRoster }).catch(() => {});
                              }}
                              className="ml-0.5 p-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors outline-none cursor-pointer"
                              title={`Remover ${r.name} dos salvos permanentemente`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newAthleteName}
                      onChange={(e) => setNewAthleteName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAthlete();
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Nome do atleta"
                    />
                    <button
                      type="button"
                      onClick={handleAddAthlete}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>

                  {athletes.length > 0 && (
                    <div className="space-y-2">
                      {athletes.map((athlete) => (
                        <div
                          key={athlete.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-card border border-border/50"
                        >
                          <span className="text-foreground">{athlete.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAthlete(athlete.id)}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {athletes.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Nenhum atleta adicionado ainda (opcional)</p>
                  )}
                </div>
              )}



              {/* Modo de Análise */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Modo de Análise *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[{value: 'presencial', label: 'Presencial'}, {value: 'YouTube', label: 'YouTube'}].map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => {
                        setAnalysisMode(mode.value);
                        if (mode.value !== 'YouTube') setYoutubeUrl('');
                      }}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                        analysisMode === mode.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-elevated border border-border text-foreground hover:border-primary'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* YouTube URL (condicional) */}
              {analysisMode === 'YouTube' && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    URL do Vídeo YouTube *
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-elevated border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="https://www.youtube.com/live/... ou https://youtu.be/..."
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos aceitos: youtu.be/VIDEO_ID, link de compartilhamento (youtu.be/VIDEO_ID?si=...), youtube.com/watch?v=VIDEO_ID, youtube.com/live/VIDEO_ID (livestream) ou youtube.com/embed/VIDEO_ID
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-elevated transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="tour-create-match-submit"
                  type="submit"
                  disabled={creatingMatch}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {creatingMatch ? 'Criando...' : 'Criar Partida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} message="Você atingiu o limite de 3 partidas no plano gratuito." />
    </div>
  );
};

export default Videos;
