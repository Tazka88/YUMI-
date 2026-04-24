import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isFetchError = this.state.error?.message.includes('fetch');
      
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center border border-gray-100">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCcw className="w-10 h-10 text-orange-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isFetchError ? "Erreur de connexion" : "Oups ! Quelque chose s'est mal passé"}
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              {isFetchError 
                ? "Il semble y avoir un problème avec votre connexion internet ou notre serveur. Veuillez réessayer." 
                : "Une erreur inattendue est survenue. Nous nous excusons pour le désagrément."}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <RefreshCcw size={20} />
                Réessayer
              </button>
              
              <a
                href="/"
                className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Home size={20} />
                Retour à l'accueil
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
