import { HashRouter } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageProvider';
import { AppRoutes } from './routes';
import { DatabaseGate } from './DatabaseGate';
import { ThemeManager } from './ThemeManager';

export function App() {
  return (
    <LanguageProvider>
      <DatabaseGate>
        <ThemeManager>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </ThemeManager>
      </DatabaseGate>
    </LanguageProvider>
  );
}
