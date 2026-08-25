"use client";

import { useState } from "react";
import { 
  PhoneCall, 
  ShieldAlert, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  X, 
  AlertTriangle, 
  Smartphone, 
  Lock, 
  WifiOff, 
  HelpCircle,
  Building2,
  Search
} from "lucide-react";

interface EmergencyPanicHubProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceData?: {
    scamType?: string;
    details?: string;
    bankAccount?: string;
    suspiciousUrl?: string;
  };
}

const BANK_HOTLINES = [
  { name: "Vietcombank (VCB)", hotline: "1900545413", appGuide: "Vào VCB Digibank > Cài đặt > Khóa thẻ / Tạm dừng dịch vụ", popular: true },
  { name: "Techcombank (TCB)", hotline: "1800588822", appGuide: "Vào Techcombank Mobile > Thẻ > Khóa thẻ ngay", popular: true },
  { name: "MBBank (Quân Đội)", hotline: "1900545426", appGuide: "Vào MBBank App > Tiện ích > Khóa thẻ / Tạm dừng tài khoản", popular: true },
  { name: "BIDV", hotline: "19009247", appGuide: "Vào SmartBanking > Cài đặt > Khóa dịch vụ khẩn cấp", popular: true },
  { name: "VietinBank (CTG)", hotline: "1900558868", appGuide: "Vào VietinBank iPay > Quản lý thẻ > Khóa thẻ", popular: true },
  { name: "ACB (Á Châu)", hotline: "1900545486", appGuide: "Vào ACB ONE > Thẻ > Khóa thẻ tức thì", popular: true },
  { name: "TPBank (Tiên Phong)", hotline: "1900585885", appGuide: "Vào TPBank Mobile > Quản lý thẻ > Khóa thẻ nhanh", popular: true },
  { name: "VPBank", hotline: "1900545415", appGuide: "Vào VPBank NEO > Thẻ > Khóa thẻ", popular: true },
  { name: "Sacombank", hotline: "1800585888", appGuide: "Vào Sacombank Pay > Quản lý thẻ > Tạm khóa thẻ", popular: false },
  { name: "HDBank", hotline: "19006060", appGuide: "Vào HDBank Mobile > Dịch vụ thẻ > Khóa thẻ", popular: false },
  { name: "VIB (Quốc Tế)", hotline: "18008180", appGuide: "Vào MyVIB > Thẻ > Khóa thẻ khẩn cấp", popular: false },
  { name: "SHB", hotline: "1800588856", appGuide: "Vào SHB Mobile > Quản lý thẻ > Khóa thẻ", popular: false },
  { name: "MSB (Hàng Hải)", hotline: "1800599999", appGuide: "Vào MSB mBank > Dịch vụ thẻ > Khóa thẻ", popular: false },
  { name: "MoMo (Ví điện tử)", hotline: "1900545441", appGuide: "Vào Ví MoMo > Ví của tôi > Cài đặt bảo mật > Tạm khóa tài khoản", popular: true },
  { name: "ZaloPay (Ví điện tử)", hotline: "1900545436", appGuide: "Vào ZaloPay > Cá nhân > Thiết lập bảo vệ tài khoản", popular: true },
  { name: "Viettel Money", hotline: "18009000", appGuide: "Vào Viettel Money > Cài đặt > Khóa tài khoản", popular: false },
];

