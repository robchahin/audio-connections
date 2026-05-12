import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('root element not found');
// StrictMode is intentionally omitted: it unmounts and remounts each newly
// added DOM node once in development, which re-runs CSS keyframe animations
// (like the solved-banner slide-in). Production behavior is unaffected.
createRoot(rootEl).render(<App />);
