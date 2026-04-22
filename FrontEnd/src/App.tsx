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

import Videos from '@/pages/Videos';
import VideoAnalysis from '@/pages/VideoAnalysis';
import SharedAnalysis from '@/pages/SharedAnalysis';
import Stats from '@/pages/Stats';
import Evolution from '@/pages/Evolution';
import Settings from '@/pages/Settings';
import More from '@/pages/More';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Cookies from '@/pages/Cookies';
import DataRights from '@/pages/DataRights';
import DMCA from '@/pages/DMCA';
import CookieBanner from '@/components/CookieBanner';
import Landing from '@/pages/Landing';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const IndexRedirect = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  
  // Aguarda hydrate antes de redirecionar
  if (!hydrated) return null;
  
  return isAuthenticated ? <Navigate to="/videos" replace /> : <Landing />;
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
            <Route path="/shared/:token" element={<SharedAnalysis />} />
            <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>

              <Route path="/videos" element={<Videos />} />
              <Route path="/videos/:videoId" element={<VideoAnalysis />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/evolution" element={<Evolution />} />
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
