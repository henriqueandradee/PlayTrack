import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);

  // Aguarda a hidratação completar antes de renderizar rotas protegidas
  if (!hydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
