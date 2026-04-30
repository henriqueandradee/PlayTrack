import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Flag para controlar se deve redirecionar em 401
// Durante hydrate(), ignoramos 401 pois é esperado se não estiver logado
let isHydrating = false;

export const setIsHydrating = (value: boolean) => {
  isHydrating = value;
};

const api = axios.create({
  baseURL,
  // ✅ Removido: withCredentials (usaremos Authorization header agora)
});

// ✅ Interceptor de request para adicionar token via Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !isHydrating) {
      // Token expirou ou é inválido (e não é durante a hydration inicial)
      // Limpa token e redireciona para login
      localStorage.removeItem('token');
      const currentUrl = window.location.pathname;
      
      // Usa dynamic import para evitar dependência circular e chama logout
      import('@/stores/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
        if (currentUrl !== '/login' && currentUrl !== '/register') {
          window.location.href = '/login?session_expired=true';
        }
      });
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const details = data.errors
        .map((item: { field?: string; message?: string }) => {
          if (!item?.message) return null;
          return item.field ? `${item.field}: ${item.message}` : item.message;
        })
        .filter(Boolean)
        .join(' | ');

      if (details) return details;
    }

    if (Array.isArray(data?.missingConsents) && data.missingConsents.length > 0) {
      return `Consentimentos obrigatorios pendentes: ${data.missingConsents.join(', ')}`;
    }

    if (Array.isArray(data?.details?.errors) && data.details.errors.length > 0) {
      const details = data.details.errors
        .map((item: { field?: string; message?: string }) => {
          if (!item?.message) return null;
          return item.field ? `${item.field}: ${item.message}` : item.message;
        })
        .filter(Boolean)
        .join(' | ');

      if (details) return details;
    }

    return data?.message || 'Erro inesperado. Tente novamente.';
  }
  return 'Erro de conexão.';
};

export default api;
