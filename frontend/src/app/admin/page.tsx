"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, collectionGroup } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Activity, ShieldAlert, BarChart3, PieChart, Lock, User, Key } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Admin Login State
  const [isAuthAdmin, setIsAuthAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [riskStats, setRiskStats] = useState({ safe: 0, suspicious: 0, danger: 0 });
  const [recentScams, setRecentScams] = useState<any[]>([]);

  useEffect(() => {
    // Kéo trạng thái đăng nhập từ Session Storage (F5 không bị văng)
    const authed = sessionStorage.getItem("isAdminAuthed");
    if (authed === "true") {
      setIsAuthAdmin(true);
      fetchAdminStats();
    } else {
      setLoading(false);
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // HARDCODED TÀI KHOẢN ADMIN (Có thể đổi tùy ý)
    if (username === "admin" && password === "scamlens2026") {
      sessionStorage.setItem("isAdminAuthed", "true");
      setIsAuthAdmin(true);
      setLoading(true);
      setLoginError("");
      await fetchAdminStats();
    } else {
      setLoginError("Tên đăng nhập hoặc mật khẩu không chính xác.");
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("isAdminAuthed");
    setIsAuthAdmin(false);
  };

  const fetchAdminStats = async () => {
    try {
      // 1. Get Total Users (từ collection 'users')
      const usersSnap = await getDocs(collection(db, "users"));
      setTotalUsers(usersSnap.size);

      // 2. Get All Analyses (từ tất cả các subcollections 'analyses' của mọi user)
      const analysesQuery = query(collectionGroup(db, "analyses"));
      const analysesSnap = await getDocs(analysesQuery);
      
      let safe = 0, suspicious = 0, danger = 0;
      let allDocs: any[] = [];

      analysesSnap.forEach((doc) => {
        const data = doc.data();
        allDocs.push({ id: doc.id, ...data });
        
        if (data.result?.risk_level === "HIGH_DANGER") danger++;
        else if (data.result?.risk_level === "SUSPICIOUS") suspicious++;
        else safe++;
      });

      setTotalAnalyses(allDocs.length);
      setRiskStats({ safe, suspicious, danger });

      // Lấy 10 vụ lừa đảo mới nhất (Sắp xếp thủ công bằng JS để tránh lỗi index)
      allDocs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setRecentScams(allDocs.slice(0, 10));

    } catch (error) {
      console.error("Lỗi khi tải dữ liệu admin:", error);
      alert("Lỗi tải dữ liệu. Firebase báo lỗi: 'Missing or insufficient permissions'. Vui lòng làm theo hướng dẫn cấp quyền Firestore để fix lỗi này.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">Đang tải dữ liệu...</div>;
  }

  if (!isAuthAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-4 text-rose-400">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100">Khu vực Admin</h1>
            <p className="text-slate-400 text-sm mt-2 text-center">Đăng nhập bằng tài khoản quản trị viên</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Mật khẩu</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full py-4 mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all"
            >
              Đăng nhập Admin
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">Trở về Trang chủ</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const scamPercentage = totalAnalyses > 0 ? Math.round(((riskStats.suspicious + riskStats.danger) / totalAnalyses) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span className="text-xl font-bold tracking-tight text-slate-100">Báo cáo Chiến dịch ScamLens</span>
          </div>
        </div>
        <button 
          onClick={handleAdminLogout}
          className="px-4 py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-xl text-sm font-semibold transition-colors"
        >
          Đăng xuất Admin
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 pt-8 flex flex-col gap-8">
        
        {/* KPI Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-slate-400 font-medium">Tổng người dùng</h3>
            </div>
            <p className="text-4xl font-extrabold text-slate-100">{totalUsers}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-slate-400 font-medium">Lượt AI phân tích</h3>
            </div>
            <p className="text-4xl font-extrabold text-slate-100">{totalAnalyses}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-slate-400 font-medium">Phát hiện lừa đảo</h3>
            </div>
            <p className="text-4xl font-extrabold text-rose-400">{riskStats.danger + riskStats.suspicious}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-slate-400 font-medium">Tỷ lệ Lừa đảo / An toàn</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-extrabold text-slate-100">{scamPercentage}%</p>
              <span className="text-slate-500 text-sm">chứa rủi ro</span>
            </div>
          </motion.div>
        </div>

        {/* Bảng dữ liệu chi tiết */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-slate-100 mb-6 border-b border-white/10 pb-4">Cơ sở dữ liệu lừa đảo mới nhất (Ẩn danh)</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 text-sm border-b border-white/5">
                  <th className="py-4 font-medium">Hình thức Lừa đảo</th>
                  <th className="py-4 font-medium">Đầu vào (Ảnh/Text)</th>
                  <th className="py-4 font-medium">Điểm AI</th>
                  <th className="py-4 font-medium">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentScams.map((scam) => (
                  <tr key={scam.id} className="text-slate-300 hover:bg-slate-800/50 transition-colors">
                    <td className="py-4">
                      <span className="inline-block px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-semibold">
                        {scam.result?.scam_category?.replace(/_/g, " ") || "Không xác định"}
                      </span>
                    </td>
                    <td className="py-4 text-sm truncate max-w-[200px]" title={scam.text_analyzed}>
                      {scam.text_analyzed ? `"${scam.text_analyzed}"` : "🖼️ Phân tích Ảnh"}
                    </td>
                    <td className="py-4 font-bold text-slate-100">{scam.result?.risk_score || 0}/100</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {scam.result?.risk_level === "HIGH_DANGER" && <><span className="w-2 h-2 rounded-full bg-rose-500"/> <span className="text-rose-400 text-sm">Nguy hiểm</span></>}
                        {scam.result?.risk_level === "SUSPICIOUS" && <><span className="w-2 h-2 rounded-full bg-amber-500"/> <span className="text-amber-400 text-sm">Đáng ngờ</span></>}
                        {scam.result?.risk_level === "SAFE" && <><span className="w-2 h-2 rounded-full bg-emerald-500"/> <span className="text-emerald-400 text-sm">An toàn</span></>}
                      </div>
                    </td>
                  </tr>
                ))}
                {recentScams.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">Chưa có dữ liệu phân tích nào trên hệ thống</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
