const BASE_URL = "http://127.0.0.1:8000";

// DOM Elements
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const projectSelect = document.getElementById("projectSelect");
const saveBtn = document.getElementById("saveBtn");
const logoutBtn = document.getElementById("logoutBtn");
const statusDiv = document.getElementById("status");
const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");

// Guard: Check if all elements exist
if (!emailInput || !passwordInput || !loginBtn || !projectSelect || !saveBtn || !logoutBtn || !statusDiv || !loginSection || !mainSection) {
  console.error("One or more DOM elements not found");
}

function showStatus(message, type) {
  if (!statusDiv) {
    console.error("Status div not found");
    return;
  }
  statusDiv.textContent = message;
  statusDiv.className = type;
  setTimeout(() => {
    statusDiv.className = "";
  }, 3000);
}

function hideStatus() {
  if (!statusDiv) return;
  statusDiv.className = "";
  statusDiv.textContent = "";
}

async function apiCall(url, method = "GET", body = null, token = null) {
  try {
    if (!url) {
      throw new Error("URL is required");
    }

    const headers = {
      "Content-Type": "application/json"
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log("Calling:", url);
    console.log("Method:", method);
    if (token) console.log("Token:", token.substring(0, 20) + "...");
    if (body) console.log("Payload:", JSON.stringify(body));
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      if (response.status === 401) {
        await chrome.storage.local.remove("access_token");
        console.log("Token cleared due to 401");
      }
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch (parseError) {
        try {
          const text = await response.text();
          if (text) {
            errorMessage = text;
          }
        } catch (textError) {
          console.error("Could not read error response");
        }
      }
      
      console.error("API error response:", errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API call failed:", error.message);
    throw error;
  }
}

async function loadProjects(token) {
  if (!token) {
    console.error("No token provided to loadProjects");
    showStatus("No token available", "error");
    return;
  }
  
  try {
    const url = `${BASE_URL}/projects`;
    const projects = await apiCall(url, "GET", null, token);
    
    if (!Array.isArray(projects)) {
      console.error("Projects response is not an array:", projects);
      throw new Error("Invalid projects response format");
    }
    
    if (!projectSelect) {
      console.error("Project select element not found");
      return;
    }
    
    projectSelect.innerHTML = '<option value="">Select Project</option>';
    
    projects.forEach((project, index) => {
      if (!project) {
        console.error("Project is null at index:", index);
        return;
      }
      
      if (!project.id || !project.name) {
        console.error("Project missing id or name at index:", index, project);
        return;
      }
      
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      projectSelect.appendChild(option);
    });
    
    console.log("Loaded", projects.length, "projects");
  } catch (error) {
    console.error("Load projects error:", error);
    showStatus("Error loading projects: " + error.message, "error");
  }
}

async function validateToken() {
  try {
    const storage = await chrome.storage.local.get("access_token");
    const token = storage.access_token;
    
    if (!token) {
      console.log("No token found in storage");
      return false;
    }
    
    console.log("Validating token...");
    const url = `${BASE_URL}/projects`;
    await apiCall(url, "GET", null, token);
    console.log("Token validation successful");
    return true;
  } catch (error) {
    console.error("Token validation failed:", error.message);
    await chrome.storage.local.remove("access_token");
    return false;
  }
}

async function showMainInterface() {
  try {
    const isValid = await validateToken();
    
    if (!loginSection || !mainSection) {
      console.error("Login or main section element not found");
      return;
    }
    
    if (isValid) {
      const storage = await chrome.storage.local.get("access_token");
      const token = storage.access_token;
      
      if (!token) {
        console.error("Token became unavailable after validation");
        loginSection.style.display = "block";
        mainSection.style.display = "none";
        return;
      }
      
      loginSection.style.display = "none";
      mainSection.style.display = "block";
      await loadProjects(token);
    } else {
      loginSection.style.display = "block";
      mainSection.style.display = "none";
    }
  } catch (error) {
    console.error("Error in showMainInterface:", error);
    if (loginSection) {
      loginSection.style.display = "block";
    }
    if (mainSection) {
      mainSection.style.display = "none";
    }
  }
}

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    if (!emailInput || !passwordInput) {
      console.error("Email or password input not found");
      return;
    }
    
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
      showStatus("Please enter email and password", "error");
      return;
    }
    
    try {
      const url = `${BASE_URL}/auth/login`;
      const data = await apiCall(url, "POST", { email, password });
      
      if (!data) {
        throw new Error("Empty response from login endpoint");
      }
      
      if (!data.access_token) {
        throw new Error("No access token in response");
      }
      
      await chrome.storage.local.set({ access_token: data.access_token });
      
      emailInput.value = "";
      passwordInput.value = "";
      hideStatus();
      await showMainInterface();
      showStatus("Login successful", "success");
    } catch (error) {
      console.error("Login error:", error);
      showStatus("Login failed: " + error.message, "error");
    }
  });
}

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    if (!projectSelect) {
      console.error("Project select element not found");
      return;
    }
    
    const projectId = projectSelect.value;
    
    if (!projectId) {
      showStatus("Please select a project", "error");
      return;
    }
    
    try {
      const storage = await chrome.storage.local.get("access_token");
      const token = storage.access_token;
      
      if (!token) {
        showStatus("Not authenticated. Please login again.", "error");
        return;
      }
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tabs || tabs.length === 0) {
        showStatus("No active tab found", "error");
        return;
      }
      
      const tabId = tabs[0].id;
      
      if (!tabId) {
        console.error("Tab ID is invalid:", tabId);
        showStatus("Invalid tab ID", "error");
        return;
      }
      
      let conversationText;
      try {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: "EXTRACT_CONVERSATION"
        });
        
        if (!response) {
          throw new Error("Empty response from content script");
        }
        
        conversationText = response.text;
      } catch (messageError) {
        console.error("Message error:", messageError.message);
        showStatus("Could not extract conversation. Make sure you're on ChatGPT", "error");
        return;
      }
      
      if (!conversationText) {
        showStatus("No conversation text extracted", "error");
        return;
      }
      
      const trimmedText = conversationText.trim();
      
      if (trimmedText.length === 0) {
        showStatus("No conversation found to save", "error");
        return;
      }
      
      if (trimmedText.length < 10) {
        showStatus("Conversation too short to save", "error");
        return;
      }
      
      const url = `${BASE_URL}/conversations/save`;
      const body = {
        project_id: parseInt(projectId, 10),
        raw_content: trimmedText
      };
      
      const result = await apiCall(url, "POST", body, token);
      
      if (!result) {
        throw new Error("Empty response from save endpoint");
      }
      
      showStatus("Conversation saved successfully", "success");
    } catch (error) {
      console.error("Save error:", error);
      showStatus("Error saving: " + error.message, "error");
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await chrome.storage.local.remove("access_token");
      
      if (loginSection) {
        loginSection.style.display = "block";
      }
      if (mainSection) {
        mainSection.style.display = "none";
      }
      if (projectSelect) {
        projectSelect.innerHTML = '<option value="">Select Project</option>';
      }
      if (emailInput) {
        emailInput.value = "";
      }
      if (passwordInput) {
        passwordInput.value = "";
      }
      
      showStatus("Logged out", "success");
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      showStatus("Error logging out", "error");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, showing main interface");
  showMainInterface();
});