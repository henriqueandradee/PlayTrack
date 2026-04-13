import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Cookies = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/mais')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Política de Cookies</h1>
            <p className="text-sm text-text-secondary">PlayTrack - Última atualização: 10 de abril de 2026</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 text-text-secondary">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">1. O que são cookies</h2>
          <p>
            Cookies são pequenos arquivos salvos no navegador para manter sessão, segurança e preferências.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">2. Categorias usadas pela PlayTrack</h2>
          <div className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Categoria</th>
                  <th className="text-left py-2">Finalidade</th>
                  <th className="text-left py-2">Base legal LGPD</th>
                  <th className="text-left py-2">Prazo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2">Essenciais</td>
                  <td className="py-2">Autenticação e proteção da conta</td>
                  <td className="py-2">Execução de contrato / segurança</td>
                  <td className="py-2">Sessão e até 7 dias</td>
                </tr>
                <tr>
                  <td className="py-2">Preferência</td>
                  <td className="py-2">Idioma, tema e escolha de consentimento</td>
                  <td className="py-2">Consentimento</td>
                  <td className="py-2">Até 12 meses</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">3. Como gerenciar cookies</h2>
          <p>
            Você pode ajustar sua escolha pelo banner de cookies e pelas configurações do navegador. Cookies
            essenciais podem ser necessários para autenticação e segurança da conta.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">4. Contato do encarregado</h2>
          <p>
            Para dúvidas sobre cookies e privacidade, entre em contato em contato@playtrack.com.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Cookies;
