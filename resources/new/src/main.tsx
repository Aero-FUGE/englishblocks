import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { GameErrorBoundary } from './components/GameErrorBoundary';
import './index.css';

// Respect an explicit page theme; otherwise use the current season.
if(!document.documentElement.dataset.season){const month=new Date().getMonth()+1;document.documentElement.dataset.season=month>=3&&month<=5?'spring':month>=6&&month<=8?'summer':month>=9&&month<=11?'autumn':'winter';}

createRoot(document.getElementById('root')!).render(<GameErrorBoundary><App /></GameErrorBoundary>);