export default function EmergencyPanicHub({ isOpen, onClose, evidenceData }: EmergencyPanicHubProps) {
  const [activeTab, setActiveTab] = useState<"checklist" | "hotlines" | "complaint">("checklist");
  const [searchBank, setSearchBank] = useState("");
  const [copied, setCopied] = useState(false);

  // Complaint Form Pre-filled State
  const [victimName, setVictimName] = useState("");
  const [victimId, setVictimId] = useState("");
  const [victimPhone, setVictimPhone] = useState("");
  const [victimAddress, setVictimAddress] = useState("");
  const [lossAmount, setLossAmount] = useState("");
  const [scamDescription, setScamDescription] = useState(
    evidenceData?.details || evidenceData?.scamType || "Đối tượng gửi link/tin nhắn mạo danh yêu cầu chuyển tiền/cung cấp OTP."
  );

  if (!isOpen) return null;

  const filteredBanks = BANK_HOTLINES.filter(b => 
    b.name.toLowerCase().includes(searchBank.toLowerCase()) || b.hotline.includes(searchBank)
  );

  const generateComplaintText = () => {
    return `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-------------------

ĐƠN TỐ GIÁC TỘI PHẠM
(V/v: Hành vi Lừa đảo chiếm đoạt tài sản qua không gian mạng theo Điều 174 Bộ luật Hình sự)

Kính gửi:
- CƠ QUAN CẢNH SÁT ĐIỀU TRA - CÔNG AN ......................................................
- VIỆN KIỂM SÁT NHÂN DÂN .....................................................................

1. THÔNG TIN NGƯỜI TỐ GIÁC:
- Họ và tên: ${victimName || "[Họ và tên của bạn]"}
- Sinh ngày: ...../...../.........   CCCD/CMND số: ${victimId || "[Số CCCD của bạn]"}
- Địa chỉ thường trú/tạm trú: ${victimAddress || "[Địa chỉ của bạn]"}
- Số điện thoại liên hệ: ${victimPhone || "[Số điện thoại]"}

2. THÔNG TIN ĐỐI TƯỢNG BỊ TỐ GIÁC:
- Tên/Nickname/Tài khoản mạng xã hội: .....................................................
- Số điện thoại/Zalo/Telegram của đối tượng: ............................................
- Tài khoản ngân hàng nhận tiền của đối tượng: ${evidenceData?.bankAccount || "[Số TK - Ngân hàng - Tên chủ tài khoản đối tượng]"}
- Đường link website/Ứng dụng lừa đảo liên quan: ${evidenceData?.suspiciousUrl || "[Đường dẫn URL / App lừa đảo]"}

3. NỘI DUNG SỰ VIỆC & THỦ ĐOẠN LỪA ĐẢO:
Vào hồi ..... giờ ..... ngày ..... tháng ..... năm 202..., tôi có nhận được thông tin từ đối tượng nêu trên.
Cụ thể thủ đoạn: ${scamDescription}
Số tiền tôi đã bị chiếm đoạt: ${lossAmount || "[Số tiền bị thiệt hại, ví dụ: 50.000.000 VNĐ]"}

4. DANH MỤC TÀI LIỆU, CHỨNG CỨ KÈM THEO:
- 01 Bản sao CCCD của người tố giác.
- 01 Bản sao kê giao dịch ngân hàng có đóng dấu xác nhận của ngân hàng chuyển tiền.
- Ảnh chụp toàn bộ đoạn hội thoại (tin nhắn Zalo/SMS/Telegram/Facebook) với đối tượng.
- Ảnh chụp màn hình website/Mã QR/Biên lai giao dịch của đối tượng.

Tôi cam đoan những lời khai trên hoàn toàn đúng sự thật và chịu trách nhiệm trước pháp luật về lời khai của mình.

Kính mong Quý Cơ quan khẩn trương thụ lý, điều tra, phong tỏa dòng tiền và xử lý nghiêm minh các đối tượng theo quy định của pháp luật.

                                              ......, ngày ..... tháng ..... năm 202...
                                                        NGƯỜI TỐ GIÁC
                                                     (Ký và ghi rõ họ tên)
`;
  };

  const handleCopyComplaint = () => {
    navigator.clipboard.writeText(generateComplaintText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadComplaint = () => {
    const text = generateComplaintText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Don_To_Giac_Lua_Dao_${victimName ? victimName.replace(/\s+/g, "_") : "ScamLens"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-rose-950/50 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/80 p-5 border-b border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded-2xl animate-pulse">
              <ShieldAlert className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-md uppercase tracking-wider">Khẩn cấp</span>
                <h3 className="text-white text-lg font-bold">Trung Tâm Ứng Cứu Khẩn Cấp (Panic Hub)</h3>
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">Xử lý ngay trong 15 phút đầu để phong tỏa dòng tiền và bảo vệ tài khoản</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4">
          <button
            onClick={() => setActiveTab("checklist")}
            className={`py-3.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "checklist"
                ? "text-rose-400 border-rose-500 bg-rose-500/5"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            4 Bước Xử Lý 15 Phút Đầu
          </button>
          <button
            onClick={() => setActiveTab("hotlines")}
            className={`py-3.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "hotlines"
                ? "text-rose-400 border-rose-500 bg-rose-500/5"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            Hotline Khóa Khẩn Cấp Ngân Hàng
          </button>
          <button
            onClick={() => setActiveTab("complaint")}
            className={`py-3.5 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "complaint"
                ? "text-rose-400 border-rose-500 bg-rose-500/5"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            Mẫu Đơn Tố Giác Công An
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-200">
          
          {/* TAB 1: 4 BƯỚC XỬ LÝ NHANH */}
          {activeTab === "checklist" && (
            <div className="space-y-4">
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex gap-3 items-start">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200/90 leading-relaxed">
                  <strong className="text-amber-300">THỜI GIAN VÀNG 15-30 PHÚT:</strong> Sau khi bị lừa chuyển tiền hoặc lộ OTP, tiền thường bị kẻ gian luân chuyển qua nhiều tài khoản phụ trung gian. Hãy làm ngay các bước dưới đây theo thứ tự ưu tiên!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1 */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-full pointer-events-none" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500 text-white font-black flex items-center justify-center text-sm shadow-md shadow-rose-500/30">
                      1
                    </div>
                    <h4 className="text-white font-bold text-base flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-rose-400" /> Tạm khóa thẻ & TK Ngân hàng
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mở App ngân hàng trên điện thoại &gt; chọn <strong>Cài đặt / Quản lý thẻ &gt; Khóa thẻ / Tạm ngưng giao dịch</strong>. Nếu không vào được app, gọi ngay Hotline 24/7 của ngân hàng ở tab bên cạnh.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full pointer-events-none" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/30">
                      2
                    </div>
                    <h4 className="text-white font-bold text-base flex items-center gap-1.5">
                      <WifiOff className="w-4 h-4 text-amber-400" /> Bật Chế độ máy bay (Nếu cài .APK)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Nếu bạn vừa bấm vào link và tải/cài đặt file <strong>.APK lạ (VNeID giả, Thuế giả)</strong>: Hãy <strong>BẬT CHẾ ĐỘ MÁY BAY</strong> hoặc tắt nguồn điện thoại ngay lập tức để ngắt quyền điều khiển từ xa của hacker!
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full pointer-events-none" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500 text-white font-black flex items-center justify-center text-sm shadow-md shadow-blue-500/30">
                      3
                    </div>
                    <h4 className="text-white font-bold text-base flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-400" /> Đổi mật khẩu từ máy khác
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sử dụng một <strong>thiết bị an toàn khác (máy tính hoặc điện thoại người thân)</strong> để đổi mật khẩu Email, iCloud/Google Account, Zalo, Facebook và mật khẩu ngân hàng.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center text-sm shadow-md shadow-emerald-500/30">
                      4
                    </div>
                    <h4 className="text-white font-bold text-base flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-400" /> Thu thập chứng cứ & Báo CA
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Chụp lại ảnh toàn bộ tin nhắn, biên lai chuyển khoản, số tài khoản kẻ lừa đảo. Không xóa tin nhắn. Tải mẫu đơn tố giác ở tab 3 để nộp trực tiếp cho Công an Phường/Xã/Quận nơi cư trú.
                  </p>
                </div>
              </div>

              {/* Warning about Recovery Scams */}
              <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 mt-4">
                <h5 className="text-rose-300 font-bold text-sm flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> CẢNH BÁO LỪA ĐẢO TẦNG 2 (RECOVERY SCAM):
                </h5>
                <p className="text-xs text-rose-200/80 leading-relaxed">
                  Tuyệt đối <strong>KHÔNG TIN</strong> các trang mạng / Fanpage / Telegram tự xưng là &ldquo;Luật sư thu hồi vốn treo&rdquo;, &ldquo;Cục An ninh mạng hỗ trợ lấy lại tiền bị lừa&rdquo;, &ldquo;Hacker lấy lại tiền&rdquo;. Đây 100% là các nhóm lừa đảo tiếp tục bắt bạn nạp thêm tiền phí!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: HOTLINE CÁC NGÂN HÀNG */}
          {activeTab === "hotlines" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-2xl">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên ngân hàng (Vietcombank, MB, Techcombank, MoMo...)"
                  value={searchBank}
                  onChange={(e) => setSearchBank(e.target.value)}
                  className="bg-transparent border-none text-white text-sm w-full focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
                {filteredBanks.map((bank, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-colors">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          {bank.name}
                        </span>
                        {bank.popular && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">Phổ biến</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {bank.appGuide}
                      </p>
                    </div>
                    <a
                      href={`tel:${bank.hotline}`}
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Gọi Hotline Khẩn Cấp: {bank.hotline}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MẪU ĐƠN TỐ GIÁC CÔNG AN */}
          {activeTab === "complaint" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Họ và tên của bạn:</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={victimName}
                    onChange={(e) => setVictimName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số CCCD/CMND:</label>
                  <input
                    type="text"
                    placeholder="00109900xxxx"
                    value={victimId}
                    onChange={(e) => setVictimId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số điện thoại liên hệ:</label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={victimPhone}
                    onChange={(e) => setVictimPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số tiền bị thiệt hại (VNĐ):</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 30.000.000 đ"
                    value={lossAmount}
                    onChange={(e) => setLossAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Preview Form */}
              <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-4 max-h-[250px] overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {generateComplaintText()}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-400">
                  * In đơn ra giấy A4, ký tên và gửi kèm <strong>bản in sao kê ngân hàng</strong> đến Công an Quận/Huyện gần nhất.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyComplaint}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Đã sao chép đơn!" : "Sao chép toàn bộ"}
                  </button>
                  <button
                    onClick={handleDownloadComplaint}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Tải file đơn (.txt)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>ScamLens VN • Hệ thống Hỗ trợ Nạn nhân An ninh mạng Quốc gia</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
