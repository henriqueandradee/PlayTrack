import { useState, useEffect } from 'react';
import { Copy, Check, X, Share2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ShareAnalysisModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareAnalysisModal = ({ videoId, isOpen, onClose }: ShareAnalysisModalProps) => {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchShareLink = async () => {
      setLoading(true);
      try {
        const res = await api.get('/sharing/token', { params: { videoId } });
        if (res.data.data?.shareUrl) {
          setShareLink(res.data.data.shareUrl);
        } else {
          // Se não existe link, cria um novo
          const createRes = await api.post('/sharing/create', { videoId });
          setShareLink(createRes.data.data.shareUrl);
        }
      } catch (err) {
        toast.error('Erro ao gerar link de compartilhamento');
      } finally {
        setLoading(false);
      }
    };

    fetchShareLink();
  }, [isOpen, videoId]);

  const handleCopy = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass-card p-6 max-w-md w-full mx-4 animate-fade-in shadow-medium hover-lift">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Compartilhar Análise</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-accent/50 rounded p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : shareLink ? (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">
              Copie este link e envie para seus atletas estudarem a análise:
            </p>

            <div className="flex items-center gap-2 p-3 bg-elevated border border-border rounded-lg">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-transparent outline-none text-sm text-foreground"
              />
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-primary/15 rounded-lg transition-all duration-200 hover:shadow-sm"
                title="Copiar link"
              >
                {copied ? (
                  <Check size={18} className="text-success" />
                ) : (
                  <Copy size={18} className="text-muted-foreground hover:text-primary" />
                )}
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              O link expira em 30 dias. Você pode gerar um novo link a qualquer momento.
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary border border-border rounded-lg bg-card hover:bg-elevated transition-colors text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
