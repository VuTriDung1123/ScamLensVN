"use client";

import { useState, useRef } from "react";
import { toPng, toBlob } from "html-to-image";
import { 
  Download, 
  Share2, 
  Copy, 
  Check, 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  Eye, 
  Sparkles,
  QrCode,
  ArrowRight
} from "lucide-react";

interface ScamAlertCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: any;
  analyzedText?: string;
  hasImage?: boolean;
}

export default function ScamAlertCardModal({
  isOpen,
  onClose,
  result,
  analyzedText,
  hasImage
}: ScamAlertCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !result) return null;

  const riskLevel = (result.risk_level || "UNKNOWN").toUpperCase();
  const riskScore = result.risk_score ?? 50;
  const scamCategory = result.vietnam_scam_pattern || result.scam_category || "Chiêu trò lừa đảo qua mạng";
  const simpleExplanation = result.simple_explanation || result.explanation || "Nội dung có dấu hiệu lừa đảo, tuyệt đối không làm theo yêu cầu!";
  const advice = result.incident_response?.not_interacted_advice || result.action_advice || "Tuyệt đối không chuyển tiền, không click link, không cung cấp mã OTP!";

  let badgeColor = "bg-rose-600 text-white";
  let badgeBorder = "border-rose-500/40";
  let bgGradient = "from-rose-950/60 via-slate-900 to-slate-950";

  if (riskScore < 40) {
    badgeColor = "bg-emerald-600 text-white";
    badgeBorder = "border-emerald-500/40";
    bgGradient = "from-emerald-950/60 via-slate-900 to-slate-950";
  } else if (riskScore < 70) {
    badgeColor = "bg-amber-600 text-white";
    badgeBorder = "border-amber-500/40";
    bgGradient = "from-amber-950/60 via-slate-900 to-slate-950";
  }

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `ScamLens_Canh_Bao_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Download card error:", err);
      alert("Không thể xuất ảnh thẻ cảnh báo.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      const blob = await toBlob(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.warn("Direct clipboard image copy failed, copying shareable text instead:", err);
      const textToCopy = `🚨 [CẢNH BÁO LỪA ĐẢO TỪ SCAMLENS VN]\n\n⚠️ Hình thức: ${scamCategory}\n📊 Mức độ rủi ro: ${riskScore}%\n💡 Tóm tắt: ${simpleExplanation}\n🛡️ Lời khuyên: ${advice}\n\n👉 Kiểm tra an toàn miễn phí tại: https://ais-dev-klwfkxasldz2nso4wzovp4-59274217391.asia-east1.run.app`;
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-white font-bold text-base">Thẻ Cảnh Báo Chia Sẻ Gia Đình</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Preview Canvas */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center">
          
          {/* THE CARD TO EXPORT */}
          <div 
            ref={cardRef}
            className={`w-full max-w-md bg-gradient-to-br ${bgGradient} border ${badgeBorder} rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden`}
            style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
          >
            {/* Top Branding Banner */}
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center font-black text-white text-sm shadow-md">
                  SL
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-sm tracking-wide">ScamLens VN</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Hệ thống Cảnh báo Lừa đảo AI</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${badgeColor} shadow-md`}>
                RỦI RO {riskScore}%
              </div>
            </div>

            {/* Main Scam Pattern Title */}
            <div className="mb-4">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                Chiêu trò phát hiện:
              </span>
              <h3 className="text-lg font-black text-white leading-snug">
                {scamCategory}
              </h3>
            </div>

            {/* Simple Explanation Box (Elderly Friendly) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-4">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Giải thích ngắn gọn cho người thân:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {simpleExplanation}
              </p>
            </div>

            {/* Key Action Rule */}
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-3.5 mb-4 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200">
                <strong className="text-rose-300 block mb-0.5">3 NGUYÊN TẮC AN TOÀN:</strong>
                1. Không gửi mã OTP • 2. Không cài file .APK lạ • 3. Không chuyển tiền bảo đảm
              </div>
            </div>

            {/* Footer verification tag */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
              <span>Được quét bởi Trí tuệ Nhân tạo ScamLens</span>
              <span className="font-semibold text-indigo-400">scamlens.vn</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            * Hãy gửi ảnh này vào nhóm chat gia đình / Zalo để cảnh báo bố mẹ và người thân.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyImage}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Đã sao chép!" : "Sao chép ảnh"}
            </button>
            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Đang xuất ảnh..." : "Tải ảnh (.png)"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
