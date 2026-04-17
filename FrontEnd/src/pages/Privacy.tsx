import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const Privacy = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const defaultBack = isAuthenticated ? '/mais' : '/';
  const backTarget = (location.state as { from?: string } | null)?.from || defaultBack;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <h1 className="text-2xl font-bold text-foreground">Política de Privacidade</h1>
            <p className="text-sm text-text-secondary">PlayTrack - Última atualização: 10 de abril de 2026</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-invert max-w-none">
          <article className="text-base leading-relaxed text-foreground space-y-6">
            {/* Seção 1 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">1. INTRODUÇÃO</h2>
              <p className="text-text-secondary">
                A PlayTrack ("nós", "nossa", "nosso" ou "Empresa") opera a plataforma PlayTrack (doravante "Serviço"). Levamos a privacidade de seus dados pessoais muito a sério. Esta Política de Privacidade explica de forma direta quais dados coletamos, por que coletamos, como usamos, como protegemos e como você acessa suas informações em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong> e demais legislações brasileiras aplicáveis.
              </p>
            </section>

            {/* Seção 2 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">2. DADOS QUE COLETAMOS</h2>
              
              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">2.1. Dados Fornecidos Diretamente por Você</h3>
              
              <div className="bg-card border border-border p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-foreground mb-2">Dados de Conta</h4>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  <li><strong>Email</strong>: usado para criar e gerenciar sua conta</li>
                  <li><strong>Nome de usuário</strong>: usado para identificar você na plataforma</li>
                  <li><strong>Senha</strong>: usada para autenticação, armazenada de forma criptografada</li>
                  <li><strong>Data de nascimento</strong>: usada para validar elegibilidade e conformidade de uso</li>
                  <li><strong>Consentimentos</strong>: registro de aceitação dos termos e da privacidade</li>
                </ul>
              </div>

              <div className="bg-card border border-border p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-foreground mb-2">Dados de Vídeos e Análise</h4>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  <li><strong>Vídeos</strong>: Conteúdo de video enviado para análise</li>
                  <li><strong>Metadados</strong>: Título, descrição, duração, data de upload</li>
                  <li><strong>Eventos de análise</strong>: Anotações de jogadas, estatísticas, comentários</li>
                  <li><strong>Análises táticas</strong>: Informações derivadas da análise de seus vídeos</li>
                </ul>
              </div>
            </section>

            {/* Seção 3 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">3. SEGURANÇA</h2>
              
              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">3.1. Medidas Técnicas</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li><strong>Criptografia em trânsito</strong>: HTTPS/TLS 1.2+ para todas as comunicações</li>
                <li><strong>Autenticação</strong>: JWT com expiração de 7 dias e sessão protegida por cookie seguro</li>
                <li><strong>Cookies seguros</strong>: HttpOnly, Secure, SameSite=Strict</li>
                <li><strong>Limitação de tentativas</strong>: Proteção contra força bruta (5 tentativas de login a cada 15 minutos)</li>
                <li><strong>Validação de entrada</strong>: Prevenção de SQL injection e XSS</li>
                <li><strong>Cabeçalhos de segurança</strong>: Content Security Policy, X-Frame-Options, etc.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">3.2. Base Legal (LGPD)</h2>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li><strong>Execução de contrato</strong>: criação e manutenção da conta e funcionalidades da plataforma.</li>
                <li><strong>Legítimo interesse</strong>: prevenção a fraude, segurança e melhoria técnica do serviço.</li>
                <li><strong>Consentimento</strong>: comunicações de marketing e preferências opcionais de cookies.</li>
                <li><strong>Cumprimento de obrigação legal</strong>: retenção mínima de registros exigidos por lei.</li>
              </ul>
            </section>

            {/* Seção 4 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">4. SEUS DIREITOS CONFORME LGPD</h2>
              <p className="text-text-secondary mb-4">Você tem direitos garantidos pela Lei Geral de Proteção de Dados. Para exercer seus direitos, use a área <strong>Direitos de Dados (LGPD)</strong> dentro do app.</p>
              
              <div className="space-y-4">
                <div className="bg-card border border-border p-4 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">Direito de Acesso (Art. 18)</h4>
                  <p className="text-text-secondary text-sm">Você pode baixar na hora uma cópia JSON dos dados pessoais que a PlayTrack mantém sobre sua conta.</p>
                </div>

                <div className="bg-card border border-border p-4 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">Direito de Retificação (Art. 19)</h4>
                  <p className="text-text-secondary text-sm">Corrigir dados incorretos ou incompletos. Edite seu perfil em Configurações ou solicite para dados não editáveis.</p>
                </div>

                <div className="bg-card border border-border p-4 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">Direito ao Esquecimento (Art. 17)</h4>
                  <p className="text-text-secondary text-sm">Solicitar exclusão de todos os dados pessoais. Clique em "Deletar Minha Conta" em Configurações (30 dias de inatividade).</p>
                </div>

                <div className="bg-card border border-border p-4 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">Direito à Portabilidade (Art. 20)</h4>
                  <p className="text-text-secondary text-sm">Baixar um arquivo JSON estruturado para levar seus dados para outro serviço ou guardá-los localmente.</p>
                </div>

                <div className="bg-card border border-border p-4 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">Direito de Oposição (Art. 21)</h4>
                  <p className="text-text-secondary text-sm">Recusar certos tipos de tratamento como marketing ou análise de uso. Configure em Configurações &gt; Comunicações.</p>
                </div>
              </div>
            </section>

            {/* Seção 5 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">5. COOKIES</h2>
              
              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">5.1. O que são Cookies</h3>
              <p className="text-text-secondary mb-4">Cookies são pequenos arquivos de texto armazenados no seu navegador que nos ajudam a reconhecê-lo.</p>

              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">5.2. Cookies que Usamos</h3>
              <div className="bg-card border border-border p-4 rounded-lg mb-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-foreground font-semibold py-2 px-2">Cookies</th>
                      <th className="text-left text-foreground font-semibold py-2 px-2">Propósito</th>
                      <th className="text-left text-foreground font-semibold py-2 px-2">Duração</th>
                    </tr>
                  </thead>
                  <tbody className="text-text-secondary">
                    <tr className="border-b border-border">
                      <td className="py-2 px-2"><code className="bg-background px-2 py-1 rounded">token</code></td>
                      <td className="py-2 px-2">Autenticação (JWT)</td>
                      <td className="py-2 px-2">7 dias</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-2 px-2"><code className="bg-background px-2 py-1 rounded">language</code></td>
                      <td className="py-2 px-2">Preferência de idioma</td>
                      <td className="py-2 px-2">1 ano</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-2 px-2"><code className="bg-background px-2 py-1 rounded">theme</code></td>
                      <td className="py-2 px-2">Preferência claro/escuro</td>
                      <td className="py-2 px-2">1 ano</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2"><code className="bg-background px-2 py-1 rounded">consent</code></td>
                      <td className="py-2 px-2">Registro de consentimento</td>
                      <td className="py-2 px-2">1 ano</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-text-secondary">
                Para informações completas de categorias e controles, consulte a Política de Cookies.
              </p>
            </section>

            {/* Seção 6 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">6. CONTATO</h2>
              
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-primary mb-3">Responsável pela Privacidade</h3>
                <p className="text-text-secondary mb-2"><strong>Email:</strong> contato@playtrack.com</p>
                <p className="text-text-secondary mb-4"><strong>Tempo de resposta:</strong> 15 dias úteis</p>

                <h3 className="text-lg font-semibold text-primary mb-3 mt-4">Reclamação com ANPD</h3>
                <p className="text-text-secondary">Se achar que PlayTrack violou direitos LGPD, você pode reclamar com:</p>
                <p className="text-text-secondary mt-2">
                  <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong><br />
                  Email: ouvidoria@anpd.gov.br<br />
                  Telefone: (61) 2030-7444
                </p>
              </div>
            </section>

            {/* Footer */}
            <section className="mt-12 pt-6 border-t border-border">
              <p className="text-sm text-text-secondary text-center">
                <strong>Última atualização:</strong> 10 de abril de 2026<br />
                <strong>Versão:</strong> 1.0
              </p>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
