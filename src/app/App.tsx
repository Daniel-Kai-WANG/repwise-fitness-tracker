import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { DatabaseGate } from './DatabaseGate';
import { ThemeManager } from './ThemeManager';

export function App() {
  return (
    <DatabaseGate>
      <ThemeManager>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ThemeManager>
    </DatabaseGate>
  );
}
