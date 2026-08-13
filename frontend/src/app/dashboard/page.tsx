"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, AlertTriangle, CheckCircle, ShieldAlert, LogOut, Loader2, ArrowLeft, Search, Zap } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Dashboard() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleAnalyze = async () => {
    if (!text && !file) {
      setError("Vui lòng nhập văn bản hoặc tải ảnh lên.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    if (text) formData.append("text", text);
    if (file) formData.append("image", file);

    try {
      // GỌI API ĐẾN BACKEND CLOUD RUN HOẶC LOCALHOST
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/analyze";
      
      const response = await axios.post(apiUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const analysisResult = response.data;
      setResult(analysisResult);
      
      // Save result to Firestore
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, `users/${auth.currentUser.uid}/analyses`), {
            text_analyzed: text,
            has_image: !!file,
            result: analysisResult,
            createdAt: serverTimestamp()
          });
        } catch (dbErr) {
          console.error("Failed to save to Firestore", dbErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Có lỗi xảy ra khi phân tích. Vui lòng kiểm tra lại kết nối hoặc API backend.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    if (level === "HIGH_DANGER") return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (level === "SUSPICIOUS") return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  const getRiskIcon = (level: string) => {
    if (level === "HIGH_DANGER") return <ShieldAlert className="w-8 h-8 text-rose-500" />;
    if (level === "SUSPICIOUS") return <AlertTriangle className="w-8 h-8 text-amber-500" />;
    return <CheckCircle className="w-8 h-8 text-emerald-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
          <span className="font-semibold text-slate-200">Bảng điều khiển</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-all"
          title="Đăng xuất"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </nav>

      <main className="max-w-4xl mx-auto p-6 pt-10 flex flex-col gap-8">
        {/* Input Section */}
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" /> Kiểm tra Nội dung
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Drag & Drop Area */}
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[250px]
                ${isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"}
                ${preview ? "p-2 border-none" : ""}
              `}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="relative w-full h-full rounded-xl overflow-hidden group">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium">Click để thay đổi ảnh</span>
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-slate-500 mb-4" />
                  <p className="text-slate-300 font-medium mb-1">Kéo thả ảnh chụp màn hình vào đây</p>
                  <p className="text-slate-500 text-sm">Hoặc click để chọn file (Hỗ trợ JPG, PNG)</p>
                </>
              )}
            </div>

            {/* Text Input */}
            <div className="flex flex-col gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Dán nội dung tin nhắn, email hoặc đường link (Tùy chọn)
                </label>
                <textarea 
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập nội dung vào đây..."
                  className="w-full h-[180px] bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
                />
              </div>
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {loading ? "AI Đang Phân Tích..." : "Bắt Đầu Phân Tích"}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Score Indicator */}
              <div className={`absolute top-0 left-0 w-1 h-full ${
                result.risk_level === "HIGH_DANGER" ? "bg-rose-500" : 
                result.risk_level === "SUSPICIOUS" ? "bg-amber-500" : "bg-emerald-500"
              }`} />

              <div className="flex items-start justify-between mb-8 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${getRiskColor(result.risk_level)}`}>
                    {getRiskIcon(result.risk_level)}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">MỨC ĐỘ RỦI RO</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight">{result.risk_score}</span>
                      <span className="text-lg text-slate-500">/ 100</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <h3 className="text-sm font-medium text-slate-400 mb-1">PHÂN LOẠI</h3>
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm font-medium border border-slate-700">
                    {result.scam_category.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-slate-400 text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> GIẢI THÍCH TỪ CHUYÊN GIA
                  </h4>
                  <p className="text-slate-200 leading-relaxed text-sm bg-slate-950 p-4 rounded-xl border border-white/5">
                    {result.explanation}
                  </p>
                </div>
                <div>
                  <h4 className="text-slate-400 text-sm font-medium mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> DẤU HIỆU LỪA ĐẢO (RED FLAGS)
                  </h4>
                  <ul className="space-y-2">
                    {result.detected_flags.map((flag: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-white/5">
                        <span className="text-rose-500 mt-0.5">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
                <h4 className="text-indigo-400 text-sm font-semibold mb-3">HÀNH ĐỘNG KHUYẾN NGHỊ:</h4>
                <ul className="space-y-2">
                  {result.actionable_advice.map((advice: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-indigo-200">
                      <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{advice}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
