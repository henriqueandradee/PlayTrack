import { useEffect } from 'react';
import { ArrowLeft, Database, FileText, Shield, Cookie } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const More = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mais</h1>
            <p className="text-sm text-text-secondary">Acesse aqui os documentos e áreas legais da PlayTrack.</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <Link to="/data-rights" state={{ from: '/mais' }} className="glass-card p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors">
            <div className="p-2 bg-muted rounded-md">
              <Database className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Direitos de Dados (LGPD)</p>
              <p className="text-sm text-text-secondary">Baixe seus dados e exerça seus direitos de acesso.</p>
            </div>
          </Link>

          <Link to="/privacy" state={{ from: '/mais' }} className="glass-card p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors">
            <div className="p-2 bg-muted rounded-md">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Política de Privacidade</p>
              <p className="text-sm text-text-secondary">Veja como a PlayTrack coleta, usa e protege seus dados.</p>
            </div>
          </Link>

          <Link to="/terms" state={{ from: '/mais' }} className="glass-card p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors">
            <div className="p-2 bg-muted rounded-md">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Termos de Uso</p>
              <p className="text-sm text-text-secondary">Consulte as regras que valem ao usar a plataforma.</p>
            </div>
          </Link>

          <Link to="/cookies" className="glass-card p-4 flex items-center gap-3 hover:bg-muted/40 transition-colors">
            <div className="p-2 bg-muted rounded-md">
              <Cookie className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Política de Cookies</p>
              <p className="text-sm text-text-secondary">Entenda categorias, base legal e como gerenciar preferências.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default More;