import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  AlignLeft, 
  ListChecks, 
  Activity, 
  BrainCircuit,
  Zap,
  Clock,
  Download,
  Search,
  LogOut,
  FileText,
  History as HistoryIcon,
  Eraser,
  CheckCircle2,
  RefreshCw,
  X,
  Copy,
  Check,
  RotateCcw,
  MousePointer2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { cn } from './lib/utils';
import { analyzeText, AnalysisType } from './services/geminiService';
import Auth from './components/Auth';

// --- FIREBASE IMPORTLARI ---
import { auth } from './lib/firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface HistoryItem {
  id: string;
  timestamp: number;
  text: string;
  result: string;
  type: AnalysisType;
}

const ANALYSIS_OPTIONS: { id: AnalysisType; label: string; icon: any; color: string; accent: string }[] = [
  { id: 'summary', label: 'Özetle', icon: AlignLeft, color: 'bg-indigo-600', accent: 'text-indigo-400' },
  { id: 'key-points', label: 'Ana Maddeler', icon: ListChecks, color: 'bg-cyan-500', accent: 'text-cyan-400' },
  { id: 'sentiment', label: 'Duygu Analizi', icon: Activity, color: 'bg-emerald-500', accent: 'text-emerald-400' },
  { id: 'grammar', label: 'Gramer Kontrolü', icon: CheckCircle2, color: 'bg-amber-500', accent: 'text-amber-400' },
  { id: 'rewrite', label: 'Yeniden Düzenle', icon: RefreshCw, color: 'bg-rose-500', accent: 'text-rose-400' },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true); // Firebase kontrol ederken bekleme ekranı için
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisType | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userName, setUserName] = useState<string>('Misafir');
  const [searchTerm, setSearchTerm] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // --- FIREBASE OTURUM KONTROLÜ ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserName(user.email?.split('@')[0] || 'Kullanıcı'); // E-postanın başını isim yapalım
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Çıkış Yapma Fonksiyonu (Firebase)
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setResult(null);
      setInputText('');
    } catch (error) {
      console.error("Çıkış hatası:", error);
    }
  };

  // İstatikler (Değişmedi)
  const stats = useMemo(() => {
    const chars = inputText.length;
    const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    const readingTime = Math.ceil(words / 200);
    return { chars, words, readingTime };
  }, [inputText]);

  // Geçmişi Getir
  useEffect(() => {
    const savedHistory = localStorage.getItem('synapse_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const addToHistory = (text: string, result: string, type: AnalysisType) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      text,
      result,
      type
    };
    const updatedHistory = [newItem, ...history].slice(0, 5);
    setHistory(updatedHistory);
    localStorage.setItem('synapse_history', JSON.stringify(updatedHistory));
  };

  const handleAnalyze = async (type: AnalysisType) => {
    if (!inputText.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setActiveAnalysis(type);
    setResult(null);
    try {
      const output = await analyzeText(inputText, type);
      setResult(output);
      addToHistory(inputText, output, type);
    } catch (error) {
      setResult('#### ⚠️ Hata\nAnaliz sırasında sorun oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportAsTxt = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `synapse-analiz-${Date.now()}.txt`);
  };

  const exportAsPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(result, 180);
    doc.text(splitText, 15, 15);
    doc.save(`synapse-analiz-${Date.now()}.pdf`);
  };

  const highlightedResult = useMemo(() => {
    if (!result || !searchTerm) return result;
    try {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      return result.replace(regex, '<mark class="bg-yellow-400/30 text-yellow-200 rounded px-0.5">$1</mark>');
    } catch (e) { return result; }
  }, [result, searchTerm]);

  // Firebase kontrol ederken kısa bir yükleniyor ekranı
  if (loading) return <div className="min-h-screen bg-[#02040a] flex items-center justify-center text-indigo-500 font-bold">YÜKLENİYOR...</div>;

  if (!isAuthenticated) {
    // onLogin prop'unu artık handleLogin yerine boş gönderebiliriz 
    // çünkü Auth.tsx içinde signInWithEmailAndPassword direkt çalışacak
    return <Auth onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen selection:bg-indigo-500/30 selection:text-white flex flex-col relative overflow-hidden bg-[#02040a]">
      {/* Tasarım kodların aynen devam ediyor... */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px]"></div>
      </div>

      <header className="h-20 shrink-0 flex items-center justify-between px-6 md:px-10 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-display">SYNAPSE</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-1.5 px-4 h-9 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Hoş Geldin,</span>
          <span className="text-xs font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent italic">
            {userName}!
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            <HistoryIcon className="w-4 h-4" /> GEÇMİŞ
          </button>
          <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all group">
            <LogOut className="w-4 h-4 text-rose-500 group-hover:text-white" />
          </button>
        </div>
      </header>

      {/* Sidebar ve Main kısımları aynen buraya gelecek */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 p-6 md:p-10 relative z-10">
        {/* ... (Senin TextArea ve Sonuç ekranı kodların) ... */}
        <section className="col-span-1 md:col-span-7 flex flex-col gap-4">
           {/* ... Input kısmını buraya geri yapıştır ... */}
           <div className="flex-1 glass-panel p-8 backdrop-blur-md flex flex-col group relative">
             <textarea className="flex-1 w-full bg-transparent border-none focus:ring-0 text-slate-200 resize-none min-h-[300px]" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Metni buraya girin..." />
             <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
               {ANALYSIS_OPTIONS.map(opt => (
                 <button key={opt.id} onClick={() => handleAnalyze(opt.id)} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                   <div className={cn("p-2 rounded-lg text-white", opt.color)}><opt.icon className="w-4 h-4" /></div>
                   <span className="text-[10px] font-bold text-slate-400">{opt.label}</span>
                 </button>
               ))}
             </div>
           </div>
        </section>

        <section className="col-span-1 md:col-span-5 flex flex-col gap-6">
           {/* ... Sonuç kısmını buraya geri yapıştır ... */}
           {result ? (
             <div className="result-card p-6 flex-1">
               <ReactMarkdown rehypePlugins={[rehypeRaw]}>{highlightedResult || ''}</ReactMarkdown>
             </div>
           ) : (
             <div className="flex-1 border border-dashed border-white/10 rounded-3xl flex items-center justify-center opacity-20">Analiz Bekleniyor...</div>
           )}
        </section>
      </main>

      <footer className="h-12 flex items-center justify-between px-10 border-t border-white/5 bg-black/40 backdrop-blur-md">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Synapse v1.0 • Secure</span>
      </footer>
    </div>
  );
}