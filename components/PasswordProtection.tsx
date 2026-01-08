
import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldCheck, KeyRound } from 'lucide-react';

interface Props {
  onUnlock: () => void;
}

export const PasswordProtection: React.FC<Props> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('app_password');
    if (!saved) {
      setIsSetup(true);
    }
  }, []);

  const handleAction = () => {
    if (isSetup) {
      if (password.length < 4) {
        setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
        return;
      }
      localStorage.setItem('app_password', btoa(password));
      onUnlock();
    } else {
      const saved = localStorage.getItem('app_password');
      if (btoa(password) === saved) {
        onUnlock();
      } else {
        setError('كلمة مرور خاطئة');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-indigo-100 rounded-full mb-4">
            {isSetup ? <KeyRound size={40} className="text-indigo-600" /> : <Lock size={40} className="text-indigo-600" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isSetup ? 'إعداد كلمة المرور' : 'الحافظة محمية'}
          </h1>
          <p className="text-slate-500 mt-2 text-center">
            {isSetup 
              ? 'يرجى إنشاء كلمة مرور لحماية بياناتك المنسوخة' 
              : 'أدخل كلمة المرور للوصول إلى محتويات الحافظة'}
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="****"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center text-xl tracking-widest"
          />
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
          <button
            onClick={handleAction}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isSetup ? <ShieldCheck size={20} /> : <Unlock size={20} />}
            {isSetup ? 'حفظ وإعداد' : 'فتح الحافظة'}
          </button>
        </div>
      </div>
    </div>
  );
};
