"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, AlertTriangle, CheckCircle, ShieldAlert, LogOut, Loader2, ArrowLeft, Search, Zap, User, BrainCircuit, ScanLine, Baby, Terminal, HeartPulse, Clock, Gift, ShieldOff, Lightbulb } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

export default function Dashboard() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [explanationLevel, setExplanationLevel] = useState<"simple" | "normal" | "technical">("normal");
  const [hasClicked, setHasClicked] = useState<boolean | null>(null);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);
  
  // Chat state
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  const handleSendChat = async () => {
    if (!chatMessage.trim() || !result) return;
    
    const userMsg = { role: "user", content: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage("");
    setIsChatting(true);
    
    try {
      const chatUrl = process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace("/api/analyze", "/api/chat")
        : "http://127.0.0.1:8080/api/chat";

      const response = await axios.post(
        chatUrl,
        {
          context_result: result,
          user_message: userMsg.content,
          chat_history: chatHistory
        }
      );
      setChatHistory(prev => [...prev, { role: "assistant", content: response.data.reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: "assistant", content: "Lỗi kết nối tới AI. Vui lòng thử lại sau." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const fetchHistory = async (uid: string) => {
    try {
      const q = query(
        collection(db, `users/${uid}/analyses`),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((doc: any) => !doc.isDeleted);
      setHistory(historyData);
    } catch (err) {
      console.error("Error fetching history", err);
    }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, `users/${auth.currentUser.uid}/analyses`, docId);
      await updateDoc(docRef, {
        isDeleted: true
      });
      setHistory(prev => prev.filter(item => item.id !== docId));
      if (result && history.find(h => h.id === docId)?.result === result) {
        setResult(null);
      }
    } catch (err) {
      console.error("Error deleting history:", err);
      alert("Xóa thất bại. Vui lòng kiểm tra lại quyền truy cập (Firestore Rules).");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchHistory(user.uid);
      } else {
        setHistory([]);
      }
    });

    // Lắng nghe sự kiện từ ScamLens Extension
    const handleExtensionMessage = async (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data.type === "SCAMLENS_SAVE_HISTORY" && auth.currentUser) {
        const payload = event.data.payload;
        try {
          await addDoc(collection(db, `users/${auth.currentUser.uid}/analyses`), {
            text_analyzed: payload.text || null,
            has_image: payload.has_image || false,
            thumbnail_url: null, // Extension currently doesn't pass thumbnail
            result: payload.result,
            source: "Extension",
            createdAt: serverTimestamp()
          });
          fetchHistory(auth.currentUser.uid);
        } catch (err) {
          console.error("Failed to sync extension history", err);
        }
      }
    };
    window.addEventListener("message", handleExtensionMessage);

    return () => {
      unsubscribe();
      window.removeEventListener("message", handleExtensionMessage);
    };
  }, []);

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

  const createThumbnail = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 150;
          const MAX_HEIGHT = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.6));
          } else {
            resolve(null);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (!text && !file) {
      setError("Vui lòng nhập văn bản hoặc tải ảnh lên.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setExplanationLevel("normal");
    setHasClicked(null);
    setFeedbackGiven(null);
    setChatHistory([]);

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
      
      // Save result to Firestore only if NOT in private mode
      if (auth.currentUser && !isPrivateMode) {
        try {
          let thumbnailUrl = null;
          if (file) {
            thumbnailUrl = await createThumbnail(file);
          }

          await addDoc(collection(db, `users/${auth.currentUser.uid}/analyses`), {
            text_analyzed: text,
            has_image: !!file,
            thumbnail_url: thumbnailUrl,
            result: analysisResult,
            source: "Web",
            createdAt: serverTimestamp()
          });
          // Refresh history
          fetchHistory(auth.currentUser.uid);
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

  const getRiskColor = (result: any) => {
    const level = (result?.risk_level || "").toUpperCase();
    const score = result?.risk_score || 0;
    if (score >= 70 || ["CRITICAL", "HIGH_RISK", "HIGH_DANGER"].includes(level)) return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (score >= 40 || ["SUSPICIOUS", "UNKNOWN"].includes(level)) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    if (level === "UNKNOWN") return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"; // SAFE, LOW_RISK
  };

  const getRiskIcon = (result: any) => {
    const level = (result?.risk_level || "").toUpperCase();
    const score = result?.risk_score || 0;
    if (score >= 70 || ["CRITICAL", "HIGH_RISK", "HIGH_DANGER"].includes(level)) return <ShieldAlert className="w-8 h-8 text-rose-500" />;
    if (score >= 40 || ["SUSPICIOUS"].includes(level)) return <AlertTriangle className="w-8 h-8 text-amber-500" />;
    if (level === "UNKNOWN") return <ShieldAlert className="w-8 h-8 text-slate-400" />;
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
        <div className="flex items-center gap-4">
          {/* Admin link (Only visible if the email matches admin, or just keep it simple and let them access /admin directly for now) */}
          <Link href="/admin" className="text-xs font-medium text-indigo-400 border border-indigo-400/30 px-3 py-1.5 rounded-full hover:bg-indigo-400/10 transition-colors">
            Thống kê Admin
          </Link>
          <Link 
            href="/profile"
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-all"
            title="Hồ sơ cá nhân"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 pt-8 flex flex-col gap-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Lịch sử Sidebar (Cho màn hình lớn) */}
          <div className="hidden lg:block lg:col-span-1 bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl h-fit max-h-[80vh] overflow-y-auto hide-scrollbar flex flex-col gap-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            
            {/* Protection Score */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/20 text-center shadow-inner relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center justify-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-400" /> Điểm Bảo Vệ
              </h3>
              <div className="text-4xl font-extrabold text-indigo-400 relative z-10">
                {Array.isArray(history) && history.length > 0 ? Math.min(100, 50 + history.filter(h => h.result?.risk_level === "HIGH_DANGER").length * 10 + history.length * 2) : 0}
              </div>
              <div className="text-xs text-slate-500 mt-2 relative z-10 flex justify-between px-2">
                <span>Đã quét: {Array.isArray(history) ? history.length : 0}</span>
                <span>An toàn: {Array.isArray(history) ? history.filter(h => h.result?.risk_level === "SAFE").length : 0}</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> Lịch sử
              </h3>
            <div className="flex flex-col gap-3">
              {Array.isArray(history) && history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setResult(item.result)} 
                  className="p-4 bg-slate-950 rounded-xl cursor-pointer hover:bg-slate-800 transition-all border border-white/5 group relative"
                >
                  {/* Source Badge */}
                  {item.source === "Extension" && (
                    <div className="absolute top-2 right-2 bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded border border-purple-500/30">
                      Từ Extension
                    </div>
                  )}
                  <div className="text-sm font-medium text-slate-300 mb-2 pr-16 group-hover:text-indigo-300 flex items-start gap-2">
                    {item.thumbnail_url && (
                      <img src={item.thumbnail_url} alt="thumbnail" className="w-10 h-10 rounded-lg object-cover border border-slate-700 flex-shrink-0" />
                    )}
                    <span className={item.text_analyzed ? "line-clamp-2" : "text-slate-400 italic"}>
                      {item.text_analyzed ? `"${item.text_analyzed}"` : "Chỉ tải lên hình ảnh"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className={`w-2 h-2 rounded-full ${
                        (item.result.risk_score >= 70 || ["CRITICAL", "HIGH_RISK", "HIGH_DANGER"].includes(item.result.risk_level)) ? "bg-rose-500" : 
                        (item.result.risk_score >= 40 || ["SUSPICIOUS", "UNKNOWN"].includes(item.result.risk_level)) ? "bg-amber-500" : "bg-emerald-500"
                      }`} />
                      <span className={
                        (item.result.risk_score >= 70 || ["CRITICAL", "HIGH_RISK", "HIGH_DANGER"].includes(item.result.risk_level)) ? "text-rose-400" : 
                        (item.result.risk_score >= 40 || ["SUSPICIOUS", "UNKNOWN"].includes(item.result.risk_level)) ? "text-amber-400" : "text-emerald-400"
                      }>
                        Điểm rủi ro: {item.result.risk_score}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteHistory(e, item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Xóa kết quả"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
              {(!Array.isArray(history) || history.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-8">Chưa có lịch sử kiểm tra</p>
              )}
            </div>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-8">
            {/* Input Section */}
            {!result && (
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
                  className="w-full h-[140px] bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
                />
                <div className="mt-3 flex items-center justify-between bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldOff className={`w-4 h-4 ${isPrivateMode ? "text-indigo-400" : "text-slate-500"}`} />
                    <span className="text-sm font-medium text-slate-300">Chế độ Ẩn danh (Privacy Mode)</span>
                  </div>
                  <button 
                    onClick={() => setIsPrivateMode(!isPrivateMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPrivateMode ? 'bg-indigo-500' : 'bg-slate-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrivateMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {isPrivateMode && <p className="text-xs text-indigo-400 mt-1">Lịch sử và ảnh của bạn sẽ không được lưu lại.</p>}
              </div>
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2"
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
        )}

        {/* Result Section */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6 text-indigo-400" /> Báo Cáo Phân Tích
                </h2>
                <button 
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setPreview(null);
                    setText("");
                    setChatHistory([]);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2"
                >
                  <ScanLine className="w-4 h-4" /> Phân tích mới
                </button>
              </div>

              {/* Score Indicator */}
              <div className={`absolute top-0 left-0 w-1 h-full ${
                (result.risk_score >= 70 || ["CRITICAL", "HIGH_RISK", "HIGH_DANGER"].includes(result.risk_level)) ? "bg-rose-500" : 
                (result.risk_score >= 40 || ["SUSPICIOUS", "UNKNOWN"].includes(result.risk_level)) ? "bg-amber-500" : 
                result.risk_level === "UNKNOWN" ? "bg-slate-500" : "bg-emerald-500"
              }`} />

              <div className="flex flex-wrap gap-8 items-center bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl mb-8">
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">KẾT LUẬN CỦA AI</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getRiskIcon(result)}</span>
                      <h2 className={`text-3xl md:text-4xl font-bold tracking-tight ${getRiskColor(result).split(' ')[0]}`}>
                        {(result.risk_score >= 70 || ["CRITICAL", "HIGH_RISK", "HIGH_DANGER"].includes(result.risk_level)) ? "LỪA ĐẢO NGUY HIỂM" : 
                         (result.risk_score >= 40 || ["SUSPICIOUS", "UNKNOWN"].includes(result.risk_level)) ? "CÓ DẤU HIỆU ĐÁNG NGỜ" : 
                         result.risk_level === "UNKNOWN" ? "KHÔNG RÕ RÀNG" : "AN TOÀN"}
                      </h2>
                    </div>
                  </div>
                  <div className="w-px h-16 bg-slate-800 hidden md:block"></div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1">MỨC ĐỘ RỦI RO</h3>
                    <div className="flex items-baseline gap-2 group relative">
                      <span className="text-4xl font-extrabold tracking-tight cursor-help">{result.risk_score}</span>
                      <span className="text-lg text-slate-500">/ 100</span>
                      
                      {/* Breakdown Tooltip */}
                      {result.risk_score_breakdown && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-xl p-4 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <h5 className="text-xs font-bold text-slate-400 mb-2 uppercase">Tại sao lại có điểm này?</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-300">Giả mạo (Impersonation)</span><span className="text-rose-400">+{result.risk_score_breakdown.impersonation_penalty || 0}</span></div>
                            <div className="flex justify-between"><span className="text-slate-300">Link độc hại (URL)</span><span className="text-rose-400">+{result.risk_score_breakdown.url_penalty || 0}</span></div>
                            <div className="flex justify-between"><span className="text-slate-300">Thúc giục (Urgency)</span><span className="text-rose-400">+{result.risk_score_breakdown.urgency_penalty || 0}</span></div>
                            <div className="flex justify-between"><span className="text-slate-300">Yêu cầu tiền (Payment)</span><span className="text-rose-400">+{result.risk_score_breakdown.payment_penalty || 0}</span></div>
                            <div className="flex justify-between border-t border-slate-700 pt-1 mt-1"><span className="text-slate-300">Khác</span><span className="text-rose-400">+{result.risk_score_breakdown.other_penalty || 0}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-px h-16 bg-slate-800 hidden md:block"></div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-400 mb-1" title="Độ chắc chắn của AI về phân tích trên (không phải là mức độ rủi ro)">ĐỘ CHẮC CHẮN VÀO KẾT QUẢ NÀY</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-blue-400">{result.confidence_score || 95}</span>
                      <span className="text-lg text-slate-500">%</span>
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="md:col-span-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-4">
                    <h4 className="text-slate-400 text-base font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5" /> GIẢI THÍCH TỪ AI SCAM EXPLAINER
                    </h4>
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-white/5 w-full sm:w-auto overflow-x-auto">
                      <button onClick={() => setExplanationLevel("simple")} className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-md transition-all ${explanationLevel === "simple" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>👶 Đơn giản</button>
                      <button onClick={() => setExplanationLevel("normal")} className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-md transition-all ${explanationLevel === "normal" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>👨 Tiêu chuẩn</button>
                      <button onClick={() => setExplanationLevel("technical")} className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-md transition-all ${explanationLevel === "technical" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}>👨‍💻 Kỹ thuật</button>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 shadow-inner">
                    <p className="text-slate-100 leading-relaxed text-lg">
                      {explanationLevel === "simple" && (result.simple_explanation || result.explanation)}
                      {explanationLevel === "normal" && result.explanation}
                      {explanationLevel === "technical" && (result.technical_explanation || result.explanation)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-slate-400 text-base font-semibold mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" /> DẤU HIỆU LỪA ĐẢO (RED FLAGS)
                  </h4>
                  <ul className="space-y-3">
                    {result.detected_flags.map((flag: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-base font-medium text-slate-200 bg-slate-950 p-4 rounded-2xl border border-rose-500/20 shadow-inner">
                        <span className="text-rose-500 mt-1"><AlertTriangle className="w-5 h-5" /></span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Psychological Attack & Scam Pattern */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-slate-400 text-base font-semibold mb-3 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-purple-400" /> PHÂN TÍCH TÂM LÝ (PSYCHOLOGICAL ATTACK)
                  </h4>
                  <div className="bg-slate-950 p-5 rounded-2xl border border-purple-500/20 shadow-inner space-y-4 h-full">
                    {[
                      { label: "Khẩn cấp / Thúc giục", score: result.psychological_analysis?.urgency_score || 0, color: "bg-rose-500" },
                      { label: "Dọa dẫm / Sợ hãi", score: result.psychological_analysis?.fear_score || 0, color: "bg-orange-500" },
                      { label: "Giả danh quyền lực", score: result.psychological_analysis?.authority_score || 0, color: "bg-indigo-500" },
                      { label: "Đánh vào lòng tham", score: result.psychological_analysis?.reward_score || 0, color: "bg-emerald-500" }
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                          <span>{item.label}</span>
                          <span>{item.score}/100</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.score}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-slate-400 text-base font-semibold mb-3 flex items-center gap-2">
                    <Search className="w-5 h-5 text-amber-400" /> KỊCH BẢN LỪA ĐẢO VIỆT NAM
                  </h4>
                  <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/20 shadow-inner h-full flex flex-col justify-center items-center text-center">
                    <span className="text-sm text-slate-400 mb-2">Hệ thống nhận diện kịch bản:</span>
                    <span className="text-xl font-bold text-amber-400">{result.vietnam_scam_pattern || "Không rõ"}</span>
                  </div>
                </div>
              </div>

              {/* Manipulation Tactics & Extracted Entities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-slate-400 text-base font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-pink-400" /> THỦ THUẬT SỬ DỤNG
                  </h4>
                  <ul className="space-y-3">
                    {result.manipulation_tactics?.map((tactic: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-base font-medium text-slate-300 bg-slate-950 p-4 rounded-2xl border border-purple-500/20 shadow-inner">
                        <span className="text-purple-500 font-bold mt-0.5">{idx + 1}.</span>
                        <span>{tactic}</span>
                      </li>
                    ))}
                    {(!result.manipulation_tactics || result.manipulation_tactics.length === 0) && (
                      <p className="text-slate-500 text-sm italic">Không phát hiện thủ thuật thao túng tâm lý rõ ràng.</p>
                    )}
                  </ul>
                </div>
                <div>
                  <h4 className="text-slate-400 text-base font-semibold mb-3 flex items-center gap-2">
                    <ScanLine className="w-5 h-5 text-cyan-400" /> BÓC TÁCH THÔNG TIN ĐÁNG NGỜ
                  </h4>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/20 shadow-inner text-sm space-y-4">
                    <div>
                      <span className="font-semibold text-cyan-400 block mb-1">🔗 Đường link đáng ngờ:</span>
                      {result.entity_intelligence?.suspicious_links?.length > 0 ? (
                        <ul className="list-disc pl-5 text-slate-300">{result.entity_intelligence.suspicious_links.map((link: string, i: number) => <li key={i}>{link}</li>)}</ul>
                      ) : <span className="text-slate-500">Không có</span>}
                    </div>
                    <div>
                      <span className="font-semibold text-cyan-400 block mb-1">🏦 Số tài khoản ngân hàng:</span>
                      {result.entity_intelligence?.bank_accounts?.length > 0 ? (
                        <ul className="list-disc pl-5 text-slate-300">{result.entity_intelligence.bank_accounts.map((acc: string, i: number) => <li key={i}>{acc}</li>)}</ul>
                      ) : <span className="text-slate-500">Không có</span>}
                    </div>
                    <div>
                      <span className="font-semibold text-cyan-400 block mb-1">📞 Số điện thoại:</span>
                      {result.entity_intelligence?.phone_numbers?.length > 0 ? (
                        <ul className="list-disc pl-5 text-slate-300">{result.entity_intelligence.phone_numbers.map((phone: string, i: number) => <li key={i}>{phone}</li>)}</ul>
                      ) : <span className="text-slate-500">Không có</span>}
                    </div>
                    <div>
                      <span className="font-semibold text-cyan-400 block mb-1">🏢 Tổ chức/Cá nhân bị mạo danh:</span>
                      {result.entity_intelligence?.organizations_mentioned?.length > 0 ? (
                        <ul className="list-disc pl-5 text-slate-300">{result.entity_intelligence.organizations_mentioned.map((org: string, i: number) => <li key={i}>{org}</li>)}</ul>
                      ) : <span className="text-slate-500">Không có</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Intelligence & Risk Score Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* URL Intelligence */}
                <div>
                  <h4 className="text-slate-400 text-base font-semibold mb-3 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-400" /> PHÂN TÍCH ĐƯỜNG LINK (URL)
                  </h4>
                  <div className="bg-slate-950 p-5 rounded-2xl border border-blue-500/20 shadow-inner h-full">
                    {result.url_intelligence ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">Giả mạo ký tự (Typosquatting):</span>
                          {result.url_intelligence.has_typosquatting ? <span className="text-rose-400 font-bold">Có</span> : <span className="text-emerald-400">Không</span>}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">Đuôi tên miền đáng ngờ:</span>
                          {result.url_intelligence.suspicious_domain_extension ? <span className="text-rose-400 font-bold">Có</span> : <span className="text-emerald-400">Không</span>}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">Rút gọn link:</span>
                          {result.url_intelligence.is_shortened ? <span className="text-amber-400 font-bold">Có</span> : <span className="text-emerald-400">Không</span>}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800 text-sm text-slate-400 italic">
                          {result.url_intelligence.explanation}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm italic h-full flex items-center justify-center">Không có đường link nào được phân tích.</div>
                    )}
                  </div>
                </div>

                {/* Risk Score Breakdown */}
                <div>
                  <h4 className="text-slate-400 text-base font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" /> CHI TIẾT ĐIỂM RỦI RO
                  </h4>
                  <div className="bg-slate-950 p-5 rounded-2xl border border-yellow-500/20 shadow-inner h-full flex flex-col justify-center">
                    {result.risk_score_breakdown ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Yếu tố giả mạo:</span>
                          <span className="text-rose-400 font-bold">+{result.risk_score_breakdown.impersonation_penalty} đ</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Đường link độc hại:</span>
                          <span className="text-rose-400 font-bold">+{result.risk_score_breakdown.url_penalty} đ</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Thúc giục / Đe dọa:</span>
                          <span className="text-orange-400 font-bold">+{result.risk_score_breakdown.urgency_penalty} đ</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Yêu cầu chuyển tiền / OTP:</span>
                          <span className="text-rose-400 font-bold">+{result.risk_score_breakdown.payment_penalty} đ</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Các yếu tố khác:</span>
                          <span className="text-yellow-400 font-bold">+{result.risk_score_breakdown.other_penalty} đ</span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between items-center font-bold">
                          <span className="text-slate-200">Tổng cộng (Tối đa 100):</span>
                          <span className={getRiskColor(result.risk_level).split(' ')[0]}>{result.risk_score} đ</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-sm italic text-center">Không có chi tiết điểm.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* INCIDENT RESPONSE */}
              <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-xl mt-8">
                <h4 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                  <HeartPulse className="w-6 h-6 text-rose-400" /> BẠN NÊN LÀM GÌ TIẾP THEO?
                </h4>
                
                {hasClicked === null ? (
                  <div className="flex flex-col md:flex-row gap-4 justify-center items-center py-4">
                    <p className="text-slate-300 font-medium text-lg w-full md:w-auto text-center">Bạn đã làm theo yêu cầu / bấm vào link chưa?</p>
                    <div className="flex gap-4">
                      <button onClick={() => setHasClicked(false)} className="px-6 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold transition-all shadow-lg">CHƯA LÀM GÌ CẢ</button>
                      <button onClick={() => setHasClicked(true)} className="px-6 py-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 font-bold transition-all shadow-lg">TÔI ĐÃ LỠ BẤM / CHUYỂN TIỀN</button>
                    </div>
                  </div>
                ) : hasClicked === false ? (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <ShieldOff className="w-8 h-8 text-emerald-500" />
                      <h5 className="text-emerald-400 text-lg font-bold">BẠN CHƯA GẶP NGUY HIỂM TỨC THÌ</h5>
                    </div>
                    <ul className="space-y-3">
                      {(result.incident_response_not_clicked || result.actionable_advice || []).map((advice: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-base text-emerald-100 font-medium">
                          <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                          <span>{advice}</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => setHasClicked(null)} className="mt-6 text-sm text-slate-400 underline hover:text-white">Thay đổi tình trạng</button>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
                      <h5 className="text-rose-400 text-lg font-bold">ỨNG PHÓ KHẨN CẤP (INCIDENT RESPONSE)</h5>
                    </div>
                    <p className="text-rose-200 mb-4 font-medium">Bạn đã lỡ làm theo yêu cầu. Hãy bình tĩnh và làm ngay các bước sau:</p>
                    <ul className="space-y-3">
                      {(result.incident_response_clicked || result.actionable_advice || []).map((advice: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-base text-rose-100 font-medium">
                          <span className="text-rose-500 font-bold mt-0.5">!</span>
                          <span>{advice}</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => setHasClicked(null)} className="mt-6 text-sm text-slate-400 underline hover:text-white">Thay đổi tình trạng</button>
                  </motion.div>
                )}
              </div>

              {/* AI CHAT ASSISTANT */}
              <div className="mt-8 border-t border-white/10 pt-8">
                <h4 className="text-indigo-400 text-lg font-bold mb-4 flex items-center gap-2">
                  <BrainCircuit className="w-6 h-6" /> HỎI ĐÁP CÙNG SCAMLENS AI
                </h4>
                
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 flex flex-col h-[300px]">
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4 custom-scrollbar pr-2">
                    {chatHistory.length === 0 && (
                      <div className="text-center text-slate-500 mt-10">
                        <p>Bạn có thắc mắc về kết quả phân tích này?</p>
                        <p className="text-xs mt-1">Ví dụ: &quot;Làm sao để biết link này là giả mạo?&quot;</p>
                      </div>
                    )}
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                          {msg.role === 'user' ? (
                            msg.content
                          ) : (
                            <ReactMarkdown
                              components={{
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-indigo-300" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="" {...props} />,
                                a: ({node, ...props}) => <a className="text-indigo-400 hover:text-indigo-300 underline" {...props} />,
                                h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2 text-white" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2 text-white" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-2 mb-1 text-white" {...props} />,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    ))}
                    {isChatting && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl px-4 py-2 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> AI đang gõ...
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="text" 
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder="Hỏi AI về kết quả này..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      onClick={handleSendChat}
                      disabled={isChatting || !chatMessage.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* USER FEEDBACK */}
              <div className="mt-8 border-t border-white/10 pt-6 flex flex-col items-center">
                <p className="text-slate-400 text-sm mb-3">Đánh giá này có chính xác không?</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setFeedbackGiven("up")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${feedbackGiven === "up" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"}`}
                  >
                    👍 Chính xác
                  </button>
                  <button 
                    onClick={() => setFeedbackGiven("down")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${feedbackGiven === "down" ? "bg-rose-500/20 border-rose-500/50 text-rose-400" : "bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800"}`}
                  >
                    👎 Sai lệch
                  </button>
                </div>
                {feedbackGiven && <p className="text-emerald-400 text-xs mt-3">Cảm ơn bạn đã đóng góp ý kiến!</p>}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
