import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

// Mapeamento de rotas para chaves de tradução
const routeTitleMap: Record<string, string> = {
  '/': 'login.title',
  '/login': 'login.title',
  '/signup': 'signup.title',
  '/inicio': 'dashboard.title',
  '/gerenciador-conexoes': 'menu.connectionManager',
  '/disparos': 'menu.dispatches',
  '/crm': 'menu.crm',
  '/mindclerky': 'menu.mindClerky',
  '/integracao': 'menu.integration',
  '/agente-ia': 'menu.aiAgent',
  '/documentacao': 'menu.documentation',
  '/configuracoes': 'menu.settings',
  '/gerenciador-grupos': 'menu.groupManager',
};

export const usePageTitle = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    const route = location.pathname;
    const titleKey = routeTitleMap[route] || 'common.appName';
    const pageTitle = t(titleKey);
    document.title = `Clerky - ${pageTitle}`;
  }, [location.pathname, t]);
};

