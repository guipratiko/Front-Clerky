import React from 'react';
import { AppLayout } from '../components/Layout';
import { Card } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <AppLayout>
      <div className="animate-fadeIn">
        {/* Card de boas-vindas */}
        <Card padding="lg" shadow="lg">
          <h2 className="text-xl font-semibold text-clerky-backendText dark:text-gray-200 mb-2">
            {t('dashboard.welcome', { name: user?.name || '' })}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('dashboard.email')}: {user?.email}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('dashboard.successMessage')}
          </p>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Home;

