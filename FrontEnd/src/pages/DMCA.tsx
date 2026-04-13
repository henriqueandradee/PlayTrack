import { useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';

const DMCA = () => {
  const [form, setForm] = useState({
    reporterName: '',
    reporterEmail: '',
    rightsOwner: '',
    infringingUrl: '',
    originalWorkDescription: '',
    statementGoodFaith: false,
    statementAccuracy: false,
    digitalSignature: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const onChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/compliance/dmca-report', form);
      setMessage('Notificação DMCA enviada com sucesso.');
      setForm({
        reporterName: '',
        reporterEmail: '',
        rightsOwner: '',
        infringingUrl: '',
        originalWorkDescription: '',
        statementGoodFaith: false,
        statementAccuracy: false,
        digitalSignature: '',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">Notificação DMCA / Direitos Autorais</h1>
        <p className="mt-2 text-text-secondary">
          Use este formulário para reportar conteúdo que viole seus direitos autorais.
        </p>

        {error && <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        {message && <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{message}</div>}

        <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Seu nome</label>
            <input className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5" value={form.reporterName} onChange={(e) => onChange('reporterName', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Seu email</label>
            <input type="email" className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5" value={form.reporterEmail} onChange={(e) => onChange('reporterEmail', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Titular dos direitos</label>
            <input className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5" value={form.rightsOwner} onChange={(e) => onChange('rightsOwner', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">URL do conteúdo infrator</label>
            <input type="url" className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5" value={form.infringingUrl} onChange={(e) => onChange('infringingUrl', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Descrição da obra original</label>
            <textarea className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5" rows={5} value={form.originalWorkDescription} onChange={(e) => onChange('originalWorkDescription', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Assinatura digital</label>
            <input className="w-full rounded-lg border border-border bg-elevated px-3 py-2.5" value={form.digitalSignature} onChange={(e) => onChange('digitalSignature', e.target.value)} required />
          </div>

          <label className="flex items-start gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={form.statementGoodFaith} onChange={(e) => onChange('statementGoodFaith', e.target.checked)} className="mt-1" required />
            Declaro, de boa-fé, que o uso do material descrito não foi autorizado.
          </label>
          <label className="flex items-start gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={form.statementAccuracy} onChange={(e) => onChange('statementAccuracy', e.target.checked)} className="mt-1" required />
            Declaro que as informações desta notificação são verdadeiras e corretas.
          </label>

          <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
            {loading ? 'Enviando...' : 'Enviar notificação'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DMCA;
