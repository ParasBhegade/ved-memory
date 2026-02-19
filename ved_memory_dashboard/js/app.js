const BASE_URL = "http://127.0.0.1:8000";
let selectedProjectId = null;

/* =============================
   TOKEN MANAGEMENT
============================= */

function getToken() {
    return localStorage.getItem("token");
}

function setToken(token) {
    localStorage.setItem("token", token);
}

function clearToken() {
    localStorage.removeItem("token");
}

/* =============================
   FETCH WITH AUTH
============================= */

async function fetchWithAuth(url, method = "GET", body = null) {
    const token = getToken();

    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (response.status === 401) {
        clearToken();
        window.location.href = "index.html";
        return;
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error(errorText);
        throw new Error(errorText);
    }

    return response.json();
}

/* =============================
   LOGIN
============================= */

async function handleLogin(event) {
    event.preventDefault();   // 🚨 prevents GET request (fix 405)

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const status = document.getElementById("status");

    if (!email || !password) {
        status.innerText = "Enter email and password";
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            status.innerText = "Login failed";
            return;
        }

        const data = await response.json();
        setToken(data.access_token);

        window.location.href = "dashboard.html";

    } catch (error) {
        status.innerText = "Login error";
    }
}

/* =============================
   DASHBOARD INIT
============================= */

function initDashboard() {
    if (!getToken()) {
        window.location.href = "index.html";
        return;
    }

    loadProjects();

    document.getElementById("logoutBtn").onclick = () => {
        clearToken();
        window.location.href = "index.html";
    };

    document.getElementById("testMemoryBtn").onclick = testMemory;
}

/* =============================
   LOAD PROJECTS
============================= */

async function loadProjects() {
    const projects = await fetchWithAuth(`${BASE_URL}/projects`);
    const projectList = document.getElementById("projectList");
    projectList.innerHTML = "";

    projects.forEach(project => {
        const div = document.createElement("div");
        div.className = "project-item";
        div.innerText = project.name;

        div.onclick = () => {
            selectedProjectId = project.id;
            loadConversations(project.id);
        };

        projectList.appendChild(div);
    });
}

/* =============================
   LOAD CONVERSATIONS
============================= */

async function loadConversations(projectId) {
    const conversations = await fetchWithAuth(
        `${BASE_URL}/conversations?project_id=${projectId}`
    );

    const list = document.getElementById("conversationList");
    list.innerHTML = "";

    conversations.forEach(conv => {
        const div = document.createElement("div");
        div.className = "conversation-item";
        div.innerText = `#${conv.id} - ${conv.created_at}`;

        div.onclick = () => {
            document.getElementById("conversationDetail").innerText =
                conv.raw_content;
        };

        list.appendChild(div);
    });
}

/* =============================
   MEMORY TEST
============================= */

async function testMemory() {
    if (!selectedProjectId) {
        alert("Select project first");
        return;
    }

    const query = document.getElementById("memoryQuery").value.trim();
    if (!query) {
        alert("Enter query");
        return;
    }

    const result = await fetchWithAuth(
        `${BASE_URL}/memory/context`,
        "POST",
        {
            project_id: selectedProjectId,
            query
        }
    );

    const container = document.getElementById("memoryResult");
    container.innerHTML = `<p>Total Scanned: ${result.total_scanned}</p>`;

    result.context_blocks.forEach(block => {
        container.innerHTML += `
            <div>
                <strong>Score:</strong> ${block.score}<br>
                <pre>${block.raw_content.slice(0, 400)}</pre>
            </div>
        `;
    });
}

/* =============================
   ROUTING
============================= */

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    if (document.getElementById("projectList")) {
        initDashboard();
    }

});
