import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, CreditCard, ChevronRight, GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { PlanBadge } from '@/components/PlanBadge';
import { PricingModal } from '@/components/PricingModal';
import { useTutorial } from '@/components/OnboardingTutorial';

const Settings = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [pricingOpen, setPricingOpen] = useState(false);
  const { startTutorial } = useTutorial();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    } finally {
      logout();
      navigate('/login');
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-6">Configurações</h1>

      {/* Profile */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Perfil</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Nome de usuário</span>
            <span className="text-foreground">{user.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Email</span>
            <span className="text-foreground">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Plan */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Plano</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground font-medium">Plano atual</p>
            <PlanBadge plan={user.plan} className="mt-1" />
          </div>
          {user.plan === 'free' && (
            <button onClick={() => setPricingOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
              Ver plano Pro
            </button>
          )}
        </div>
      </div>

      {/* Tutorial */}
      <div className="glass-card p-5 mb-4">
        <button
          onClick={startTutorial}
          className="flex items-center justify-between w-full group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">Ver tutorial novamente</p>
              <p className="text-xs text-text-secondary">Reveja o passo a passo do PlayTrack</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-text-secondary group-hover:text-primary transition-colors" />
        </button>
      </div>

      {/* Mais */}
      <div className="glass-card p-5 mb-6">
        <Link to="/mais" className="flex items-center justify-between group overflow-hidden rounded-md p-1 -m-1 hover:bg-muted/50 transition-colors">
          <div>
            <p className="text-sm font-medium text-foreground">Mais</p>
            <p className="text-xs text-text-secondary">Privacidade, termos e direitos de dados</p>
          </div>
          <ChevronRight className="h-4 w-4 text-text-secondary group-hover:text-primary transition-colors" />
        </Link>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium"
      >
        <LogOut className="h-4 w-4" />
        Sair da conta
      </button>

      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </div>
  );
};

export default Settings;
