import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from '@/stores/authStore';
import { PrivateRoute } from '@/components/PrivateRoute';
import AppLayout from '@/components/AppLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Videos from '@/pages/Videos';
import VideoAnalysis from '@/pages/VideoAnalysis';
import VideoGenerate from '@/pages/VideoGenerate';
import Stats from '@/pages/Stats';
import Settings from '@/pages/Settings';
import More from '@/pages/More';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Cookies from '@/pages/Cookies';
import DataRights from '@/pages/DataRights';
import DMCA from '@/pages/DMCA';
import CookieBanner from '@/components/CookieBanner';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const IndexRedirect = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  
  // Aguarda hydrate antes de redirecionar
  if (!hydrated) return null;
  
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
};

const App = () => {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Verifica token novamente quando usuário volta da guia inativa
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Usuário voltou para a aba - verifica se still autenticado
        hydrate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hydrate]);

  // Mostra tela em branco enquanto carregando
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <CookieBanner />
          <Routes>
            <Route path="/" element={<IndexRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/dmca" element={<DMCA />} />
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/videos/:videoId" element={<VideoAnalysis />} />
              <Route path="/videos/:videoId/generate" element={<VideoGenerate />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/mais" element={<More />} />
              <Route path="/data-rights" element={<DataRights />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
