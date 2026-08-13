chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "scamlens-analyze",
    title: "Phân tích nội dung này bằng ScamLens",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "scamlens-analyze" && info.selectionText) {
    const textToAnalyze = info.selectionText;
    
    // Lưu vào storage để popup có thể đọc khi mở ra
    chrome.storage.local.set({ 
      pendingAnalysis: { 
        type: "text", 
        data: textToAnalyze 
      } 
    }, () => {
      // Vì không thể mở popup từ background, thay vào đó ta có thể
      // tạo notification hướng dẫn người dùng bấm vào icon ScamLens, 
      // hoặc tiêm một giao diện nhỏ vào trang web (content script).
      // Ở MVP này, mình sẽ hiển thị Chrome notification.
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "ScamLens VN",
        message: "Đã lưu nội dung bôi đen. Hãy bấm vào biểu tượng ScamLens trên thanh công cụ để xem kết quả phân tích!"
      });
    });
  }
});
