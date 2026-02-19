chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request) {
    console.error("Received null or undefined request");
    return;
  }
  
  if (!request.type) {
    console.error("Request missing type field:", request);
    return;
  }
  
  try {
    if (request.type === "GET_TAB_ID") {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          console.error("No active tab found");
          sendResponse({ tabId: null, error: "No active tab" });
          return;
        }
        
        const tab = tabs[0];
        if (!tab || !tab.id) {
          console.error("Tab object invalid:", tab);
          sendResponse({ tabId: null, error: "Invalid tab" });
          return;
        }
        
        console.log("Returning tab ID:", tab.id);
        sendResponse({ tabId: tab.id });
      });
      return true;
    }
    
    if (request.type === "PING") {
      console.log("PING received");
      sendResponse({ status: "alive" });
      return;
    }
    
    console.warn("Unknown message type:", request.type);
    sendResponse({ error: "Unknown message type" });
  } catch (error) {
    console.error("Error handling message:", error);
    sendResponse({ error: error.message });
  }
});