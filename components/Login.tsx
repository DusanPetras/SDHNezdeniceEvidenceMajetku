
import React, { useState } from 'react';
import { login } from '../services/authService';
import { AppUser } from '../types';
import { IconFire } from './Icons';

interface LoginProps { onLoginSuccess: (user: AppUser) => void; }

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(username, password);
      if (user) onLoginSuccess(user); else setError('Chybné přihlašovací údaje.');
    } catch { setError('Chyba spojení.'); } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 w-full max-w-md rounded-xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-fire-100 p-3 rounded-full mb-3 text-fire-600">
             <IconFire className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SDH Nezdenice</h1>
          <p className="text-gray-500 text-sm">Správa majetku</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Uživatelské jméno</label>
              <input type="text" required value={username} onChange={e=>setUsername(e.target.value)} 
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-fire-500 focus:ring-fire-500 p-2 border" 
                placeholder="Zadejte jméno" />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heslo</label>
              <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} 
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-fire-500 focus:ring-fire-500 p-2 border" 
                placeholder="••••••••" />
          </div>
          {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-2 rounded">{error}</div>}
          <button type="submit" disabled={loading} 
            className="w-full bg-fire-700 hover:bg-fire-800 text-white font-bold py-2.5 rounded-lg shadow transition-colors disabled:opacity-50">
             {loading ? 'Přihlašování...' : 'Přihlásit se'}
          </button>
        </form>
      </div>
    </div>
  );
};
