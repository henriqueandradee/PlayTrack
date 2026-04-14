import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api, { getErrorMessage } from '@/lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
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
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden bg-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.3 }} />
        <div className="relative z-10 text-center px-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src="/logo.png" alt="PlayTrack" className="h-12 w-12 object-contain" />
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">PlayTrack</h1>
          </div>
          <p className="text-xl text-text-secondary max-w-md">
            Analise seus jogos com vídeo do YouTube, marque jogadas no tempo exato e transforme cada partida em estudo.
          </p>
          <p className="mt-4 text-sm text-text-secondary max-w-md">
            Feito para atletas e treinadores semi-profissionais que querem organizar tática, estatística e anotações em um só lugar.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="PlayTrack" className="h-8 w-8 object-contain" />
            <h1 className="text-2xl font-bold text-foreground">PlayTrack</h1>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Bem-vindo de volta</h2>
          <p className="text-text-secondary mb-6">Entre para revisar partidas, registrar eventos e acompanhar sua evolução</p>

          {error && (
            <div className="p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-elevated border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors pr-10"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            Não tem conta?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
