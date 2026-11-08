// The UI fonts (Geist, Geist Mono) and the theme fonts, self-hosted.
// JetBrains Mono: tech labels.
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/chakra-petch/700.css';
import '@fontsource/anton/400.css';
import '@fontsource/jetbrains-mono/700.css';
import { render } from 'solid-js/web';
import { App } from './App.tsx';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

render(() => <App />, root);
