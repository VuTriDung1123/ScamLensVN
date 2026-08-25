"use client";

import { ShieldCheck, Search, Zap, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Safety fallback timeout in case Firebase auth takes long or is unconfigured
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 600);

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        },
        (err) => {
          console.warn("Auth check error:", err);
          setLoading(false);
        }
      );
      return () => {
        clearTimeout(timeout);
        unsubscribe();
      };
    } catch (e) {
      console.warn("Firebase auth not available:", e);
      setLoading(false);
      return () => clearTimeout(timeout);
    }
  }, []);

  const handleCTA = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/20 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-white/10 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-indigo-400" />
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            ScamLens VN
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 text-xs font-medium rounded-full text-slate-400 hover:text-slate-200 transition-colors"
          >
            Quản trị
          </Link>
          <button 
            onClick={handleCTA}
            className="px-5 py-2 text-sm font-medium rounded-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? "Bảng Điều Khiển" : user ? "Bảng Điều Khiển" : "Mở ứng dụng"}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-16 px-4 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span>Tích hợp công nghệ Google Gemini AI</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-slate-100">
          Nhận diện lừa đảo <br/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400">
            Chỉ với một cú click
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          ScamLens VN phân tích tin nhắn, email và hình ảnh đáng ngờ để phát hiện các dấu hiệu lừa đảo, giúp bảo vệ bạn và gia đình an toàn trên không gian mạng.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleCTA}
            className="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] transform hover:-translate-y-0.5 cursor-pointer"
          >
            Vào Bảng Điều Khiển Ngay <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left w-full">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-100">Phân tích đa phương tiện</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Hỗ trợ nhận diện thông minh qua hình ảnh chụp màn hình, đoạn văn bản dài hoặc URL.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-100">Đánh giá rủi ro sâu</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Không chỉ cảnh báo, AI bóc tách chi tiết các thủ thuật thao túng tâm lý và điểm bất thường.</p>
          </div>

          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-100">Bảo mật & Riêng tư</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Mọi hình ảnh của bạn chỉ được xử lý tức thời và lưu trữ an toàn trong tài khoản cá nhân.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
