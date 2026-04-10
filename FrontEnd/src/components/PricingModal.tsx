import { X, Check, Sparkles } from 'lucide-react';

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
}

const features = [
  { name: 'Partidas/Vídeos', free: '3', pro: 'Ilimitados' },
  { name: 'Registros por partida', free: 'Ilimitados', pro: 'Ilimitados' },
  { name: 'Anotações', free: 'Sim', pro: 'Sim' },
  { name: 'Linha do tempo de eventos', free: 'Sim', pro: 'Sim' },
  { name: 'Estatísticas', free: 'Sim', pro: 'Sim' },
  { name: 'Gerar vídeo de melhores momentos', free: 'Não', pro: 'Sim' },
  { name: 'Exportar PDF', free: 'Não', pro: 'Sim' },
];

export const PricingModal = ({ open, onClose }: PricingModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="glass-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Plano Gratuito vs Pro</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Cards Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Free Plan */}
            <div className="rounded-lg border border-border bg-elevated/50 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Plano Gratuito</h3>
              <p className="text-text-secondary text-sm mb-4">Perfeito para começar</p>
              <div className="text-3xl font-bold text-foreground mb-4">
                R$ <span className="text-2xl">0</span>
                <span className="text-sm font-normal text-text-secondary">/mês</span>
              </div>
              <button className="w-full px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium cursor-default">
                Seu plano atual
              </button>
            </div>

            {/* Pro Plan */}
            <div className="rounded-lg border border-primary/50 bg-primary/5 p-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                <Sparkles className="h-3 w-3" />
                Recomendado
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Plano Pro</h3>
              <p className="text-text-secondary text-sm mb-4">Para atletas sérios</p>
              <div className="text-3xl font-bold text-foreground mb-4">
                R$ <span className="text-2xl">29</span>
                <span className="text-sm font-normal text-text-secondary">/mês</span>
              </div>
              <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-colors">
                Assinar Pro agora (em breve)
              </button>
            </div>
          </div>

          {/* Comparison Table */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Comparação de Recursos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 font-semibold text-foreground">Recurso</th>
                    <th className="text-center py-3 px-3 font-semibold text-foreground">Gratuito</th>
                    <th className="text-center py-3 px-3 font-semibold text-foreground">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature) => (
                    <tr key={feature.name} className="border-b border-border/50 hover:bg-elevated/30 transition-colors">
                      <td className="py-3 px-3 text-text-primary">{feature.name}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-text-secondary">
                          {feature.free === 'Sim' ? (
                            <Check className="h-5 w-5 text-green-500/70 mx-auto" />
                          ) : feature.free === 'Não' ? (
                            <span className="text-muted-foreground">✗</span>
                          ) : (
                            feature.free
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-text-secondary font-medium">
                          {feature.pro === 'Sim' ? (
                            <Check className="h-5 w-5 text-primary mx-auto" />
                          ) : (
                            feature.pro
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA Footer */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg bg-muted text-muted-foreground hover:bg-elevated transition-colors text-sm font-medium"
            >
              Entendi, obrigado
            </button>
            <button className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors text-sm font-medium">
              Assinar plano Pro (em breve)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
