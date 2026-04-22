import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Video, BarChart3, Settings, LogOut, Sparkles, Menu, X, ChevronLeft, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { PlanBadge } from '@/components/PlanBadge';
import { PricingModal } from '@/components/PricingModal';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import { useState } from 'react';
import { useTourStore } from '@/stores/tourStore';

const navItems = [

  { to: '/videos', icon: Video, label: 'Jogos' },
  { to: '/stats', icon: BarChart3, label: 'Estatísticas' },
  { to: '/evolution', icon: TrendingUp, label: 'Evolução' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

const SidebarContent = ({ user, planType, sidebarExpanded, setSidebarExpanded, handleLogout, setPricingOpen, setSidebarOpen }: any) => (
  <>
    {/* Header */}
    <div className={`flex border-b border-border transition-all duration-300 ${sidebarExpanded ? 'items-center gap-2 p-4' : 'flex-col items-center justify-center p-3 h-20'}`}>
      <NavLink
        to="/videos"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
      >
        <img src="/logo.png" alt="PlayTrack" className={`${sidebarExpanded ? 'h-8 w-8' : 'h-6 w-6'} shrink-0 object-contain`} />
        {sidebarExpanded && <span className="text-lg font-bold text-foreground whitespace-nowrap">PlayTrack</span>}
      </NavLink>
    </div>

    {/* Toggle Button */}
    <div className={`px-1 py-2 transition-all duration-300 ${sidebarExpanded ? 'px-2' : 'flex justify-center'}`}>
      <button
        onClick={() => setSidebarExpanded(!sidebarExpanded)}
        className={`hidden md:flex gap-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors shrink-0 ${
          sidebarExpanded ? 'px-3 py-2 w-full text-sm font-medium items-center justify-start' : 'p-2 h-10 w-10 items-center justify-center'
        }`}
        title={sidebarExpanded ? 'Recolher' : 'Expandir'}
      >
        <ChevronLeft className={`h-5 w-5 transition-transform ${sidebarExpanded ? 'rotate-0' : 'rotate-180'}`} />
        {sidebarExpanded && <span className="truncate">Recolher</span>}
      </button>
    </div>

    {/* Navigation */}
    <nav className={`flex-1 transition-all duration-300 ${sidebarExpanded ? 'px-2 space-y-1' : 'px-1 space-y-2 flex flex-col items-center'}`}>
      {navItems.filter(item => !item.showFor || item.showFor.includes(planType)).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          id={item.to === '/videos' ? 'tour-nav-videos' : undefined}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg transition-all duration-200 shrink-0 hover-lift ${
              sidebarExpanded ? 'px-3 py-2.5 w-full text-sm font-medium justify-start' : 'p-2.5 h-10 w-10 justify-center'
            } ${
              isActive
                ? 'bg-primary/15 text-primary shadow-sm'
                : 'text-text-secondary hover:text-foreground hover:bg-accent/50'
            }`
          }
          title={!sidebarExpanded ? item.label : ''}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {sidebarExpanded && <span className="truncate font-medium">{item.label}</span>}
        </NavLink>
      ))}
    </nav>

    {/* Footer */}
    <div className={`border-t border-border transition-all duration-300 flex flex-col items-center ${sidebarExpanded ? 'p-4' : 'p-3'}`}>
      {planType === 'free' && sidebarExpanded && (
        <button onClick={() => setPricingOpen(true)} className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-sm font-medium hover:from-primary/30 hover:to-primary/20 transition-all duration-200 border border-primary/20 hover:border-primary/30 hover-lift">
          <Sparkles className="h-4 w-4 shrink-0" />
          Assinar plano Pro
        </button>
      )}
      <div className={`flex transition-all duration-300 w-full ${sidebarExpanded ? 'flex-row items-center gap-3' : 'flex-col items-center gap-2'}`}>
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
          {user.username[0].toUpperCase()}
        </div>
        {sidebarExpanded && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user.username}</p>
              <div className="text-xs mt-0.5">
                <PlanBadge plan={user.plan} />
              </div>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors shrink-0" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  </>
);

const AppLayout = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [pricingOpen, setPricingOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
    
    // Listen for tour opening the sidebar on mobile
    const handleTourOpenSidebar = () => setSidebarOpen(true);
    window.addEventListener('tour:open-sidebar', handleTourOpenSidebar);
    return () => window.removeEventListener('tour:open-sidebar', handleTourOpenSidebar);
  }, [isAuthenticated, navigate]);

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

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  const planType = typeof user.plan === 'string' ? user.plan : (user.plan as any)?.type ?? 'free';



  return (
    <div className="h-screen w-screen overflow-hidden flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-50 lg:z-auto top-0 left-0 h-full ${sidebarExpanded ? 'w-64' : 'w-20'} bg-card border-r border-border flex flex-col transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-soft`}>
        <SidebarContent 
          user={user} 
          planType={planType} 
          sidebarExpanded={sidebarExpanded} 
          setSidebarExpanded={setSidebarExpanded} 
          handleLogout={handleLogout} 
          setPricingOpen={setPricingOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header inline */}
        <div className="lg:hidden shrink-0 z-30 h-14 bg-card border-b border-border flex items-center px-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-foreground">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2 ml-3">
            <img src="/logo.png" alt="PlayTrack" className="h-6 w-6 object-contain" />
            <span className="font-bold text-foreground">PlayTrack</span>
          </div>
        </div>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <OnboardingTutorial />
      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </div>
  );
};

export default AppLayout;
