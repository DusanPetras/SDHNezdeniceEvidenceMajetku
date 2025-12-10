
import React, { useState } from 'react';
import { IconFire } from './Icons';
import { login } from '../services/authService';
import { AppUser } from '../types';

interface LoginProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Nesprávné uživatelské jméno nebo heslo.');
      }
    } catch (err) {
      setError('Chyba při přihlašování. Zkontrolujte připojení.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-fire-700 p-8 text-center">
          <div className="inline-block p-3 bg-white/10 rounded-full mb-4">
             <IconFire className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SDH Nezdenice</h1>
          <p className="text-fire-100 text-sm mt-1">Správa majetku a techniky</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Uživatel</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-fire-500"
                placeholder="např. admin"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Heslo</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-fire-500 focus:outline-none focus:ring-fire-500"
                placeholder="••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fire-600 hover:bg-fire-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fire-500 disabled:opacity-50"
            >
              {loading ? 'Přihlašuji...' : 'Přihlásit se'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            Výchozí přístup: admin / admin123
          </div>
        </div>
      </div>
    </div>
  );
};
