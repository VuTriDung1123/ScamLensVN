"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, collectionGroup, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Activity, ShieldAlert, BarChart3, PieChart as PieChartIcon, Lock, User, Key, Trash2, Calendar, Eye } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

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
  const [riskStats, setRiskStats] = useState({ safe: 0, suspicious: 0, danger: 0, unknown: 0 });
  const [recentScams, setRecentScams] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);

  useEffect(() => {
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
      const usersSnap = await getDocs(collection(db, "users"));
      setTotalUsers(usersSnap.size);

      const analysesQuery = query(collectionGroup(db, "analyses"));
      const analysesSnap = await getDocs(analysesQuery);
      
      let safe = 0, suspicious = 0, danger = 0, unknown = 0;
      let allDocs: any[] = [];
      const dailyMap: { [key: string]: { date: string, "Nguy hiểm": number, "Đáng ngờ": number, "An toàn": number } } = {};

      analysesSnap.forEach((doc) => {
        const data = doc.data();
        if (data.deletedByAdmin) return;
        
        // Extract User ID from reference path users/{userId}/analyses/{docId}
        const pathSegments = doc.ref.path.split('/');
        const userId = pathSegments.length >= 3 ? pathSegments[1].substring(0, 6) + "..." : "Khách";
        
        allDocs.push({ id: doc.id, ref: doc.ref, userId, ...data });
        
        const risk = (data.result?.risk_level || "").toUpperCase().replace(/_/g, " ");
        const score = data.result?.risk_score || 0;
        let category = "An toàn";
        
        if (risk.includes("CRITICAL") || risk.includes("HIGH") || risk.includes("DANGER") || score >= 70) {
          danger++;
          category = "Nguy hiểm";
        } else if (risk.includes("SUSPICIOUS") || risk.includes("UNKNOWN") || (score >= 40 && score < 70)) {
          suspicious++;
          category = "Đáng ngờ";
        } else {
          safe++;
        }
        
        if (data.createdAt) {
           const dateStr = format(data.createdAt.toDate(), "dd/MM");
           if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr, "Nguy hiểm": 0, "Đáng ngờ": 0, "An toàn": 0 };
           dailyMap[dateStr][category as "Nguy hiểm" | "Đáng ngờ" | "An toàn"]++;
        }
      });

      setTotalAnalyses(allDocs.length);
      setRiskStats({ safe, suspicious, danger, unknown });
      
      // Sort daily data by date mapping
      setDailyData(Object.values(dailyMap).reverse());

      allDocs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setRecentScams(allDocs.slice(0, 30)); // Show top 30 recent

    } catch (error) {
      console.error("Lỗi khi tải dữ liệu admin:", error);
      alert("Lỗi tải dữ liệu. Firebase báo lỗi: 'Missing or insufficient permissions'.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteByAdmin = async (docRef: any, id: string) => {
    try {
      if (!confirm("Bạn có chắc muốn xoá kết quả này khỏi trang Admin? (User vẫn sẽ thấy nó)")) return;
      await updateDoc(docRef, { deletedByAdmin: true });
      setRecentScams(prev => prev.filter(scam => scam.id !== id));
      setTotalAnalyses(prev => prev - 1);
    } catch (err) {
      console.error(err);
      alert("Xoá thất bại.");
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
        </motion.div>
      </div>
    );
  }

  const scamPercentage = totalAnalyses > 0 ? Math.round(((riskStats.suspicious + riskStats.danger + riskStats.unknown) / totalAnalyses) * 100) : 0;
  
  const pieData = [
    { name: "An Toàn", value: riskStats.safe, color: "#10b981" },
    { name: "Đáng Ngờ", value: riskStats.suspicious + riskStats.unknown, color: "#f59e0b" },
    { name: "Nguy Hiểm", value: riskStats.danger, color: "#f43f5e" }
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans pb-12">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-100">Báo cáo Chiến dịch ScamLens</span>
          </div>
        </div>
        <button 
          onClick={handleAdminLogout}
          className="px-4 py-2 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-sm font-semibold transition-all"
        >
          Đăng xuất Admin
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 pt-8 flex flex-col gap-8">
        
        {/* KPI Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-slate-400 font-medium">Tổng người dùng</h3>
            </div>
            <p className="text-5xl font-extrabold text-slate-100">{totalUsers}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-slate-400 font-medium">Lượt phân tích</h3>
            </div>
            <p className="text-5xl font-extrabold text-slate-100">{totalAnalyses}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900 border border-rose-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-slate-400 font-medium">Rủi ro phát hiện</h3>
            </div>
            <p className="text-5xl font-extrabold text-rose-400">{riskStats.danger + riskStats.suspicious + riskStats.unknown}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                <PieChartIcon className="w-6 h-6" />
              </div>
              <h3 className="text-slate-400 font-medium">Tỷ lệ Lừa đảo</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-extrabold text-slate-100">{scamPercentage}%</p>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl col-span-1 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Lưu lượng phân tích theo ngày
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="An toàn" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Đáng ngờ" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="Nguy hiểm" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl col-span-1">
            <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-400" /> Phân bổ Rủi ro
            </h3>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Bảng dữ liệu chi tiết */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" /> Bản ghi kiểm tra gần đây
            </h2>
            <span className="text-sm text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">Cập nhật theo thời gian thực</span>
          </div>
          
          <div className="overflow-x-auto -mx-8 px-8">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="py-4 font-medium pl-4">Thời gian</th>
                  <th className="py-4 font-medium">Tài khoản</th>
                  <th className="py-4 font-medium">Hình thức Lừa đảo</th>
                  <th className="py-4 font-medium">Đầu vào (Ảnh/Text)</th>
                  <th className="py-4 font-medium text-center">Điểm AI</th>
                  <th className="py-4 font-medium">Mức độ</th>
                  <th className="py-4 font-medium text-right pr-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentScams.map((scam) => (
                  <tr key={scam.id} className="text-slate-300 hover:bg-slate-800/40 transition-colors group">
                    <td className="py-4 pl-4 text-sm text-slate-500">
                      {scam.createdAt ? format(scam.createdAt.toDate(), "dd/MM/yyyy HH:mm") : "N/A"}
                    </td>
                    <td className="py-4 text-sm font-mono text-indigo-400">
                      {scam.userId}
                    </td>
                    <td className="py-4">
                      <span className="inline-block px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-semibold text-slate-300">
                        {scam.result?.scam_category?.replace(/_/g, " ") || "Chưa phân loại"}
                      </span>
                    </td>
                    <td className="py-4 text-sm truncate max-w-[200px]" title={scam.text_analyzed}>
                      <div className="flex items-center gap-2">
                        {scam.has_image && <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs">🖼️</div>}
                        <span className="truncate">{scam.text_analyzed ? `"${scam.text_analyzed}"` : "Ảnh đính kèm"}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                       <span className="font-bold text-slate-100">{scam.result?.risk_score || 0}</span>
                       <span className="text-slate-500 text-xs">/100</span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const level = (scam.result?.risk_level || "").toUpperCase().replace(/_/g, " ");
                          const score = scam.result?.risk_score || 0;
                          
                          if (level.includes("CRITICAL") || level.includes("HIGH") || level.includes("DANGER") || score >= 70) {
                            return <><span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"/> <span className="text-rose-400 text-sm font-medium">Nguy hiểm</span></>;
                          }
                          if (level.includes("SUSPICIOUS") || level.includes("UNKNOWN") || (score >= 40 && score < 70)) {
                            return <><span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"/> <span className="text-amber-400 text-sm font-medium">Đáng ngờ</span></>;
                          }
                          return <><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"/> <span className="text-emerald-400 text-sm font-medium">An toàn</span></>;
                        })()}
                      </div>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <button 
                        onClick={() => handleDeleteByAdmin(scam.ref, scam.id)}
                        className="p-2 text-slate-500 hover:bg-rose-500/20 hover:text-rose-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Xoá kết quả này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {recentScams.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 bg-slate-900/50">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Activity className="w-8 h-8 text-slate-700" />
                        <p>Chưa có dữ liệu phân tích nào trên hệ thống</p>
                      </div>
                    </td>
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
