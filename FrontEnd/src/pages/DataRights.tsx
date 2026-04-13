import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '@/lib/api';

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const getFileNameFromDisposition = (disposition: string | undefined, fallback: string) => {
  if (!disposition) {
    return fallback;
  }

  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
};

const cardClass = 'glass-card p-5 space-y-4';
const primaryButtonClass =
  'inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50';

const DataRights = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const backTarget = (location.state as { from?: string } | null)?.from || '/mais';
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const downloadFile = async (url: string, fallbackFileName: string) => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const fileName = getFileNameFromDisposition(
        res.headers?.['content-disposition'],
        fallbackFileName
      );
      downloadBlob(res.data, fileName);
      setMessage('Seus dados foram baixados com sucesso.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = async (fallbackFileName: string) => {
    await downloadFile('/gdpr/portability-request?format=json', fallbackFileName);
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(backTarget)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Direitos de Dados (LGPD)</h1>
            <p className="text-sm text-text-secondary">
              Exerça seus direitos de acesso, portabilidade e controle dos seus dados pessoais.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {message && <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</div>}

        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-foreground">Direito de Acesso (Art. 18)</h2>
          <p className="text-sm text-text-secondary">
            Veja o que a PlayTrack mantém sobre sua conta, com mais detalhes e contexto do seu perfil e do seu uso.
          </p>
          <button
            onClick={() => downloadJson('playtrack_data.json')}
            disabled={loading}
            className={primaryButtonClass}
          >
            {loading ? 'Processando...' : 'Baixar JSON'}
          </button>
        </section>

        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-foreground">Portabilidade (Art. 20)</h2>
          <p className="text-sm text-text-secondary">
            Receba um arquivo JSON mais direto para levar seus dados para outro serviço ou guardar em outro lugar.
          </p>
          <button
            onClick={() => downloadJson('playtrack_portability.json')}
            disabled={loading}
            className={primaryButtonClass}
          >
            {loading ? 'Processando...' : 'Baixar JSON'}
          </button>
        </section>
      </div>
    </div>
  );
};

export default DataRights;
