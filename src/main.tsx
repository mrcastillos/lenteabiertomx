import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0c0d0e] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#16181b] p-8 rounded-2xl border border-white/10 text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400 text-2xl font-bold">
              !
            </div>
            <h1 className="font-serif text-2xl mb-2 text-white font-medium">Lente Abierto MX</h1>
            <p className="text-sm text-neutral-400 mb-6">
              Ocurrió un detalle al cargar la aplicación. Puedes reiniciar o restablecer el estado inicial.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition"
              >
                Recargar página
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition"
              >
                Restablecer datos locales
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

