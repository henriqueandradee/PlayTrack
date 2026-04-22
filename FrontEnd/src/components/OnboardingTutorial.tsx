import { useEffect } from 'react';
import { Joyride, CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import { useTourStore } from '@/stores/tourStore';
import { useAuthStore } from '@/stores/authStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Play, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const STEPS: Step[] = [
  {
    target: 'body',
    content: 'Bem-vindo ao PlayTrack! Vamos te guiar pelo essencial: criar uma partida, marcar ações e compartilhar a análise.',
    placement: 'center',
    disableBeacon: true,
    title: 'Boas vindas',
  },
  {
    target: '#tour-nav-videos',
    content: 'Tudo começa aqui. Clique no menu lateral ou avance para a tela de Jogos.',
    placement: 'right',
    disableOverlayClose: true,
    disableBeacon: true,
    title: 'Acesse seus jogos',
  },
  {
    target: '#tour-new-match',
    content: 'Para começar uma nova análise, avance para abrir o formulário.',
    placement: 'bottom',
    disableOverlayClose: true,
    disableBeacon: true,
    title: 'Criar Partida',
  },
  {
    target: '#tour-create-match-submit',
    content: 'Preencha os detalhes (tente colar um link de um vídeo do YouTube!) e clique nativamente em "Criar Partida" para enviar.',
    placement: 'top',
    disableOverlayClose: true,
    hideFooter: true,
    disableBeacon: true,
    spotlightClicks: true,
    title: 'Salvar',
  },
  {
    target: '#tour-actions-panel',
    content: 'Com a partida criada, o painel central é usado para registrar os arremessos e ações enquanto o vídeo rola.',
    placement: 'left',
    disableBeacon: true,
    title: 'Marcar Ações',
  },
  {
    target: '#tour-share-btn',
    content: 'Quando terminar sua análise, gere o link mágico e compartilhe tudo com seu time de modo fácil e interativo!',
    placement: 'bottom',
    disableBeacon: true,
    title: 'Compartilhar',
  }
];

const CustomTooltip = ({
  index,
  step,
  controls,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps) => {
  const { setStepIndex, finishTour } = useTourStore();
  const navigate = useNavigate();
  return (
    <div
      {...tooltipProps}
      className="bg-card w-full max-w-sm border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
    >
      {/* Top blue accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-blue-400 to-primary" />
      
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Play className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground m-0 p-0 leading-none">
              {step.title}
            </h3>
            <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1 block tracking-wider">
              Passo {index + 1} de {STEPS.length}
            </span>
          </div>
        </div>
        
        {/* Close Button */}
        <button
          onClick={() => {
            controls.close();
            finishTour();
          }}
          className="p-1 rounded-md text-muted-foreground hover:bg-elevated hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <p className="text-sm text-text-secondary leading-relaxed">
          {step.content}
        </p>
      </div>

      {/* Footer / Progression */}
      <div className="px-5 pb-4 flex items-center justify-between">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-5 bg-primary' : i < index ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {index > 0 && !step.hideFooter && (
            <button
              onClick={() => {
                controls.prev();
                setStepIndex(Math.max(0, index - 1));
              }}
              className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-foreground rounded-lg transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar
            </button>
          )}

          {step.hideFooter && (
            <div className="w-full flex justify-center py-2 px-3 mt-1 rounded-lg bg-primary/20 border border-primary/40 animate-pulse transition-all">
              <span className="text-primary font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Interaja com o botão destacado
              </span>
            </div>
          )}

          {!step.hideFooter && (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (isLastStep) {
                  controls.close();
                  finishTour();
                } else {
                  controls.next();
                  if (index === 0) {
                    window.dispatchEvent(new CustomEvent('tour:open-sidebar'));
                    setTimeout(() => setStepIndex(1), 150);
                  } else if (index === 1) {
                    navigate('/videos');
                    setTimeout(() => setStepIndex(2), 400);
                  } else if (index === 2) {
                    window.dispatchEvent(new CustomEvent('tour:open-modal'));
                    setTimeout(() => setStepIndex(3), 400);
                  } else {
                    setStepIndex(index + 1);
                  }
                }
              }}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              {isLastStep ? 'Concluir' : 'Próximo'}
              {!isLastStep && <ArrowRight className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const OnboardingTutorial = () => {
  const { run, stepIndex, setStepIndex, finishTour, startTour, hasSeenTour } = useTourStore();
  const isAuthenticated = useAuthStore((s) => !!s.user);
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-start on first login
  useEffect(() => {
    if (isAuthenticated && !hasSeenTour && !run && stepIndex === 0) {
      const t = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, hasSeenTour, run, stepIndex, startTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, action, index } = data;
    
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Logic is now bypass-triggered in CustomTooltip directly
    // This callback is only for passive monitoring and error tracking
    if (type === 'error:target_not_found') {
      toast.error(`Tutorial não encontrou o elemento da etapa ${index + 1}. Verifique se o menu lateral está visível!`);
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      run={run}
      stepIndex={stepIndex}
      steps={STEPS}
      tooltipComponent={CustomTooltip}
      floaterProps={{
        hideArrow: true,
        styles: {
          floater: {
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))',
          }
        }
      }}
      styles={{
        options: {
          overlayColor: 'rgba(0, 0, 0, 0.65)',
          zIndex: 10000,
          primaryColor: 'hsl(var(--primary))',
        }
      }}
    />
  );
};

export default OnboardingTutorial;
