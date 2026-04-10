import { X, Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export const UpgradeModal = ({ open, onClose, message }: UpgradeModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-card p-6 max-w-md w-full mx-4 animate-fade-in">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-semibold text-foreground">Assinar plano Pro</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-text-secondary mb-4">
          {message || 'Você atingiu o limite do plano gratuito. Assine o plano Pro e desbloqueie recursos ilimitados.'}
        </p>
        <div className="glass-card p-4 mb-4 border-primary/30">
          <div className="text-xl font-bold text-foreground mb-1">R$29<span className="text-sm font-normal text-text-secondary">/mês</span></div>
          <ul className="space-y-1 text-sm text-text-secondary">
            <li>✓ Vídeos ilimitados</li>
            <li>✓ Registros ilimitados</li>
            <li>✓ Geração de vídeos</li>
            <li>✓ Histórico de carreira completo</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-elevated transition-colors text-sm"
          >
            Agora não
          </button>
          <button
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors text-sm font-medium"
          >
            Em breve
          </button>
        </div>
      </div>
    </div>
  );
};
