import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (user: User, token: string) => void; // ✅ Agora recebe token
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  hydrated: false,

  login: (user, token) => {
    // ✅ Salva token em localStorage para enviar via Authorization header
    localStorage.setItem('token', token);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    // ✅ Remove token do localStorage
    localStorage.removeItem('token');
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
      // O token será enviado automaticamente pelo axios via Authorization header
      const { default: api, setIsHydrating } = await import('@/lib/api');
      
      // Avisa que estamos em hydrate para não redirecionar em 401
      setIsHydrating(true);
      
      const response = await api.get('/auth/me');
      set({ user: response.data.data.user, isAuthenticated: true, hydrated: true });
    } catch (err) {
      // Token expirou, é inválido, ou usuário não autenticado — limpa localStorage
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, hydrated: true });
    } finally {
      // Terminou hydrate, agora pode redirecionar em 401 novamente
      const { setIsHydrating } = await import('@/lib/api');
      setIsHydrating(false);
    }
  },
}));
