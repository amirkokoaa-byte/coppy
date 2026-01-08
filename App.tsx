
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clipboard, 
  Trash2, 
  ExternalLink, 
  ShieldAlert, 
  ShieldCheck, 
  MessageCircle, 
  Mail, 
  Phone, 
  Languages, 
  Copy,
  Plus,
  Image as ImageIcon,
  LogOut,
  RefreshCw,
  Search,
  Zap,
  BrainCircuit
} from 'lucide-react';
import { ClipboardItem, ContentType, AIModelType } from './types';
import * as aiService from './services/geminiService';
import { PasswordProtection } from './components/PasswordProtection';

const App: React.FC = () => {
  const [items, setItems] = useState<ClipboardItem[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModelType>('gemini-3-flash-preview');

  // Load items from local storage
  useEffect(() => {
    const saved = localStorage.getItem('clipboard_items');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved items');
      }
    }
  }, []);

  // Save items to local storage
  useEffect(() => {
    localStorage.setItem('clipboard_items', JSON.stringify(items));
  }, [items]);

  const handlePaste = useCallback(async () => {
    try {
      setLoading(true);
      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText) {
        alert("الحافظة فارغة أو لا تحتوي على نص.");
        setLoading(false);
        return;
      }

      // Check for duplicates
      if (items.some(item => item.content === clipboardText)) {
        alert("هذا المحتوى موجود بالفعل في القائمة.");
        setLoading(false);
        return;
      }

      // Analyze content with selected model
      const analysis = await aiService.analyzeContent(clipboardText, selectedModel);
      
      const newItem: ClipboardItem = {
        id: Date.now().toString(),
        content: clipboardText,
        type: analysis.type as ContentType,
        timestamp: Date.now(),
        aiAnalysis: analysis.suggestion,
        metadata: {
          isSafe: analysis.isSafe
        }
      };

      setItems(prev => [newItem, ...prev]);
    } catch (err) {
      console.error('Clipboard access denied', err);
      alert("يرجى منح الإذن للوصول إلى الحافظة.");
    } finally {
      setLoading(false);
    }
  }, [items, selectedModel]);

  const handleImageOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const extractedText = await aiService.extractTextFromImage(base64);
        
        const newItem: ClipboardItem = {
          id: Date.now().toString(),
          content: extractedText,
          type: 'text',
          timestamp: Date.now(),
          aiAnalysis: 'تم استخراج هذا النص من صورة باحترافية.',
          metadata: {
            extractedText
          }
        };
        setItems(prev => [newItem, ...prev]);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('OCR failed', err);
      setLoading(false);
    }
  };

  const handleTranslate = async (id: string, text: string) => {
    setLoading(true);
    try {
      const translation = await aiService.translateText(text, selectedModel);
      setItems(prev => prev.map(item => 
        item.id === id 
          ? { ...item, metadata: { ...item.metadata, translation } } 
          : item
      ));
    } catch (err) {
      console.error('Translation failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    if (confirm('هل أنت متأكد من مسح جميع العناصر؟')) {
      setItems([]);
    }
  };

  const logout = () => {
    setIsUnlocked(false);
  };

  const filteredItems = items.filter(item => 
    item.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.aiAnalysis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isUnlocked) {
    return <PasswordProtection onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Clipboard size={22} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-800 leading-none">حافظتي الذكية</h1>
              <p className="text-[10px] text-slate-500 mt-1">مدعوم بالذكاء الاصطناعي</p>
            </div>
          </div>

          {/* Model Selector Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setSelectedModel('gemini-3-flash-preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedModel === 'gemini-3-flash-preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Zap size={14} className={selectedModel === 'gemini-3-flash-preview' ? 'fill-indigo-600' : ''} />
              سريع
            </button>
            <button 
              onClick={() => setSelectedModel('gemini-3-pro-preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedModel === 'gemini-3-pro-preview' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <BrainCircuit size={14} className={selectedModel === 'gemini-3-pro-preview' ? 'fill-purple-600' : ''} />
              ذكي
            </button>
          </div>

          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            title="خروج"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Search and Quick Actions */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ابحث في نصوصك المنسوخة..."
              className="w-full pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handlePaste}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-2xl font-semibold shadow-md hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <Plus size={20} />}
              إضافة من الحافظة
            </button>
            <label className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-2xl font-semibold shadow-md hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer">
              <ImageIcon size={20} />
              استخراج من صورة
              <input type="file" className="hidden" accept="image/*" onChange={handleImageOCR} />
            </label>
          </div>
        </div>
      </div>

      {/* Main List */}
      <main className="max-w-2xl mx-auto px-4 mt-8 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-bold text-slate-700">السجل ({filteredItems.length})</h2>
          {items.length > 0 && (
            <button onClick={clearAll} className="text-sm text-red-500 hover:underline flex items-center gap-1">
              <Trash2 size={14} /> مسح الكل
            </button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <div className="inline-block p-6 bg-slate-200 rounded-full mb-4">
              <Search size={48} className="text-slate-400" />
            </div>
            <p className="text-lg">لا توجد عناصر لعرضها</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 border-b border-slate-50">
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                     <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                       item.type === 'link' ? 'bg-blue-100 text-blue-600' :
                       item.type === 'phone' ? 'bg-green-100 text-green-600' :
                       item.type === 'email' ? 'bg-amber-100 text-amber-600' :
                       'bg-slate-100 text-slate-600'
                     }`}>
                       {item.type}
                     </span>
                     <span className="text-[10px] text-slate-400">
                       {new Date(item.timestamp).toLocaleString('ar-EG')}
                     </span>
                   </div>
                   <button onClick={() => handleDelete(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                     <Trash2 size={18} />
                   </button>
                </div>
                
                <p className="text-slate-800 break-words whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </p>
              </div>

              {/* AI Insight Box */}
              {item.aiAnalysis && (
                <div className="bg-slate-50 px-4 py-3 flex gap-3 items-start border-b border-slate-100">
                  <div className="mt-1">
                    {item.type === 'link' ? (
                      item.metadata?.isSafe ? <ShieldCheck size={18} className="text-emerald-500" /> : <ShieldAlert size={18} className="text-rose-500" />
                    ) : <Languages size={18} className="text-indigo-500" />}
                  </div>
                  <p className="text-sm text-slate-600 leading-tight">
                    {item.aiAnalysis}
                  </p>
                </div>
              )}

              {/* Translation Display */}
              {item.metadata?.translation && (
                <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100">
                  <div className="flex items-center gap-2 mb-1 text-indigo-700">
                    <Languages size={14} />
                    <span className="text-xs font-bold">الترجمة:</span>
                  </div>
                  <p className="text-slate-800 text-sm leading-relaxed">
                    {item.metadata.translation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-2 bg-slate-50 flex flex-wrap gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(item.content);
                    alert('تم النسخ!');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Copy size={14} /> نسخ
                </button>

                <button 
                  onClick={() => handleTranslate(item.id, item.content)}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  <Languages size={14} /> ترجمة فورية
                </button>

                {item.type === 'link' && (
                  <a 
                    href={item.content.startsWith('http') ? item.content : `https://${item.content}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <ExternalLink size={14} /> فتح الرابط
                  </a>
                )}

                {item.type === 'phone' && (
                  <>
                    <a 
                      href={`tel:${item.content}`} 
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors"
                    >
                      <Phone size={14} /> اتصال
                    </a>
                    <a 
                      href={`https://wa.me/${item.content.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                    >
                      <MessageCircle size={14} /> واتساب
                    </a>
                  </>
                )}

                {item.type === 'email' && (
                  <a 
                    href={`mailto:${item.content}`} 
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
                  >
                    <Mail size={14} /> إرسال إيميل
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Global Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <RefreshCw className="animate-spin text-indigo-600" size={32} />
            <p className="font-bold text-slate-700">جاري المعالجة بـ {selectedModel === 'gemini-3-flash-preview' ? 'فلاش السريع' : 'برو الذكي'}...</p>
          </div>
        </div>
      )}

      {/* Persistent Call to Action */}
      <div className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto flex justify-center pointer-events-auto">
          <button 
            onClick={handlePaste}
            className="group relative flex items-center justify-center bg-indigo-600 text-white w-16 h-16 rounded-full shadow-2xl hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95"
            title="إضافة سريعة من الحافظة"
          >
            <Plus size={32} />
            <span className="absolute -top-12 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              إضافة من الحافظة
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
