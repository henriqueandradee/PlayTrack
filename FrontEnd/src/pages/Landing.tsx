import { useNavigate } from 'react-router-dom';
import { Play, Youtube, BarChart3, Share2, ChevronRight, Zap, Eye, Users, TrendingUp, Target, FileText, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Youtube,
    title: 'Player integrado ao YouTube',
    desc: 'Cole o link do jogo e assista direto na plataforma. Sem uploads, sem esperas.',
  },
  {
    icon: Target,
    title: 'Marque jogadas em tempo real',
    desc: 'Registre arremessos, assistências, rebotes e erros sincronizados ao vídeo.',
  },
  {
    icon: BarChart3,
    title: 'Estatísticas automáticas',
    desc: 'Box score, percentuais e eficiência calculados automaticamente a cada registro.',
  },
  {
    icon: Share2,
    title: 'Compartilhe análises',
    desc: 'Gere um link e compartilhe a análise completa com seus atletas em um clique.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Cole o link do jogo',
    desc: 'Basta colar a URL do YouTube. O vídeo aparece direto no player integrado.',
  },
  {
    num: '02',
    title: 'Marque jogadas durante o vídeo',
    desc: 'Registre cada ação no momento exato. Arremessos, passes, erros — tudo sincronizado.',
  },
  {
    num: '03',
    title: 'Compartilhe e acompanhe',
    desc: 'Envie a análise para seus atletas e acompanhe a evolução individual e coletiva.',
  },
];

const problems = [
  {
    icon: Eye,
    text: 'Você assiste aos jogos do seu time, mas não consegue analisar tudo?',
  },
  {
    icon: Users,
    text: 'Dificuldade em mostrar erros de forma clara para seus atletas?',
  },
  {
    icon: TrendingUp,
    text: 'Falta uma ferramenta estruturada para acompanhar a evolução?',
  },
];

const differentials = [
  { text: 'Sem upload de vídeo', sub: 'Os vídeos ficam no YouTube.' },
  { text: 'Sem edição manual', sub: 'Apenas marque as jogadas.' },
  { text: 'Leve e rápido', sub: 'Funciona em qualquer dispositivo.' },
  { text: 'Foco em análise', sub: 'Feito para quem quer evoluir.' },
];

const Landing = () => {
  const navigate = useNavigate();
  const goRegister = () => navigate('/register');

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ═══════════════════ NAV ═══════════════════ */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="PlayTrack" className="h-8 w-8 object-contain group-hover:scale-105 transition-transform" />
            <span className="text-lg font-bold text-foreground">PlayTrack</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm text-text-secondary hover:text-foreground transition-colors font-medium px-3 py-1.5">
              Entrar
            </button>
            <button onClick={goRegister} className="text-sm bg-primary text-primary-foreground font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-all">
              Criar conta grátis
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4">
        {/* Bg effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-primary/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
            <Zap className="h-3.5 w-3.5" />
            Plataforma de scout para basquete
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight max-w-4xl mx-auto mb-5">
            Analise seus jogos<br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">como um profissional.</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed">
            Dê aos seus atletas uma forma clara e estruturada de evoluir com dados. Sem uploads, sem edição — apenas análise.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <button onClick={goRegister} className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/25">
              Começar agora
              <ArrowRight className="h-5 w-5" />
            </button>
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-elevated border border-border text-foreground font-medium text-base hover:border-primary/50 transition-all">
              Já tenho conta
            </button>
          </div>

          {/* Hero mockup */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-t from-primary/10 via-transparent to-transparent rounded-2xl blur-xl" />
            <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-2xl shadow-black/30">
              <img src="/hero-mockup.png" alt="PlayTrack — Interface de análise" className="w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ PROBLEMA ═══════════════════ */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3 text-center">O problema</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 leading-tight">
            Você sabe que precisa analisar,<br className="hidden sm:block" /> mas falta a ferramenta certa.
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {problems.map((p, i) => (
              <div key={i} className="glass-card p-6 text-center group hover:border-primary/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <p.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ SOLUÇÃO / FEATURES ═══════════════════ */}
      <section className="py-20 sm:py-28 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3 text-center">A solução</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 leading-tight">
            Tudo que você precisa para analisar seu time.
          </h2>
          <p className="text-text-secondary text-center max-w-2xl mx-auto mb-12">
            O PlayTrack transforma qualquer jogo em uma análise profissional com estatísticas, anotações e compartilhamento.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((f, i) => (
              <div key={i} className="glass-card p-6 flex gap-4 items-start group hover:border-primary/30 transition-all">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ COMO FUNCIONA ═══════════════════ */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3 text-center">Como funciona</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 leading-tight">
            Três passos para começar.
          </h2>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={i} className="text-center group">
                <div className="text-5xl font-extrabold text-primary/15 mb-3 group-hover:text-primary/30 transition-colors">{s.num}</div>
                <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden sm:block h-5 w-5 text-border absolute right-0 top-1/2 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ BENEFÍCIOS ═══════════════════ */}
      <section className="py-20 sm:py-28 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Treinadores */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Para treinadores</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Tenha uma ferramenta profissional de scout',
                  'Disponibilize análises claras para seus atletas',
                  'Acompanhe evolução individual e coletiva',
                  'Tome decisões baseadas em dados',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-text-secondary text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                      <Play className="h-2.5 w-2.5 text-primary fill-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Atletas */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Para atletas</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Entenda seus erros com clareza visual',
                  'Evolua com base em dados reais',
                  'Acesse suas análises de qualquer dispositivo',
                  'Compare seu desempenho entre partidas',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-text-secondary text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                      <Play className="h-2.5 w-2.5 text-primary fill-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ DIFERENCIAIS ═══════════════════ */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3 text-center">Diferencial</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 leading-tight">
            Simples por design.<br className="hidden sm:block" /> Poderoso por natureza.
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {differentials.map((d, i) => (
              <div key={i} className="glass-card p-5 text-center group hover:border-primary/30 transition-all">
                <p className="text-foreground font-semibold mb-1">{d.text}</p>
                <p className="text-xs text-muted-foreground">{d.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA FINAL ═══════════════════ */}
      <section className="relative py-24 sm:py-32 px-4 overflow-hidden">
        {/* Bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
            Transforme seus jogos em<br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">evolução real.</span>
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
            Comece agora e dê ao seu time a ferramenta que faltava para evoluir de verdade.
          </p>
          <button onClick={goRegister} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-all shadow-lg shadow-primary/25">
            Começar agora — é grátis
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PlayTrack" className="h-6 w-6 object-contain" />
            <span className="text-sm font-semibold text-foreground">PlayTrack</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">Privacidade</button>
            <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">Termos</button>
            <button onClick={() => navigate('/cookies')} className="hover:text-foreground transition-colors">Cookies</button>
          </div>

          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} PlayTrack</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
