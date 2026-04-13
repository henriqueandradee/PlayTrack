import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowDown, ArrowUp, Download, Scissors, Clock3, FileBadge2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

import api, { getErrorMessage } from '@/lib/api';
import { formatTime } from '@/lib/helpers';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/UpgradeModal';
import type { GameEvent, Video } from '@/types';

const VideoGenerate = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isProUser = user?.plan === 'pro';

  const [video, setVideo] = useState<Video | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [contextBeforeSeconds, setContextBeforeSeconds] = useState(10);
  const [contextAfterSeconds, setContextAfterSeconds] = useState(10);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [outputFileName, setOutputFileName] = useState('playtrack-melhores-momentos');
  const [isExporting, setIsExporting] = useState(false);
  const [exportLog, setExportLog] = useState('');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportEtaSeconds, setExportEtaSeconds] = useState<number | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState('');

  const formatEta = (seconds: number) => {
    const safe = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(safe / 60);
    const remainingSeconds = safe % 60;
    if (minutes > 0) {
      return `${minutes}min ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const resolveDownloadFileName = (contentDisposition: string | undefined, fallback: string) => {
    if (!contentDisposition) return fallback;

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      return decodeURIComponent(utf8Match[1]);
    }

    const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
    if (quotedMatch?.[1]) {
      return quotedMatch[1];
    }

    const plainMatch = contentDisposition.match(/filename=([^;]+)/i);
    if (plainMatch?.[1]) {
      return plainMatch[1].trim();
    }

    return fallback;
  };

  useEffect(() => {
    if (!isProUser) {
      setLoading(false);
      return;
    }

    if (!videoId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [videoRes, eventsRes] = await Promise.all([
          api.get(`/videos/${videoId}`),
          api.get('/analysis/events', { params: { videoId } }),
        ]);

        const loadedVideo: Video = videoRes.data.data.video;
        const loadedEvents: GameEvent[] = eventsRes.data.data || [];

        setVideo(loadedVideo);
        setEvents(loadedEvents);
        setSelectedEventIds(loadedEvents.map((event) => event._id));
        setOutputFileName(`${loadedVideo.title.toLowerCase().replace(/\s+/g, '-')}-melhores-momentos`);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId, isProUser]);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const selectedEvents = useMemo(() => {
    const eventsById = new Map(events.map((event) => [event._id, event]));
    return selectedEventIds
      .map((id) => eventsById.get(id))
      .filter((event): event is GameEvent => Boolean(event));
  }, [events, selectedEventIds]);

  const orderedEventRows = useMemo(() => {
    const selectedSet = new Set(selectedEventIds);
    const unselectedEvents = events.filter((event) => !selectedSet.has(event._id));
    return [...selectedEvents, ...unselectedEvents];
  }, [events, selectedEventIds, selectedEvents]);

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds((prev) => (
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    ));
  };

  const moveSelectedClip = (index: number, direction: 'up' | 'down') => {
    setSelectedEventIds((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!isProUser) {
      setUpgradeOpen(true);
      toast.error('A geração de vídeo está disponível apenas no plano Pro.');
      return;
    }

    if (selectedEventIds.length === 0) {
      toast.error('Selecione ao menos um timestamp para gerar o vídeo.');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportEtaSeconds(null);
      setExportLog('Enfileirando exportação...');
      const exportStartedAt = Date.now();

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      const startResponse = await api.post(`/export/video/${video?._id}`, {
        eventIds: selectedEventIds,
        beforeSeconds: contextBeforeSeconds,
        afterSeconds: contextAfterSeconds,
        outputFileName,
      });

      const jobId = startResponse.data?.data?.jobId;
      if (!jobId) {
        throw new Error('Falha ao iniciar exportação.');
      }

      let isCompleted = false;
      while (!isCompleted) {
        // Polling simples para refletir progresso real do backend.
        await new Promise((resolve) => setTimeout(resolve, 1200));
        const statusResponse = await api.get(`/export/video/jobs/${jobId}`);
        const status = statusResponse.data?.data;

        if (!status) {
          throw new Error('Status de exportação indisponível.');
        }

        const progressValue = Math.max(0, Math.min(100, Number(status.progress) || 0));
        setExportProgress(progressValue);
        setExportLog(status.message || 'Processando exportação...');

        if (progressValue > 3 && progressValue < 100) {
          const elapsedSeconds = (Date.now() - exportStartedAt) / 1000;
          const estimatedTotalSeconds = elapsedSeconds / (progressValue / 100);
          const etaSeconds = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
          setExportEtaSeconds(etaSeconds);
        } else {
          setExportEtaSeconds(null);
        }

        if (status.status === 'failed') {
          throw new Error(status.error || status.message || 'Falha ao exportar vídeo.');
        }

        if (status.status === 'completed') {
          isCompleted = true;
        }
      }

      const response = await api.get(`/export/video/jobs/${jobId}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'video/mp4' });
      const newUrl = URL.createObjectURL(blob);
      setDownloadUrl(newUrl);
      const fallbackFileName = `${outputFileName.replace(/\.mp4$/i, '')}.mp4`;
      const contentDisposition = typeof response.headers['content-disposition'] === 'string'
        ? response.headers['content-disposition']
        : undefined;
      setGeneratedFileName(resolveDownloadFileName(contentDisposition, fallbackFileName));
      setExportProgress(100);
      setExportEtaSeconds(0);
      setExportLog('Exportação concluída com sucesso.');
      toast.success('Vídeo gerado com sucesso.');
    } catch (error: unknown) {
      const fallbackMessage = 'Falha na exportação. Revise os parâmetros e tente novamente.';
      let resolvedMessage = fallbackMessage;

      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          const rawText = await error.response.data.text();
          const parsed = JSON.parse(rawText);
          const backendMessage = String(parsed?.message || '');

          if (backendMessage.includes('Route not found: /export/video/')) {
            resolvedMessage = 'Backend desatualizado. Reinicie a API para habilitar a rota POST /export/video/:videoId.';
            toast.error(resolvedMessage);
            setExportLog('API precisa ser reiniciada para carregar a nova rota de exportação.');
            return;
          }

          resolvedMessage = parsed?.message || getErrorMessage(error);
          setExportLog(resolvedMessage);
          toast.error(resolvedMessage);
          return;
        } catch {
          // Ignore parse errors and fallback to default message.
        }
      }

      if (error instanceof Error && error.message) {
        resolvedMessage = error.message;
      } else if (axios.isAxiosError(error)) {
        resolvedMessage = getErrorMessage(error);
      }

      setExportLog(resolvedMessage);
      toast.error(resolvedMessage);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return <div className="p-6 lg:p-8 animate-pulse"><div className="h-80 glass-card" /></div>;
  }

  if (!isProUser) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in space-y-4">
        <button
          onClick={() => navigate('/videos')}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para partidas
        </button>

        <div className="glass-card p-6 text-center space-y-3">
          <h1 className="text-xl font-semibold text-foreground">Recurso exclusivo do plano Pro</h1>
          <p className="text-sm text-text-secondary">
            A geração de vídeo de melhores momentos está disponível apenas para assinantes Pro.
          </p>
          <button
            onClick={() => setUpgradeOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors text-sm font-medium"
          >
            Ver vantagens do Pro
          </button>
        </div>

        <UpgradeModal
          open={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          message="A geração de vídeo de melhores momentos está disponível apenas no plano Pro."
        />
      </div>
    );
  }

  if (!video) {
    return <div className="p-6 lg:p-8 text-center text-text-secondary">Partida não encontrada.</div>;
  }

  const isYoutubeMatch = video.source.type === 'youtube' && !!video.source.videoId;
  if (!isYoutubeMatch) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in space-y-4">
        <button
          onClick={() => navigate(`/videos/${video._id}`)}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para análise
        </button>
        <div className="glass-card p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">Geração de vídeo indisponível</h1>
          <p className="text-sm text-text-secondary mt-2">
            Esta funcionalidade está disponível apenas para partidas com fonte YouTube.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate(`/videos/${video._id}`)}
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para análise
          </button>
          <h1 className="text-2xl font-bold text-foreground mt-3">Gerar vídeo</h1>
          <p className="text-sm text-text-secondary mt-1">Partida: {video.title}</p>
        </div>
      </div>

      <div className="glass-card p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/70 bg-elevated/40 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-text-secondary mb-2">
              <FileBadge2 className="h-4 w-4 text-primary" />
              <label className="text-sm font-medium">Nome do arquivo final</label>
            </div>
            <input
              type="text"
              value={outputFileName}
              onChange={(event) => setOutputFileName(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="rounded-xl border border-border/70 bg-elevated/40 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-text-secondary mb-2">
              <Clock3 className="h-4 w-4 text-primary" />
              <label className="text-sm font-medium">Segundos antes da marcação</label>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={contextBeforeSeconds}
              onChange={(event) => setContextBeforeSeconds(Math.max(0, Number(event.target.value.replace(/\D/g, '')) || 0))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="rounded-xl border border-border/70 bg-elevated/40 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-text-secondary mb-2">
              <Clock3 className="h-4 w-4 text-primary" />
              <label className="text-sm font-medium">Segundos depois da marcação</label>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={contextAfterSeconds}
              onChange={(event) => setContextAfterSeconds(Math.max(1, Number(event.target.value.replace(/\D/g, '')) || 1))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground md:text-right">
          Total selecionado: {selectedEvents.length} timestamps
        </p>

        {(isExporting || exportProgress > 0) && (
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-elevated overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(2, exportProgress)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Progresso: {Math.round(exportProgress)}%</p>
            {isExporting && exportEtaSeconds !== null && (
              <p className="text-xs text-muted-foreground">Tempo restante aproximado: {formatEta(exportEtaSeconds)}</p>
            )}
          </div>
        )}

        <div className="rounded-xl border border-border/70 bg-elevated/30 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-secondary">Seleção e ordem dos clipes</p>
            {events.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedEventIds(events.map((event) => event._id))}
                  className="text-xs text-primary hover:underline"
                >
                  Selecionar todos
                </button>
                <button
                  onClick={() => setSelectedEventIds([])}
                  className="text-xs text-primary hover:underline"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">Sem timestamps registrados nesta partida.</p>
            ) : (
              <div className="space-y-1">
                {orderedEventRows.map((event) => {
                  const selectedIndex = selectedEventIds.indexOf(event._id);
                  const isSelected = selectedIndex >= 0;

                  return (
                    <div
                      key={event._id}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${isSelected ? 'bg-background/70' : 'hover:bg-background/60'}`}
                    >
                      <span className="text-[11px] text-muted-foreground w-7 text-left shrink-0">
                        {isSelected ? `#${selectedIndex + 1}` : ''}
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEventSelection(event._id)}
                      />
                      <span className="text-xs font-mono text-primary shrink-0">{formatTime(event.videoTimestampSeconds)}</span>
                      <span className="text-xs text-foreground truncate">
                        {event.category === 'stat' ? event.actionType : event.note || event.category}
                      </span>
                      {event.athleteName && (
                        <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium shrink-0">
                          {event.athleteName}
                        </span>
                      )}

                      {isSelected && (
                        <>
                          <div className="ml-auto flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveSelectedClip(selectedIndex, 'up')}
                              disabled={selectedIndex === 0}
                              className="p-1 rounded border border-border text-text-secondary hover:text-foreground hover:border-primary/40 disabled:opacity-40"
                              title="Mover para cima"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSelectedClip(selectedIndex, 'down')}
                              disabled={selectedIndex === selectedEventIds.length - 1}
                              className="p-1 rounded border border-border text-text-secondary hover:text-foreground hover:border-primary/40 disabled:opacity-40"
                              title="Mover para baixo"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
          >
            <Scissors className="h-4 w-4" />
            {isExporting ? 'Gerando vídeo...' : 'Gerar vídeo'}
          </button>

          {downloadUrl && (
            <a
              href={downloadUrl}
              download={generatedFileName}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-success/90 text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              <Download className="h-4 w-4" />
              Baixar arquivo
            </a>
          )}

          {exportLog && <span className="text-xs text-muted-foreground">{exportLog}</span>}
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

export default VideoGenerate;
