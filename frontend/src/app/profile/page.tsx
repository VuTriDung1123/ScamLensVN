"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, query, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Activity, LogOut, Key, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Đếm tổng số lần quét
        try {
          const q = query(collection(db, `users/${currentUser.uid}/analyses`));
          const snapshot = await getDocs(q);
          setTotalAnalyses(snapshot.size);
        } catch (error) {
          console.error("Error fetching analyses count", error);
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleResetPassword = async () => {
    if (user?.email) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        setMessage("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.");
      } catch (error) {
        setMessage("Có lỗi xảy ra khi gửi email đặt lại mật khẩu.");
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
          <span className="font-semibold text-slate-200">Quay lại Bảng điều khiển</span>
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto p-6 pt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-600/20 to-purple-600/20" />
          
          <div className="relative z-10 flex flex-col items-center mt-8 mb-8">
            <div className="w-24 h-24 bg-slate-800 rounded-full border-4 border-slate-900 shadow-xl flex items-center justify-center mb-4">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-100">{user?.displayName || "Người dùng ẩn danh"}</h2>
            <div className="flex items-center gap-2 text-slate-400 mt-2 bg-slate-950 px-4 py-1.5 rounded-full border border-white/5">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-950 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-3 text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-100">{totalAnalyses}</h3>
              <p className="text-slate-400 text-sm mt-1">Lượt quét lừa đảo</p>
            </div>

            <div className="bg-slate-950 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mt-2">Trạng thái</h3>
              <p className="text-emerald-400 text-sm mt-1 font-medium">Được bảo vệ</p>
            </div>
          </div>

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium text-center">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleResetPassword}
              className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-2 transition-all border border-white/5"
            >
              <Key className="w-5 h-5" /> Đổi mật khẩu
            </button>
            <button 
              onClick={handleLogout}
              className="w-full py-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold flex items-center justify-center gap-2 transition-all border border-rose-500/20"
            >
              <LogOut className="w-5 h-5" /> Đăng xuất
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
