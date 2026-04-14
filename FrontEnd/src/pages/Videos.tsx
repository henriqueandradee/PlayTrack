import { useEffect, useState, useCallback } from 'react';
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
  const [analysisType, setAnalysisType] = useState('');
  const [scope, setScope] = useState('');
  const [gameType, setGameType] = useState('');
  const [analysisMode, setAnalysisMode] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [newAthleteName, setNewAthleteName] = useState('');
  const [createMatchError, setCreateMatchError] = useState('');
  const [createMatchErrors, setCreateMatchErrors] = useState<string[]>([]);
  const [creatingMatch, setCreatingMatch] = useState(false);

  const canAddVideo = user?.plan === 'pro' || (user?.usage.videoCount ?? 0) < 5;

  useEffect(() => {
    fetchVideos();
  }, []);

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
    setAthletes([...athletes, newAthlete]);
    setNewAthleteName('');
  };

  const handleRemoveAthlete = (id: string) => {
    setAthletes(athletes.filter((a) => a.id !== id));
  };

  const validateCreateMatch = useCallback((): boolean => {
    const errors: string[] = [];
    if (!matchTitle.trim()) errors.push('Título é obrigatório');
    if (!analysisType) errors.push('Tipo de análise é obrigatório');
    if (!scope) errors.push('Quem analisar é obrigatório');
    if (!gameType) errors.push('Tipo de jogo é obrigatório');
    if (!analysisMode) errors.push('Modo de análise é obrigatório');
    if (analysisMode === 'YouTube' && !youtubeUrl.trim()) {
      errors.push('URL do YouTube é obrigatória para modo YouTube');
    }
    if (analysisMode === 'YouTube' && youtubeUrl.trim()) {
      // Aceita: youtu.be/VIDEO_ID, youtu.be/VIDEO_ID?si=..., youtube.com/watch?v=VIDEO_ID, youtube.com/live/VIDEO_ID, etc.
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/.+/;
      if (!youtubeRegex.test(youtubeUrl)) {
        errors.push('URL do YouTube inválida. Formatos aceitos: youtu.be/VIDEO_ID, youtube.com/watch?v=VIDEO_ID, youtube.com/live/VIDEO_ID, link de compartilhamento ou embed');
      }
    }
    if (scope === 'multi atleta' && athletes.length === 0) {
      errors.push('Adicione pelo menos 1 atleta para vários atletas');
    }
    setCreateMatchErrors(errors);
    return errors.length === 0;
  }, [matchTitle, analysisType, scope, gameType, analysisMode, youtubeUrl, athletes]);

  const resetForm = () => {
    setMatchTitle('');
    setAnalysisType('');
    setScope('');
    setGameType('');
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
      const videoPayload: Record<string, unknown> = {
        title: matchTitle.trim(),
        description: '',
        sourceType: analysisMode === 'YouTube' ? 'youtube' : 'live',
        context: {
          sport: 'basketball',
          analysisType,
          scope,
          gameType,
          analysisMode,
          eventType: gameType === 'jogo' ? 'game' : 'study',
          athletes: scope === 'multi atleta' ? athletes : [],
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
          onClick={() => canAddVideo ? setModalOpen(true) : setUpgradeOpen(true)}
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

              {/* Tipo de Análise */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Tipo de Análise *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['estatística', 'tática', 'ambos'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAnalysisType(type)}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                        analysisType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-elevated border border-border text-foreground hover:border-primary'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quem analisar */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Quem analisar? *</label>
                <select
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value);
                    if (e.target.value !== 'multi atleta') {
                      setAthletes([]);
                      setNewAthleteName('');
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-lg bg-elevated border border-border text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Selecione --</option>
                  <option value="eu">Análise Pessoal (Eu)</option>
                  <option value="outro atleta">Outro Atleta</option>
                  <option value="multi atleta">Vários atletas</option>
                  <option value="time">Time Completo</option>
                </select>
              </div>

              {/* Multi-Atleta: Adicionar atletas */}
              {scope === 'multi atleta' && (
                <div className="p-4 bg-elevated rounded-lg border border-border">
                  <label className="block text-sm font-medium text-text-secondary mb-3">
                    Atletas a Analisar
                  </label>

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
                    <p className="text-sm text-muted-foreground italic">Nenhum atleta adicionado ainda</p>
                  )}
                </div>
              )}

              {/* Tipo de Jogo */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Tipo de Jogo *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['jogo', 'estudo'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setGameType(type)}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                        gameType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-elevated border border-border text-foreground hover:border-primary'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modo de Análise */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Modo de Análise *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['presencial', 'YouTube'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setAnalysisMode(mode);
                        if (mode !== 'YouTube') setYoutubeUrl('');
                      }}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                        analysisMode === mode
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-elevated border border-border text-foreground hover:border-primary'
                      }`}
                    >
                      {mode}
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
