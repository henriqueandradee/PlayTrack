import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Termos de Uso</h1>
            <p className="text-sm text-text-secondary">PlayTrack - Última atualização: 10 de abril de 2026</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-invert max-w-none">
          <article className="text-base leading-relaxed text-foreground space-y-6">
            {/* Intro */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-3">ACEITAÇÃO DOS TERMOS</h2>
              <p className="text-text-secondary">
                Ao acessar e usar a plataforma PlayTrack ("Serviço"), você concorda em estar vinculado por estes Termos de Uso ("Termos"). Se você não concorda com qualquer parte destes Termos, você não pode usar o Serviço.
              </p>
            </section>

            {/* Seção 1 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">1. ELEGIBILIDADE E CRIAÇÃO DE CONTA</h2>
              
              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">1.1. Quem Pode Usar</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Você deve ter <strong>18 anos ou mais</strong> (ou maioridade legal)</li>
                <li>Você não pode estar sob interdição legal</li>
                <li>Você deve ter capacidade legal para celebrar contratos</li>
              </ul>

              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">1.2. Criação de Conta</h3>
              <p className="text-text-secondary mb-3">Para usar o Serviço, você precisa criar uma conta fornecendo:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
                <li>Email válido</li>
                <li>Nome de usuário único</li>
                <li>Senha com mínimo 12 caracteres</li>
                <li>Aceitação destes Termos e da Política de Privacidade</li>
              </ul>

              <p className="text-text-secondary">Você é responsável por:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Manter a confidencialidade de sua senha</li>
                <li>Todas as atividades em sua conta</li>
                <li>Notificar-nos imediatamente de usos não autorizados</li>
              </ul>
            </section>

            {/* Seção 2 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">2. USOS PROIBIDOS</h2>
              
              <p className="text-text-secondary mb-4">Você <strong>NÃO pode</strong>:</p>
              
              <div className="space-y-3">
                <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
                  <h4 className="font-semibold text-destructive mb-1">Conteúdo Ilícito</h4>
                  <p className="text-sm text-text-secondary">Fazer upload de conteúdo ilegal, material obsceno ou que viole direitos autorais</p>
                </div>

                <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
                  <h4 className="font-semibold text-destructive mb-1">Abuso de Serviço</h4>
                  <p className="text-sm text-text-secondary">Tentar acesso não autorizado, engenharia reversa, criação de bots, ataques DDoS</p>
                </div>

                <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
                  <h4 className="font-semibold text-destructive mb-1">Comportamento Abusivo</h4>
                  <p className="text-sm text-text-secondary">Assédio, ameaça, discriminação, spam ou golpes</p>
                </div>

                <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
                  <h4 className="font-semibold text-destructive mb-1">Privacidade de Terceiros</h4>
                  <p className="text-sm text-text-secondary">Compartilhar dados pessoais, publicar vídeos sem permissão ou divulgar CPF/RG</p>
                </div>
              </div>
            </section>

            {/* Seção 3 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">3. PROPRIEDADE INTELECTUAL</h2>
              
              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">3.1. Seu Conteúdo</h3>
              <p className="text-text-secondary mb-3">
                <strong>Propriedade:</strong> Você mantém propriedade total de vídeos e análises que você cria.
              </p>
              <p className="text-text-secondary mb-3">
                <strong>Licença para PlayTrack:</strong> Ao fazer upload, você concorda que PlayTrack pode armazenar, processar e exibir seu conteúdo.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">3.2. Propriedade de PlayTrack</h3>
              <p className="text-text-secondary">
                PlayTrack detém propriedade intelectual de todo software, design, algoritmos e logos. Você não pode copiar, modificar ou fazer engenharia reversa.
              </p>
            </section>

            {/* Seção 4 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">4. PLANOS E ASSINATURA</h2>
              
              <div className="bg-card border border-border p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-primary mb-2">Plano Gratuito</h4>
                <ul className="list-disc list-inside text-text-secondary space-y-1 text-sm">
                  <li>3 vídeos máximo</li>
                  <li>Análise tática básica</li>
                  <li>Sem suporte prioritário</li>
                </ul>
              </div>

              <div className="bg-card border border-border p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-primary mb-2">Plano Pro</h4>
                <ul className="list-disc list-inside text-text-secondary space-y-1 text-sm">
                  <li>Vídeos ilimitados</li>
                  <li>Análise tática avançada</li>
                  <li>Suporte prioritário</li>
                  <li>Exportação de relatórios</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">4.3. Cancelamento</h3>
              <p className="text-text-secondary">
                Você pode cancelar sua assinatura Pro a qualquer momento em Configurações &gt; Plano. O cancelamento interrompe as cobranças futuras, e o acesso permanece até o fim do ciclo já pago.
              </p>
            </section>

            {/* Seção 5 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">5. LIMITAÇÃO DE RESPONSABILIDADE</h2>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-yellow-600 mb-2">ISENÇÃO DE GARANTIAS</h3>
                <p className="text-sm text-text-secondary mb-2">
                  PlayTrack fornece Serviço "COMO ESTÁ" e "CONFORME DISPONÍVEL". Não garantimos:
                </p>
                <ul className="list-disc list-inside text-text-secondary space-y-1 text-sm">
                  <li>Acurácia 100% de análise tática</li>
                  <li>Disponibilidade 24/7 (visamos 99.5%)</li>
                  <li>Funcionalidades específicas futuras</li>
                  <li>Compatibilidade com todos navegadores</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">Indenização Máxima</h3>
              <p className="text-text-secondary">
                PlayTrack não é responsável por danos indiretos ou punitivos. Indenização máxima: valor que você pagou nos últimos 12 meses (ou R$100 se plano gratuito).
              </p>
            </section>

            {/* Seção 6 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">6. ENCERRAMENTO DE CONTA</h2>
              
              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">6.1. Encerramento por Você</h3>
              <p className="text-text-secondary">
                Você pode deletar sua conta em Configurações. Após 30 dias de inatividade, dados serão permanentemente deletados.
              </p>

              <h3 className="text-lg font-semibold text-foreground mt-5 mb-2">6.2. Encerramento por PlayTrack</h3>
              <p className="text-text-secondary">PlayTrack pode encerrar sua conta se:</p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Violar estes Termos</li>
                <li>Engajar em atividade ilícita</li>
                <li>Representar risco de segurança</li>
                <li>Inatividade por 2+ anos</li>
                <li>Falha de pagamento Pro</li>
              </ul>
            </section>

            {/* Seção 7 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">7. LEI APLICÁVEL</h2>
              <p className="text-text-secondary mb-3">
                Estes Termos são regidos por <strong>Lei Brasileira</strong>, especialmente:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2">
                <li>Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)</li>
                <li>Código de Proteção do Consumidor (CDC - Lei 8.078/1990)</li>
                <li>Código Civil Brasileiro</li>
              </ul>
            </section>

            {/* Seção 8 */}
            <section>
              <h2 className="text-xl font-bold text-foreground mt-8 mb-3">8. CONTATO</h2>
              
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <p className="text-text-secondary mb-2">Para dúvidas sobre estes Termos:</p>
                <p className="text-text-secondary"><strong>Email:</strong> contato@playtrack.com</p>
                <p className="text-text-secondary"><strong>Tempo de resposta:</strong> 5-10 dias úteis</p>
              </div>
            </section>

            {/* Footer */}
            <section className="mt-12 pt-6 border-t border-border">
              <p className="text-sm text-text-secondary text-center">
                <strong>Última atualização:</strong> 10 de abril de 2026<br />
                <strong>Versão:</strong> 1.0<br />
                <strong>Ao usar PlayTrack, você confirma ter lido e acordado com estes Termos.</strong>
              </p>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
};

export default Terms;
