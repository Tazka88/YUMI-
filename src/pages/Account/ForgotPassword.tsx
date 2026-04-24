import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
      toast.success('Lien de réinitialisation envoyé !');
    } catch (error: any) {
      toast.error('Une erreur est survenue. Vérifiez l\'email saisi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        {!submitted ? (
          <>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <KeyRound className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900">Mot de passe oublié</h2>
              <p className="mt-2 text-sm text-gray-600">
                Entrez votre adresse email pour recevoir un lien de réinitialisation.
              </p>
            </div>
            
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-50"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>

              <div className="text-center mt-6">
                <Link to="/account/login" className="inline-flex items-center text-sm font-bold text-orange-600 hover:underline">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la connexion
                </Link>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Vérifiez vos emails</h2>
            <p className="text-sm text-gray-600">
              Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. 
              Vérifiez également votre dossier de courriers indésirables (spams).
            </p>
            <Link to="/account/login" className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg">
              Retour à la connexion
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
