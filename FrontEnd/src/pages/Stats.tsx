import { useEffect, useState } from 'react';
import { Target, TrendingUp, Award, Video, Users, User, Download } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { UpgradeModal } from '@/components/UpgradeModal';
import api from '@/lib/api';
import type { VideoStats, AthleteStats } from '@/types';
import { formatPct } from '@/lib/helpers';
import { exportBoxScorePDF } from '@/lib/exportPdf';

const Stats = () => {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [athleteStats, setAthleteStats] = useState<AthleteStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'averages' | 'totals'>('averages');
  const [selectedSubject, setSelectedSubject] = useState<string>('team');
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
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Estatísticas de Carreira</h1>
        {stats && (
          <button
            onClick={() => {
              const parseGames = (g = 1) => Math.max(1, g);
              const getVal = (val: number, games: number) => viewMode === 'averages' ? parseFloat((val / parseGames(games)).toFixed(1)) : val;
              const applyMode = (source: StatsData, games: number) => ({
                computed: source.computed,
                aggregates: Object.fromEntries(
                  Object.entries(source.aggregates || {}).map(([k, v]) => [k, getVal(v, games)])
                ) as Record<string, number>
              });

              const suffix = viewMode === 'averages' ? '(Médias por Jogo)' : '(Totais)';

              if (selectedSubject === 'team') {
                const adjStats = applyMode(stats, stats.videosAnalyzed || 1);
                exportBoxScorePDF(`Carreira — Time Completo ${suffix}`, adjStats, undefined, 'TIME');
              } else {
                const athlete = athleteStats.find(a => a.athleteId === selectedSubject);
                if (athlete) {
                  const adjStats = applyMode(athlete, athlete.gamesPlayed);
                  exportBoxScorePDF(
                    `Carreira — ${athlete.athleteName} ${suffix}`,
                    adjStats,
                    undefined,
                    athlete.athleteName.toUpperCase()
                  );
                }
              }
            }}
            className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-lg font-medium transition-colors bg-elevated border border-border text-text-secondary hover:text-foreground hover:border-primary/50"
            title="Exportar PDF"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        )}
      </div>

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
            {/* Subject Selector */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-elevated border border-border text-sm rounded-lg px-3 py-2 text-foreground cursor-pointer outline-none focus:border-primary/50"
            >
              <option value="team">Time Completo</option>
              {athleteStats.map(a => (
                <option key={a.athleteId} value={a.athleteId}>{a.athleteName}</option>
              ))}
            </select>

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

          {/* Stats Display */}
          {(() => {
            let data = null;
            let title = 'Estatísticas do Time';
            let icon = Users;
            let gamesPlayed = 0;
            
            if (selectedSubject === 'team') {
              data = {
                aggregates: stats.aggregates,
                computed: stats.computed,
                eff: (stats.aggregates.pts + stats.aggregates.reb + stats.aggregates.ass + stats.aggregates.rb) - ((stats.aggregates.fga - stats.aggregates.fgm) + (stats.aggregates.fta - stats.aggregates.ftm) + stats.aggregates.err)
              };
              gamesPlayed = stats.videosAnalyzed || 0;
            } else {
              const athlete = athleteStats.find(a => a.athleteId === selectedSubject);
              if (athlete) {
                data = {
                  aggregates: athlete.aggregates,
                  computed: athlete.computed,
                  eff: (athlete.aggregates.pts + athlete.aggregates.reb + athlete.aggregates.ass + (athlete.aggregates.rb || 0)) - ((athlete.aggregates.fga - athlete.aggregates.fgm) + (athlete.aggregates.fta - athlete.aggregates.ftm) + athlete.aggregates.err)
                };
                title = athlete.athleteName;
                icon = User;
                gamesPlayed = athlete.gamesPlayed;
              }
            }

            if (!data || gamesPlayed === 0) {
               return (
                <div className="glass-card p-12 text-center mt-4">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-foreground font-medium mb-2">Sem dados</p>
                  <p className="text-text-secondary text-sm">Nenhum evento registrado ainda.</p>
                </div>
               );
            }

            const gamesMin = Math.max(1, gamesPlayed);
            const getValue = (val: number) => viewMode === 'averages' ? parseFloat((val / gamesMin).toFixed(1)) : val;

            return (
              <div className="space-y-6 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {icon === Users ? <Users className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold text-lg">{title}</h3>
                    <p className="text-xs text-text-secondary">{gamesPlayed} jogo{gamesPlayed !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: 'Jogos', value: gamesPlayed, icon: Video, color: 'text-primary' },
                    { label: viewMode === 'averages' ? 'Pontos/J' : 'Pontos', value: getValue(data.aggregates.pts), icon: Target, color: 'text-primary' },
                    { label: 'Arr. Quadra', value: formatPct(data.computed.fg_pct), icon: TrendingUp, color: 'text-primary' },
                    { label: viewMode === 'averages' ? 'Rebotes/J' : 'Rebotes', value: getValue(data.aggregates.reb), icon: Award, color: 'text-primary' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="glass-card p-4">
                      <kpi.icon className={`h-5 w-5 ${kpi.color} mb-2`} />
                      <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                      <p className="text-sm text-text-secondary">{kpi.label}</p>
                    </div>
                  ))}
                </div>

                {/* Full stats table */}
                <div className="glass-card p-4">
                  <h2 className="text-lg font-semibold text-foreground mb-3 shrink-0">Estatísticas Completas</h2>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-border">
                        {[
                          ['Pontos', getValue(data.aggregates.pts)],
                          ['Arremesso de Quadra', <span><span className="text-xs text-muted-foreground mr-1">({getValue(data.aggregates.fgm)}/{getValue(data.aggregates.fga)})</span> {formatPct(data.computed.fg_pct)}</span>],
                          ['Arremesso de 2 Pontos', <span><span className="text-xs text-muted-foreground mr-1">({getValue(data.aggregates['2ptm'])}/{getValue(data.aggregates['2pta'])})</span> {formatPct(data.computed.two_pt_pct)}</span>],
                          ['Arremesso de 3 Pontos', <span><span className="text-xs text-muted-foreground mr-1">({getValue(data.aggregates['3ptm'])}/{getValue(data.aggregates['3pta'])})</span> {formatPct(data.computed.three_pt_pct)}</span>],
                          ['Lances Livres', <span><span className="text-xs text-muted-foreground mr-1">({getValue(data.aggregates.ftm)}/{getValue(data.aggregates.fta)})</span> {formatPct(data.computed.ft_pct)}</span>],
                          ['Rebotes', getValue(data.aggregates.reb)],
                          ['Assistências', getValue(data.aggregates.ass)],
                          ['Roubos de Bola', getValue(data.aggregates.rb || 0)],
                          ['Erros', getValue(data.aggregates.err)],
                          ['Eficiência', viewMode === 'averages' ? parseFloat((data.eff / gamesMin).toFixed(1)) : data.eff],
                        ].map(([label, value]) => (
                          <tr key={label as string}>
                            <td className="py-2 text-text-secondary">{label}</td>
                            <td className="py-2 text-foreground font-medium text-right">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}
      </div>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
};

export default Stats;
