import { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ComponentShowcase from './ComponentShowcase';
// To preview the full app instead, swap the line above for:  import App from './App';
// and render <App /> below.

/* Shows any crash on the page itself, so you never get a blank white screen. */
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <pre style={{ margin: 24, padding: 16, background: '#fbe4e4', color: '#a32323', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        {'Something crashed while rendering:\n\n' + String(this.state.error?.stack || this.state.error)}
      </pre>
    );
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ComponentShowcase />
    </ErrorBoundary>
  </StrictMode>,
);
