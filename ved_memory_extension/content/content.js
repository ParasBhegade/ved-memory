chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || !request.type) {
      console.error("Invalid message received:", request);
      return;
    }
    
    if (request.type === "EXTRACT_CONVERSATION") {
      try {
        const conversation = extractConversation();
        sendResponse({ text: conversation });
      } catch (error) {
        console.error("Extract conversation error:", error);
        sendResponse({ text: "", error: error.message });
      }
    }
  });
  
  function extractConversation() {
    const messages = [];
    
    const messageElements = document.querySelectorAll(
      'div[data-message-author-role="user"], div[data-message-author-role="assistant"]'
    );
    
    if (!messageElements || messageElements.length === 0) {
      console.warn("No message elements found on page");
      return "";
    }
    
    messageElements.forEach((element, index) => {
      try {
        if (!element) {
          console.error("Element is null at index:", index);
          return;
        }
        
        const role = element.getAttribute("data-message-author-role");
        
        if (!role) {
          console.warn("No role attribute found on element:", element);
          return;
        }
        
        const text = element.innerText || element.textContent;
        
        if (!text) {
          console.warn("No text content found in element at index:", index);
          return;
        }
        
        const trimmedText = text.trim();
        
        if (trimmedText.length === 0) {
          console.warn("Text is empty after trim at index:", index);
          return;
        }
        
        if (role === "user") {
          messages.push(`USER:\n${trimmedText}\n`);
        } else if (role === "assistant") {
          messages.push(`ASSISTANT:\n${trimmedText}\n`);
        } else {
          console.warn("Unknown role:", role);
        }
      } catch (error) {
        console.error("Error processing message element at index:", index, error);
      }
    });
    
    if (messages.length === 0) {
      console.warn("No valid messages extracted");
      return "";
    }
    
    const combined = messages.join("\n");
    console.log("Extracted conversation length:", combined.length);
    console.log("Total messages extracted:", messages.length);
    
    return combined;
  }