import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Mail, Lock, User, ChevronRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

// --- FIREBASE IMPORTLARI ---
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';

interface AuthProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
}

export default function Auth({ onLogin }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // Şifre gücü hesaplama (Aynen kaldı)
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-transparent', textColor: 'text-slate-500' };
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasDigits = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    const isMinLength = pass.length >= 8;
    if (!isMinLength || (hasLetters && !hasDigits && !hasSpecial) || (hasDigits && !hasLetters && !hasSpecial)) {
      return { score: 1, label: 'Zayıf', color: 'bg-rose-500', textColor: 'text-rose-400' };
    }
    if (isMinLength && hasLetters && hasDigits && !hasSpecial) {
      return { score: 2, label: 'Orta', color: 'bg-amber-500', textColor: 'text-amber-400' };
    }
    return { score: 3, label: 'Güçlü!', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (mode === 'register' && !name.trim()) newErrors.name = 'Lütfen isminizi giriniz.';
    if (!email.trim()) newErrors.email = 'Lütfen e-posta adresinizi giriniz.';
    if (mode !== 'forgot' && !password.trim()) newErrors.password = 'Lütfen şifrenizi giriniz.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email)) newErrors.email = 'Geçerli bir e-posta giriniz.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const strength = getPasswordStrength(password);

  // --- ANA SUBMIT FONKSİYONU (FIREBASE BAĞLANTISI) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});

    try {
      if (mode === 'login') {
        // 1. GİRİŞ YAP
        await signInWithEmailAndPassword(auth, email, password);
        onLogin();
      } else if (mode === 'register') {
        // 2. KAYIT OL
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // İsim bilgisini Firebase profiline ekle
        await updateProfile(userCredential.user, { displayName: name });
        localStorage.setItem('userName', name);
        onLogin();
      } else if (mode === 'forgot') {
        // 3. ŞİFRE SIFIRLAMA
        await sendPasswordResetEmail(auth, email);
        alert("Şifre sıfırlama bağlantısı e-postanıza gönderildi!");
        setMode('login');
      }
    } catch (error: any) {
      console.error("Auth Error:", error.code);
      const newErrors: FormErrors = {};
      
      // Firebase hata kodlarını Türkçeleştirme
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          newErrors.general = 'E-posta veya şifre hatalı.';
          break;
        case 'auth/email-already-in-use':
          newErrors.email = 'Bu e-posta zaten kullanımda.';
          break;
        case 'auth/weak-password':
          newErrors.password = 'Şifre çok zayıf.';
          break;
        default:
          newErrors.general = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      }
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setShowPassword(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#02040a]">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px]"></div>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10">
        <div className="glass-panel p-8 md:p-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-6">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 font-display">Synapse</h1>
          <p className="text-slate-400 text-sm mb-8 text-center px-4">Yapay zeka analiz merkezine hoş geldiniz.</p>

          {/* Genel Hata Mesajı */}
          {errors.general && (
            <div className="w-full mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">İsim Soyisim</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={cn("w-full bg-white/5 border rounded-xl px-10 py-3 text-sm text-white focus:outline-none transition-all", errors.name ? "border-rose-500/50" : "border-white/10 focus:border-indigo-500")} placeholder="Adınız" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={cn("w-full bg-white/5 border rounded-xl px-10 py-3 text-sm text-white focus:outline-none transition-all", errors.email ? "border-rose-500/50" : "border-white/10 focus:border-indigo-500")} placeholder="ornek@mail.com" />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Şifre</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={cn("w-full bg-white/5 border rounded-xl pl-10 pr-12 py-3 text-sm text-white focus:outline-none transition-all", errors.password ? "border-rose-500/50" : "border-white/10 focus:border-indigo-500")} placeholder="******" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button disabled={isLoading} type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
              {isLoading ? "İşleniyor..." : mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Kayıt Ol' : 'Sıfırla'}
              {!isLoading && <ChevronRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 w-full items-center">
            <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="text-xs text-slate-500">
              {mode === 'login' ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
              <span className="text-indigo-400 font-bold underline">
                {mode === 'login' ? "Hemen Kaydol" : "Giriş Yap"}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}