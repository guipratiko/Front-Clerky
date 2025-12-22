import React from 'react';
import LanguageToggle from './LanguageToggle';

/**
 * Componente para exibir o botão de idioma fixo no canto superior direito
 * Usado nas páginas de login e registro
 */
const FloatingLanguageToggle: React.FC = () => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <LanguageToggle />
    </div>
  );
};

export default FloatingLanguageToggle;

