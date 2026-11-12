import {initializeSeason} from './utils/seasonTheme';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { GameErrorBoundary } from './components/GameErrorBoundary';
import './index.css';
import './lobby.css';
import './page-backgrounds.css';
import './avatars.css';
import './study-tasks.css';

initializeSeason();

createRoot(document.getElementById('root')!).render(<GameErrorBoundary><App /></GameErrorBoundary>);
