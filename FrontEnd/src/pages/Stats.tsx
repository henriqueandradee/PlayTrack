import { useEffect, useState } from 'react';
import { Target, TrendingUp, Award, Video } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/UpgradeModal';
import api from '@/lib/api';
import type { VideoStats } from '@/types';
import { formatPct } from '@/lib/helpers';

const Stats = () => {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'averages' | 'totals'>('averages');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const sRes = await api.get('/stats/career');
        setStats(sRes.data.data);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-6 lg:p-8 animate-pulse"><div className="h-96 glass-card" /></div>;

  const planType = typeof user?.plan === 'string' ? user?.plan : (user?.plan as any)?.type ?? 'free';
  const isPro = planType === 'pro';

  if (!isPro) {
    return (
      <>
        <div className="p-4 lg:p-6 max-w-5xl mx-auto animate-fade-in flex flex-col min-h-[calc(100vh-64px)] lg:min-h-[calc(100vh-80px)] pb-10">
          <h1 className="text-2xl font-bold text-foreground mb-4 shrink-0">Estatísticas de Carreira</h1>
          <div className="glass-card p-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium mb-2">Funcionalidade exclusiva do plano Pro</p>
            <p className="text-text-secondary text-sm mb-6">Desbloqueie estatísticas de carreira completas assinando o plano Pro</p>
            <button
              onClick={() => setUpgradeOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
            >
              Assinar plano Pro
            </button>
          </div>
        </div>
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="p-4 lg:p-6 max-w-5xl mx-auto animate-fade-in flex flex-col min-h-[calc(100vh-64px)] lg:min-h-[calc(100vh-80px)] pb-10">
      <h1 className="text-2xl font-bold text-foreground mb-4 shrink-0">Estatísticas de Carreira</h1>

      {!stats ? (
        <div className="glass-card p-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground font-medium mb-2">Sem dados ainda</p>
          <p className="text-text-secondary text-sm">Analise jogos para ver suas estatísticas aqui</p>
        </div>
      ) : (
        <>
          {/* Header elements specific to loaded stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 shrink-0">
            <h2 className="text-lg font-semibold text-foreground">Visão Geral</h2>
            <div className="flex bg-elevated border border-border p-1 rounded-lg">
              <button
                onClick={() => setViewMode('averages')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'averages' ? 'bg-card text-foreground shadow-sm' : 'text-text-secondary hover:text-foreground'
                }`}
              >
                Médias por Jogo
              </button>
              <button
                onClick={() => setViewMode('totals')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'totals' ? 'bg-card text-foreground shadow-sm' : 'text-text-secondary hover:text-foreground'
                }`}
              >
                Totais
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 shrink-0">
            {(() => {
              const games = Math.max(1, stats.videosAnalyzed || 1);
              const getValue = (val: number) => viewMode === 'averages' ? parseFloat((val / games).toFixed(1)) : val;

              return [
                { label: 'Jogos', value: stats.videosAnalyzed ?? 0, icon: Video, color: 'text-primary' },
                { label: viewMode === 'averages' ? 'Pontos/J' : 'Pontos', value: getValue(stats.aggregates.pts), icon: Target, color: 'text-primary' },
                { label: 'Arr. Quadra', value: formatPct(stats.computed.fg_pct), icon: TrendingUp, color: 'text-primary' },
                { label: viewMode === 'averages' ? 'Rebotes/J' : 'Rebotes', value: getValue(stats.aggregates.reb), icon: Award, color: 'text-primary' },
              ].map((kpi) => (
                <div key={kpi.label} className="glass-card p-4">
                  <kpi.icon className={`h-5 w-5 ${kpi.color} mb-2`} />
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-sm text-text-secondary">{kpi.label}</p>
                </div>
              ));
            })()}
          </div>

          {/* Full stats table */}
          <div className="glass-card p-4 mb-0">
            <h2 className="text-lg font-semibold text-foreground mb-3 shrink-0">Estatísticas Completas</h2>
            {(() => {
              const games = Math.max(1, stats.videosAnalyzed || 1);
              const getValue = (val: number) => viewMode === 'averages' ? parseFloat((val / games).toFixed(1)) : val;

              return (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {[
                        ['Pontos', getValue(stats.aggregates.pts)],
                        ['Arremesso de Quadra', <span><span className="text-xs text-muted-foreground mr-1">({getValue(stats.aggregates.fgm)}/{getValue(stats.aggregates.fga)})</span> {formatPct(stats.computed.fg_pct)}</span>],
                        ['Arremesso de 2 Pontos', <span><span className="text-xs text-muted-foreground mr-1">({getValue(stats.aggregates['2ptm'])}/{getValue(stats.aggregates['2pta'])})</span> {formatPct(stats.computed.two_pt_pct)}</span>],
                        ['Arremesso de 3 Pontos', <span><span className="text-xs text-muted-foreground mr-1">({getValue(stats.aggregates['3ptm'])}/{getValue(stats.aggregates['3pta'])})</span> {formatPct(stats.computed.three_pt_pct)}</span>],
                        ['Lances Livres', <span><span className="text-xs text-muted-foreground mr-1">({getValue(stats.aggregates.ftm)}/{getValue(stats.aggregates.fta)})</span> {formatPct(stats.computed.ft_pct)}</span>],
                        ['Rebotes', getValue(stats.aggregates.reb)],
                        ['Assistências', getValue(stats.aggregates.ass)],
                        ['Roubos de Bola', getValue(stats.aggregates.rb)],
                        ['Erros', getValue(stats.aggregates.err)],
                        ['Eficiência', getValue(stats.computed.eff || 0)],
                      ].map(([label, value]) => (
                        <tr key={label as string}>
                          <td className="py-2 text-text-secondary">{label}</td>
                          <td className="py-2 text-foreground font-medium text-right">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </>
      )}
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
};

export default Stats;
