import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (user: User) => void; // Token é armazenado em httpOnly cookie
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  hydrated: false,

  login: (user) => {
    // Token é armazenado automaticamente no httpOnly cookie pelo backend
    // Apenas armazenamos o user em memória (não persiste no reload)
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (partial) => {
    set((state) => {
      if (!state.user) return state;
      return { user: { ...state.user, ...partial } };
    });
  },

  hydrate: async () => {
    const publicPaths = new Set(['/login', '/register', '/privacy', '/terms', '/cookies', '/dmca']);
    if (publicPaths.has(window.location.pathname)) {
      set({ user: null, isAuthenticated: false, hydrated: true });
      return;
    }

    try {
      // ✅ Tenta recuperar user do servidor via /auth/me
      // O cookie será enviado automaticamente pelo axios com withCredentials
      const { default: api, setIsHydrating } = await import('@/lib/api');
      
      // Avisa que estamos em hydrate para não redirecionar em 401
      setIsHydrating(true);
      
      const response = await api.get('/auth/me');
      set({ user: response.data.data.user, isAuthenticated: true, hydrated: true });
    } catch (err) {
      // Cookie expirou ou é inválido — usuário não autenticado
      set({ user: null, isAuthenticated: false, hydrated: true });
    } finally {
      // Terminou hydrate, agora pode redirecionar em 401 novamente
      const { setIsHydrating } = await import('@/lib/api');
      setIsHydrating(false);
    }
  },
}));
