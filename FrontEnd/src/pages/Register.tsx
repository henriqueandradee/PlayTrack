import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import api, { getErrorMessage } from '@/lib/api';
import { validateAge } from '@/lib/ageValidator';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ✅ LGPD Art. 14: Validação de maioridade
    if (dateOfBirth) {
      const ageValidation = validateAge(dateOfBirth, 18);
      if (!ageValidation.isValid) {
        setError('Você deve ter pelo menos 18 anos para se registrar.');
        return;
      }
    }

    // ✅ LGPD Art. 7-8: Validação de consentimento (não pré-marcado)
    if (!termsAccepted || !privacyAccepted) {
      setError('Você deve aceitar os Termos de Uso e Política de Privacidade para continuar.');
      return;
    }

    // Validação mínima no frontend (backend faz a validação completa)
    if (password.length < 12) {
      setError('A senha deve ter no mínimo 12 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        username,
        email,
        password,
        dateOfBirth: dateOfBirth || null,
        consents: {
          termsAccepted,
          privacyAccepted,
        },
      });
      // ✅ Token agora é retornado na resposta, passamos para authStore
      login(res.data.data.user, res.data.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden bg-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.3 }} />
        <div className="relative z-10 text-center px-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src="/logo.png" alt="PlayTrack" className="h-12 w-12 object-contain" />
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">PlayTrack</h1>
          </div>
          <p className="text-xl text-text-secondary max-w-md">
            PlayTrack é uma plataforma de análise tática e estatística de basquete para atletas e treinadores. Com um player integrado ao YouTube, você assiste à própria partida e registra jogadas, estatísticas e anotações no momento exato do vídeo.
          </p>
          <p className="mt-4 text-sm text-text-secondary max-w-md">
            Os vídeos ficam no YouTube, e o PlayTrack armazena apenas as análises. O plano gratuito permite analisar 3 jogos; no Pro, você libera vídeos e registros ilimitados, além de histórico de estatísticas.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="PlayTrack" className="h-8 w-8 object-contain" />
            <h1 className="text-2xl font-bold text-foreground">PlayTrack</h1>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Criar conta</h2>
          <p className="text-text-secondary mb-6">Crie sua conta para começar a estudar o próprio jogo com mais profundidade</p>

          {error && (
            <div className="p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Nome de usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-elevated border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="seu_usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-elevated border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            
            {/* ✅ LGPD Art. 14: Campo de data de nascimento */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Data de Nascimento</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-elevated border border-border text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
              <p className="text-xs text-text-secondary mt-1">Você deve ter pelo menos 18 anos para usar o PlayTrack.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                className="w-full px-3 py-2.5 rounded-lg bg-elevated border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Mínimo 12 caracteres (1 maiúscula + 1 número)"
              />
            </div>

            {/* ✅ LGPD Art. 7-8: Consentimento Explícito (não pré-marcado) */}
            <div className="space-y-3 p-3 rounded-lg bg-elevated/50 border border-border">
              <p className="text-xs font-medium text-text-secondary uppercase">Consentimento Obrigatório</p>
              
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-text-secondary cursor-pointer">
                  Li e aceito os{' '}
                  <Link to="/terms" className="text-primary hover:underline font-medium">
                    Termos de Uso
                  </Link>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary cursor-pointer"
                />
                <label htmlFor="privacy" className="text-sm text-text-secondary cursor-pointer">
                  Li e aceito a{' '}
                  <Link to="/privacy" className="text-primary hover:underline font-medium">
                    Política de Privacidade
                  </Link>
                </label>
              </div>

              <p className="text-xs text-text-secondary ml-7">
                Consulte também nossa{' '}
                <Link to="/cookies" className="text-primary hover:underline font-medium">
                  Política de Cookies
                </Link>
                .
              </p>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
