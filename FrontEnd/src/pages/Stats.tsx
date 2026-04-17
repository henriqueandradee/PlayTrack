import { useEffect, useState } from 'react';
import { Target, TrendingUp, Award, Video, Users, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/UpgradeModal';
import api from '@/lib/api';
import type { VideoStats, AthleteStats } from '@/types';
import { formatPct } from '@/lib/helpers';

const Stats = () => {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [athleteStats, setAthleteStats] = useState<AthleteStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'averages' | 'totals'>('averages');
  const [statsMode, setStatsMode] = useState<'team' | 'athletes'>('team');
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes, aRes] = await Promise.allSettled([
          api.get('/stats/career'),
          api.get('/stats/career/athletes'),
        ]);
        if (sRes.status === 'fulfilled') setStats(sRes.value.data.data);
        if (aRes.status === 'fulfilled') setAthleteStats(aRes.value.data.data || []);
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
          <p className="text-text-secondary text-sm">Analise jogos do "Meu Time" e finalize para ver suas estatísticas aqui</p>
        </div>
      ) : (
        <>
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 shrink-0">
            {/* Team / Per Athlete toggle */}
            <div className="flex bg-elevated border border-border p-1 rounded-lg">
              <button
                onClick={() => setStatsMode('team')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  statsMode === 'team' ? 'bg-card text-foreground shadow-sm' : 'text-text-secondary hover:text-foreground'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Time
              </button>
              <button
                onClick={() => setStatsMode('athletes')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  statsMode === 'athletes' ? 'bg-card text-foreground shadow-sm' : 'text-text-secondary hover:text-foreground'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Por Atleta
              </button>
            </div>

            {/* Averages / Totals toggle */}
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

          {/* Team stats mode */}
          {statsMode === 'team' && (
            <>
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

          {/* Per-athlete stats mode */}
          {statsMode === 'athletes' && (
            <div className="space-y-4">
              {athleteStats.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-2">Sem dados por atleta</p>
                  <p className="text-text-secondary text-sm">Registre eventos com atletas selecionados em jogos do "Meu Time" para ver estatísticas individuais</p>
                </div>
              ) : (
                athleteStats.map((athlete) => {
                  const games = Math.max(1, athlete.gamesPlayed);
                  const getValue = (val: number) => viewMode === 'averages' ? parseFloat((val / games).toFixed(1)) : val;
                  const safeDiv = (n: number, d: number) => d === 0 ? 0 : parseFloat((n / d).toFixed(4));

                  return (
                    <div key={athlete.athleteId} className="glass-card p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-foreground font-semibold">{athlete.athleteName}</h3>
                            <p className="text-xs text-text-secondary">{athlete.gamesPlayed} jogo{athlete.gamesPlayed !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{getValue(athlete.aggregates.pts)}</p>
                          <p className="text-xs text-text-secondary">{viewMode === 'averages' ? 'pts/j' : 'pts'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        {[
                          { label: 'FG%', value: formatPct(safeDiv(athlete.aggregates.fgm, athlete.aggregates.fga)) },
                          { label: viewMode === 'averages' ? 'REB/J' : 'REB', value: getValue(athlete.aggregates.reb) },
                          { label: viewMode === 'averages' ? 'ASS/J' : 'ASS', value: getValue(athlete.aggregates.ass) },
                          { label: viewMode === 'averages' ? 'ERR/J' : 'ERR', value: getValue(athlete.aggregates.err) },
                        ].map((s) => (
                          <div key={s.label} className="p-2 rounded-lg bg-elevated">
                            <p className="text-foreground font-semibold text-sm">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
};

export default Stats;
