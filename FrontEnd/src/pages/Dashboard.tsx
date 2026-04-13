import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Video as VideoIcon, TrendingUp, Target, Award, MapPin } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import type { Video, VideoStats } from '@/types';
import { getYouTubeThumbnail } from '@/lib/helpers';
import { formatPct } from '@/lib/helpers';

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-primary/10 text-primary' },
  completed: { label: 'Concluído', className: 'bg-success/10 text-success' },
};

const Dashboard = () => {
  const user = useAuthStore((s) => s.user);
  const [videos, setVideos] = useState<Video[]>([]);
  const [careerStats, setCareerStats] = useState<VideoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [vRes, sRes] = await Promise.allSettled([
          api.get('/videos?limit=6'),
          api.get('/stats/career'),
        ]);

        if (vRes.status === 'fulfilled') {
          setVideos(vRes.value.data?.data || []);
        } else {
          console.error('Erro ao carregar jogos recentes:', vRes.reason);
        }

        if (sRes.status === 'fulfilled') {
          // stats/career pode retornar objetos não 100% perfeitamente aninhados caso
          // o backend não serialize corretamente. Usaremos null se falsy.
          setCareerStats(sRes.value.data?.data || null);
        } else {
          console.error('Erro ao carregar estatísticas:', sRes.reason);
        }
      } catch (err) {
        console.error('Erro inesperado no fetch do Dashboard:', err);
        setError('Ocorreu um problema ao buscar os dados do painel.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!user) return null;
  const planType = typeof user.plan === 'string' ? user.plan : (user.plan as any)?.type ?? 'free';
  const videoCount = user.usage?.videoCount ?? 0;
  const canAddVideo = planType === 'pro' || videoCount < 5;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Olá, {user.username}
      </h1>

      {error && (
        <div className="p-4 mb-6 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}

      {/* Usage cards */}
      {planType === 'free' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-5">
            <p className="text-sm text-text-secondary mb-2">Jogos analisados</p>
            <p className="text-2xl font-bold text-foreground mb-3">
              {videoCount} <span className="text-text-secondary text-base font-normal">/ 3</span>
            </p>
            <div className="w-full h-2 bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min((videoCount / 3) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="glass-card p-5 flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Funcionalidades Pro</p>
              <p className="text-foreground font-medium">Desbloqueie tudo</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
              Ver planos
            </button>
          </div>
        </div>
      )}

      {/* Quick stats */}
      {careerStats && planType === 'pro' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(() => {
            const games = Math.max(1, careerStats.videosAnalyzed || 1);
            const getAverage = (val: number) => parseFloat((val / games).toFixed(1));

            return [
              { label: 'Pontos/J', value: getAverage(careerStats.aggregates?.pts ?? 0), icon: Target, color: 'text-primary' },
              { label: 'FG%', value: <span><span className="text-sm font-normal text-muted-foreground mr-1">({getAverage(careerStats.aggregates?.fgm ?? 0)}/{getAverage(careerStats.aggregates?.fga ?? 0)})</span> {formatPct(careerStats.computed?.fg_pct ?? 0)}</span>, icon: TrendingUp, color: 'text-success' },
              { label: 'Rebotes/J', value: getAverage(careerStats.aggregates?.reb ?? 0), icon: Award, color: 'text-primary' },
              { label: 'Assist./J', value: getAverage(careerStats.aggregates?.ass ?? 0), icon: VideoIcon, color: 'text-primary' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4">
                <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-text-secondary">{stat.label}</p>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Recent games */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Jogos Recentes</h2>
        <Link
          to="/videos"
          className="text-sm text-primary hover:underline"
        >
          Ver todos
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-48 animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium mb-2">Nenhum jogo ainda</p>
          <p className="text-text-secondary text-sm mb-4">Adicione seu primeiro jogo para começar a análise</p>
          <Link
            to="/videos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
          >
            <Plus className="h-4 w-4" /> Adicionar Jogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => {
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
                  <h3 className="font-medium text-foreground truncate">{video.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                    <span className="text-xs text-muted-foreground">{video.eventCount} registros</span>
                  </div>
                </div>
              </Link>
            );
          })}
          {canAddVideo && (
            <Link
              to="/videos"
              className="glass-card flex flex-col items-center justify-center min-h-[200px] hover:border-primary/30 transition-colors group"
            >
              <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground group-hover:text-primary mt-2 transition-colors">Adicionar Jogo</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
