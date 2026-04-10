import { useEffect, useState } from 'react';

const CONSENT_KEY = 'playtrack_cookie_consent_v1';

type ConsentValue = 'accepted' | 'rejected';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleDecision = (value: ConsentValue) => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        value,
        acceptedAt: new Date().toISOString(),
      })
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:max-w-lg">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-2xl backdrop-blur">
        <p className="text-sm font-semibold text-foreground">Cookies e Privacidade</p>
        <p className="mt-2 text-sm text-text-secondary">
          Usamos cookies essenciais para autenticação e segurança, e opcionais para melhorar sua experiência.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleDecision('rejected')}
            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            Recusar opcionais
          </button>
          <button
            onClick={() => handleDecision('accepted')}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
