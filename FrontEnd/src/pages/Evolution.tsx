import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Download } from 'lucide-react';
import api from '@/lib/api';
import { exportEvolutionPDF } from '@/lib/exportPdf';

/* ─── Stat options ─── */
interface StatOption {
  key: string;
  label: string;
  color: string;
  path: 'aggregates' | 'computed';
}

const STAT_OPTIONS: StatOption[] = [
  { key: 'pts',  label: 'Pontos',       color: '#3b82f6', path: 'aggregates' },
  { key: 'fgm',  label: 'Arremessos C', color: '#22c55e', path: 'aggregates' },
  { key: 'fga',  label: 'Arremessos T', color: '#ef4444', path: 'aggregates' },
  { key: 'reb',  label: 'Rebotes',      color: '#f59e0b', path: 'aggregates' },
  { key: 'ass',  label: 'Assistências', color: '#8b5cf6', path: 'aggregates' },
  { key: 'rb',   label: 'Roubos',       color: '#06b6d4', path: 'aggregates' },
  { key: 'err',  label: 'Erros',        color: '#f43f5e', path: 'aggregates' },
  { key: '2ptm', label: '2PTS C',       color: '#10b981', path: 'aggregates' },
  { key: '2pta', label: '2PTS T',       color: '#fb923c', path: 'aggregates' },
  { key: '3ptm', label: '3PTS C',       color: '#6366f1', path: 'aggregates' },
  { key: '3pta', label: '3PTS T',       color: '#e879f9', path: 'aggregates' },
  { key: 'ftm',  label: 'LL C',         color: '#14b8a6', path: 'aggregates' },
  { key: 'fta',  label: 'LL T',         color: '#f97316', path: 'aggregates' },
  { key: 'fg_pct',      label: 'FG%',   color: '#22d3ee', path: 'computed' },
  { key: 'two_pt_pct',  label: '2PT%',  color: '#a3e635', path: 'computed' },
  { key: 'three_pt_pct',label: '3PT%',  color: '#c084fc', path: 'computed' },
  { key: 'ft_pct',      label: 'LL%',   color: '#fb7185', path: 'computed' },
];

const DEFAULT_STATS = ['pts', 'reb', 'ass'];

interface Athlete {
  athleteId: string;
  athleteName: string;
}

interface GameData {
  videoId: string;
  title: string;
  date: string;
  aggregates: Record<string, number>;
  computed: Record<string, number>;
}

const Evolution = () => {
  const [games, setGames] = useState<GameData[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('team');
  const [selectedStats, setSelectedStats] = useState<Set<string>>(new Set(DEFAULT_STATS));
  const [loading, setLoading] = useState(true);

  // Fetch roster for athlete list
  useEffect(() => {
    api.get('/auth/roster')
      .then((res) => setAthletes(
        (res.data.data || []).map((a: { id: string; name: string }) => ({
          athleteId: a.id,
          athleteName: a.name,
        }))
      ))
      .catch(() => {});
  }, []);

  // Fetch evolution data when subject changes
  useEffect(() => {
    setLoading(true);
    const params = selectedSubject !== 'team' ? `?athleteId=${selectedSubject}` : '';
    api.get(`/stats/evolution${params}`)
      .then((res) => setGames(res.data.data || []))
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, [selectedSubject]);

  const toggleStat = (key: string) => {
    setSelectedStats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Build chart data
  const chartData = games.map((g, i) => {
    const point: Record<string, string | number> = {
      name: g.title.length > 15 ? g.title.slice(0, 15) + '…' : g.title,
      fullName: g.title,
      index: i + 1,
    };
    for (const opt of STAT_OPTIONS) {
      if (selectedStats.has(opt.key)) {
        const val = g[opt.path]?.[opt.key] ?? 0;
        point[opt.key] = opt.path === 'computed' ? Math.round(val * 1000) / 10 : val;
      }
    }
    return point;
  });

  const activeOptions = STAT_OPTIONS.filter((o) => selectedStats.has(o.key));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Evolução</h1>
        <button
          onClick={() => exportEvolutionPDF('evolution-export')}
          className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-lg font-medium transition-colors bg-elevated border border-border text-text-secondary hover:text-foreground hover:border-primary/50"
          title="Exportar PDF"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Exportar PDF</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Left: Filters */}
        <div className="lg:w-64 shrink-0 space-y-4">
          {/* Subject selector */}
          <div className="glass-card p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Quem analisar</p>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedSubject('team')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedSubject === 'team'
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-text-secondary hover:text-foreground hover:bg-elevated border border-transparent'
                }`}
              >
                Time
              </button>
              {athletes.map((a) => (
                <button
                  key={a.athleteId}
                  onClick={() => setSelectedSubject(a.athleteId)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all truncate ${
                    selectedSubject === a.athleteId
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-text-secondary hover:text-foreground hover:bg-elevated border border-transparent'
                  }`}
                >
                  {a.athleteName}
                </button>
              ))}
              {athletes.length === 0 && (
                <p className="text-xs text-muted-foreground italic px-3">Nenhum atleta salvo</p>
              )}
            </div>
          </div>

          {/* Stat selector */}
          <div className="glass-card p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Estatísticas</p>
            <div className="space-y-1">
              {STAT_OPTIONS.map((opt) => {
                const isActive = selectedStats.has(opt.key);
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleStat(opt.key)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-elevated text-foreground'
                        : 'text-muted-foreground hover:text-text-secondary hover:bg-elevated/50'
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 transition-opacity"
                      style={{ backgroundColor: opt.color, opacity: isActive ? 1 : 0.3 }}
                    />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Chart */}
        <div id="evolution-export" className="flex-1 glass-card p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">
              {selectedSubject === 'team'
                ? 'Evolução do Time'
                : `Evolução — ${athletes.find((a) => a.athleteId === selectedSubject)?.athleteName || ''}`}
            </p>
            <p className="text-xs text-muted-foreground">{games.length} jogos</p>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : games.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <p className="text-foreground font-medium mb-1">Sem dados para o gráfico</p>
                <p className="text-text-secondary text-sm">Finalize partidas do seu time para ver a evolução.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0" style={{ minHeight: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 19% 27%)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'hsl(220 13% 91%)', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(217 19% 27%)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(220 13% 91%)', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(217 19% 27%)' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(215 28% 17%)',
                      border: '1px solid hsl(217 19% 27%)',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: 12,
                    }}
                    labelFormatter={(_, payload) => {
                      if (payload?.[0]?.payload?.fullName) return payload[0].payload.fullName;
                      return '';
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: 'hsl(220 13% 91%)' }}
                  />
                  {activeOptions.map((opt) => (
                    <Line
                      key={opt.key}
                      type="monotone"
                      dataKey={opt.key}
                      name={opt.label}
                      stroke={opt.color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: opt.color }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Evolution;
