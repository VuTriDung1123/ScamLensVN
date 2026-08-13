const API_URL = "http://127.0.0.1:8000/api/analyze";

document.addEventListener("DOMContentLoaded", () => {
  const captureBtn = document.getElementById("captureBtn");
  const analyzeTextBtn = document.getElementById("analyzeTextBtn");
  const textInput = document.getElementById("textInput");
  const newScanBtn = document.getElementById("newScanBtn");

  const inputSection = document.getElementById("inputSection");
  const resultSection = document.getElementById("resultSection");
  const loadingSection = document.getElementById("loadingSection");
  const errorSection = document.getElementById("errorSection");
  const errorMsg = document.getElementById("errorMsg");

  // Check if there is pending analysis from context menu
  chrome.storage.local.get(["pendingAnalysis"], (result) => {
    if (result.pendingAnalysis) {
      if (result.pendingAnalysis.type === "text") {
        textInput.value = result.pendingAnalysis.data;
        chrome.storage.local.remove(["pendingAnalysis"]);
        analyzeText(result.pendingAnalysis.data);
      }
    }
  });

  captureBtn.addEventListener("click", () => {
    // Capture the visible tab
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        showError("Không thể chụp ảnh màn hình. Hãy chắc chắn bạn không ở trang chrome://");
        return;
      }
      
      // Convert base64 to Blob
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "screenshot.png", { type: "image/png" });
          analyzeData(file, textInput.value.trim());
        })
        .catch(err => {
          console.error(err);
          showError("Lỗi xử lý ảnh chụp màn hình.");
        });
    });
  });

  analyzeTextBtn.addEventListener("click", () => {
    const text = textInput.value.trim();
    if (!text) {
      showError("Vui lòng nhập văn bản cần phân tích.");
      return;
    }
    analyzeText(text);
  });

  newScanBtn.addEventListener("click", () => {
    inputSection.classList.remove("hidden");
    resultSection.classList.add("hidden");
    resultSection.style.display = "none";
    textInput.value = "";
    hideError();
  });

  function analyzeText(text) {
    analyzeData(null, text);
  }

  async function analyzeData(file, text) {
    hideError();
    inputSection.classList.add("hidden");
    resultSection.classList.add("hidden");
    resultSection.style.display = "none";
    loadingSection.classList.remove("hidden");

    const formData = new FormData();
    if (text) {
      formData.append("text", text);
    }
    if (file) {
      formData.append("image", file);
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      renderResult(result);
      
      // Đồng bộ vào lịch sử của Web App
      chrome.tabs.query({ url: ["http://localhost:3000/*", "http://127.0.0.1:3000/*"] }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "SAVE_HISTORY",
            payload: {
              text: text,
              has_image: !!file,
              result: result
            }
          }).catch(err => {
            console.log("Web App tab is open but not refreshed yet. Could not sync.", err);
          });
        }
      });
    } catch (err) {
      console.error(err);
      showError("Không thể kết nối với ScamLens Backend. Đảm bảo bạn đang chạy server backend (localhost:8000).");
      loadingSection.classList.add("hidden");
      inputSection.classList.remove("hidden");
    }
  }

  function renderResult(result) {
    loadingSection.classList.add("hidden");
    resultSection.classList.remove("hidden");
    resultSection.style.display = "flex";

    const riskScore = document.getElementById("riskScore");
    const riskLabel = document.getElementById("riskLabel");
    const riskIndicator = document.getElementById("riskIndicator");
    const scamCategory = document.getElementById("scamCategory");
    const explanationText = document.getElementById("explanationText");
    const redFlagsContainer = document.getElementById("redFlagsContainer");
    const redFlagsList = document.getElementById("redFlagsList");
    const adviceList = document.getElementById("adviceList");

    riskScore.textContent = result.risk_score;
    scamCategory.textContent = (result.scam_category || "Khác").replace(/_/g, " ");
    
    // Set colors based on risk
    riskScore.className = "text-4xl font-black";
    riskLabel.className = "text-lg font-bold mt-1";
    riskIndicator.className = "absolute top-0 left-0 w-full h-1";

    if (result.risk_level === "HIGH_DANGER") {
      riskScore.classList.add("text-rose-500");
      riskLabel.classList.add("text-rose-500");
      riskLabel.textContent = "LỪA ĐẢO NGUY HIỂM";
      riskIndicator.classList.add("bg-rose-500");
    } else if (result.risk_level === "SUSPICIOUS") {
      riskScore.classList.add("text-amber-500");
      riskLabel.classList.add("text-amber-500");
      riskLabel.textContent = "ĐÁNG NGỜ";
      riskIndicator.classList.add("bg-amber-500");
    } else {
      riskScore.classList.add("text-emerald-500");
      riskLabel.classList.add("text-emerald-500");
      riskLabel.textContent = "AN TOÀN";
      riskIndicator.classList.add("bg-emerald-500");
    }

    explanationText.textContent = result.simple_explanation || result.explanation || "";

    // Render Red Flags
    redFlagsList.innerHTML = "";
    if (result.detected_flags && result.detected_flags.length > 0) {
      redFlagsContainer.classList.remove("hidden");
      redFlagsContainer.style.display = "flex";
      result.detected_flags.forEach(flag => {
        const li = document.createElement("li");
        li.className = "flex gap-2 items-start";
        li.innerHTML = `<span class="text-rose-500 font-bold mt-0.5">!</span><span>${flag}</span>`;
        redFlagsList.appendChild(li);
      });
    } else {
      redFlagsContainer.classList.add("hidden");
      redFlagsContainer.style.display = "none";
    }

    // Render Advice
    adviceList.innerHTML = "";
    const advices = result.actionable_advice || result.incident_response_not_clicked || [];
    if (advices.length > 0) {
      advices.forEach(advice => {
        const li = document.createElement("li");
        li.className = "flex gap-2 items-start";
        li.innerHTML = `<span class="text-emerald-500 font-bold mt-0.5">✓</span><span>${advice}</span>`;
        adviceList.appendChild(li);
      });
    } else {
      adviceList.innerHTML = `<li class="text-slate-500 italic">Không có lời khuyên cụ thể.</li>`;
    }
  }

  function showError(msg) {
    errorSection.classList.remove("hidden");
    errorMsg.textContent = msg;
  }

  function hideError() {
    errorSection.classList.add("hidden");
    errorMsg.textContent = "";
  }
});
