import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Play, Target, BarChart3, Share2, Video, Users } from 'lucide-react';

/* ─── Step definitions ─── */
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  /** Optional route the user is navigated to before showing the step */
  route?: string;
  /** CSS selector of the element to spotlight (null = centered modal) */
  spotlightSelector?: string;
  /** Position of the tooltip relative to the spotlight */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao PlayTrack.',
    description:
      'Vamos te mostrar como analisar seus jogos e acompanhar a evolução dos seus atletas. Em poucos passos você estará pronto!',
    icon: Play,
  },
  {
    id: 'dashboard',
    title: 'Este é o seu Painel',
    description:
      'Aqui você vê um resumo das suas estatísticas de carreira e os jogos recentes. É o ponto de partida do seu dia a dia no PlayTrack.',
    icon: Target,
    route: '/dashboard',
  },
  {
    id: 'videos',
    title: 'Meus Jogos',
    description:
      'Aqui ficam todas as suas análises. Crie uma nova partida clicando em "Nova Partida", cole o link do YouTube (ou inicie presencial) e comece a marcar jogadas.',
    icon: Video,
    route: '/videos',
  },
  {
    id: 'analysis',
    title: 'Análise em Tempo Real',
    description:
      'Durante a análise, registre arremessos, rebotes, assistências e erros sincronizados ao vídeo. Cada ação gera estatísticas automáticas instantaneamente.',
    icon: Users,
  },
  {
    id: 'stats',
    title: 'Estatísticas de Carreira',
    description:
      'Veja as estatísticas agregadas do seu time e filtre por atleta individual. Acompanhe médias e totais para tomar decisões baseadas em dados.',
    icon: BarChart3,
    route: '/stats',
  },
  {
    id: 'share',
    title: 'Compartilhe e Evolua',
    description:
      'Após finalizar uma análise, gere um link para compartilhar com seus atletas. Eles poderão revisar cada jogada e entender como evoluir.',
    icon: Share2,
  },
  {
    id: 'done',
    title: 'Tudo pronto!',
    description:
      'Agora é com você. Crie sua primeira partida e transforme seus jogos em evolução real. Você pode rever este tutorial a qualquer momento em Configurações.',
    icon: Target,
  },
];

const STORAGE_KEY = 'playtrack_tutorial_seen';

/* ─── Hook ─── */
export const useTutorial = () => {
  const hasSeen = localStorage.getItem(STORAGE_KEY) === '1';

  const startTutorial = useCallback(() => {
    window.dispatchEvent(new CustomEvent('playtrack:tutorial:start'));
  }, []);

  const markSeen = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
  }, []);

  return { hasSeen, startTutorial, markSeen };
};

/* ─── Component ─── */
const OnboardingTutorial = () => {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for start event
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setActive(true);
    };
    window.addEventListener('playtrack:tutorial:start', handler);
    return () => window.removeEventListener('playtrack:tutorial:start', handler);
  }, []);

  // Auto-start on first login
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen && location.pathname === '/dashboard') {
      // Small delay to let the dashboard render first
      const t = setTimeout(() => {
        setStep(0);
        setActive(true);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  // Navigate to step route when step changes
  useEffect(() => {
    if (!active) return;
    const s = STEPS[step];
    if (s.route && location.pathname !== s.route) {
      navigate(s.route, { replace: true });
    }
  }, [step, active, navigate, location.pathname]);

  const close = useCallback(() => {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, '1');
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  const nextStep = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      close();
    }
  };

  const prevStep = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (!active) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;
  // Welcome step = centered modal; all others = bottom bar
  const isWelcomeOrDone = isFirst || isLast;

  return (
    <>
      {/* Overlay — subtle for contextual steps, darker for welcome/done */}
      <div
        className={`fixed inset-0 z-[9998] transition-all duration-300 ${
          isWelcomeOrDone ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/20'
        }`}
        onClick={isWelcomeOrDone ? undefined : close}
      />

      {isWelcomeOrDone ? (
        /* ═══ Centered modal for welcome + done ═══ */
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 overflow-hidden animate-fade-in">
            <div className="h-1 w-full bg-gradient-to-r from-primary via-blue-400 to-primary" />

            <button
              onClick={close}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{current.title}</h2>
              <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">{current.description}</p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 pb-4">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-primary' : i < step ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-border'
                  }`}
                />
              ))}
            </div>

            <div className="px-6 pb-6 flex items-center justify-between gap-3">
              {isFirst ? (
                <>
                  <button onClick={close} className="px-4 py-2.5 rounded-lg text-sm text-text-secondary hover:text-foreground transition-colors font-medium">
                    Pular tutorial
                  </button>
                  <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all">
                    Começar <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={prevStep} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm text-text-secondary hover:text-foreground transition-colors font-medium">
                    <ArrowLeft className="h-4 w-4" /> Voltar
                  </button>
                  <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all">
                    Começar a usar <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            <div className="absolute top-4 left-5 text-xs text-muted-foreground font-medium">
              {step + 1}/{STEPS.length}
            </div>
          </div>
        </div>
      ) : (
        /* ═══ Bottom bar for contextual steps ═══ */
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-fade-in">
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
            {/* Top gradient accent */}
            <div className="h-0.5 w-full bg-gradient-to-r from-primary via-blue-400 to-primary" />

            <div className="p-4 flex items-start gap-4">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-foreground">{current.title}</h3>
                  <span className="text-[10px] text-muted-foreground font-medium bg-elevated px-1.5 py-0.5 rounded">{step + 1}/{STEPS.length}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{current.description}</p>
              </div>

              {/* Close */}
              <button onClick={close} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Bottom row: progress + actions */}
            <div className="px-4 pb-3 flex items-center justify-between">
              {/* Progress dots */}
              <div className="flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === step ? 'w-4 bg-primary' : i < step ? 'w-1 bg-primary/40' : 'w-1 bg-border'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button onClick={prevStep} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-foreground transition-colors font-medium">
                  <ArrowLeft className="h-3 w-3" /> Voltar
                </button>
                <button onClick={nextStep} className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all">
                  Próximo <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OnboardingTutorial;

