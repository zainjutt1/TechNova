/* ============================================================
   TechNova — dashboard (dashboard.html)
   Protected page: requires a valid JWT in localStorage.
   Full CRUD on messages: Create (modal), Read (table),
   Update (edit modal), Delete (button).
============================================================ */

const API_BASE = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
    ? "http://localhost:5000"
    : window.location.origin;

const token = localStorage.getItem("technova-token");

// No token at all — don't even try, go straight to login.
if (!token) {
    window.location.href = "index.html";
}

let cachedMessages = [];

function authHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

function logout() {
    localStorage.removeItem("technova-token");
    localStorage.removeItem("technova-user");
    window.location.href = "index.html";
}

function showAlert(text, type) {
    const box = document.getElementById("alertBox");
    if (!box) return;
    box.textContent = text;
    box.className = "alert show " + type;
    setTimeout(() => box.classList.remove("show"), 4000);
}

function showModalAlert(text, type) {
    const box = document.getElementById("modalAlert");
    if (!box) return;
    box.textContent = text;
    box.className = "alert show " + type;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
        " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function renderStats(messages) {
    document.getElementById("statTotal").textContent = messages.length;
    document.getElementById("statNew").textContent = messages.filter((m) => m.status === "new").length;
    document.getElementById("statRead").textContent = messages.filter((m) => m.status === "read").length;
    document.getElementById("statReplied").textContent = messages.filter((m) => m.status === "replied").length;
}

function renderTable(messages) {
    const tbody = document.getElementById("tableBody");
    const table = document.getElementById("dashTable");
    const emptyRow = document.getElementById("emptyRow");
    const loadingRow = document.getElementById("loadingRow");

    loadingRow.style.display = "none";

    if (!messages.length) {
        table.style.display = "none";
        emptyRow.style.display = "block";
        return;
    }

    table.style.display = "table";
    emptyRow.style.display = "none";

    const badgeClass = { new: "new", read: "read", replied: "replied" };

    tbody.innerHTML = messages
        .map(
            (m) => `
        <tr data-id="${m._id}">
            <td>${escapeHtml(m.name)}</td>
            <td>${escapeHtml(m.email)}</td>
            <td class="msg-cell">${escapeHtml(m.message)}</td>
            <td><span class="badge ${badgeClass[m.status] || "new"}">${escapeHtml(m.status)}</span></td>
            <td>${formatDate(m.createdAt)}</td>
            <td class="row-actions">
                <button class="btn btn-sm btn-ghost edit-btn" data-id="${m._id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${m._id}">Delete</button>
            </td>
        </tr>`
        )
        .join("");

    tbody.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const msg = cachedMessages.find((m) => m._id === this.dataset.id);
            if (msg) openModal("edit", msg);
        });
    });

    tbody.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async function () {
            const id = this.dataset.id;
            if (!confirm("Delete this message? This can't be undone.")) return;

            try {
                const res = await fetch(`${API_BASE}/api/contact/${id}`, {
                    method: "DELETE",
                    headers: authHeaders(),
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    showAlert("Message deleted.", "success");
                    loadMessages();
                } else {
                    showAlert(data.error || "Could not delete message.", "error");
                }
            } catch (err) {
                showAlert("⚠️ Could not reach the server.", "error");
                console.error(err);
            }
        });
    });
}

async function loadMessages() {
    try {
        const res = await fetch(`${API_BASE}/api/contact`, { headers: authHeaders() });

        if (res.status === 401) {
            logout();
            return;
        }

        const data = await res.json();

        if (res.ok && data.success) {
            cachedMessages = data.data;
            renderStats(data.data);
            renderTable(data.data);
        } else {
            showAlert(data.error || "Could not load messages.", "error");
        }
    } catch (err) {
        showAlert("⚠️ Could not reach the server. Is the backend running?", "error");
        console.error(err);
        document.getElementById("loadingRow").textContent = "Could not load messages.";
    }
}

async function verifySession() {
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders() });
        if (!res.ok) {
            logout();
            return;
        }
        const data = await res.json();
        const greeting = document.getElementById("userGreeting");
        if (greeting && data.user) {
            greeting.textContent = `Hi, ${data.user.name}`;
        }
        loadMessages();
    } catch (err) {
        console.error(err);
        loadMessages(); // still try — server might just be slow to respond to /me
    }
}

/* ---------- Create / Edit modal ---------- */

const overlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const messageForm = document.getElementById("messageForm");
const messageIdField = document.getElementById("messageId");
const mName = document.getElementById("mName");
const mEmail = document.getElementById("mEmail");
const mMessage = document.getElementById("mMessage");
const mStatus = document.getElementById("mStatus");
const modalSubmitBtn = document.getElementById("modalSubmitBtn");

function openModal(mode, data) {
    document.getElementById("modalAlert").className = "alert";
    messageForm.reset();

    if (mode === "edit" && data) {
        modalTitle.textContent = "Edit Message";
        messageIdField.value = data._id;
        mName.value = data.name;
        mEmail.value = data.email;
        mMessage.value = data.message;
        mStatus.value = data.status;
    } else {
        modalTitle.textContent = "New Message";
        messageIdField.value = "";
        mStatus.value = "new";
    }

    overlay.classList.add("open");
}

function closeModal() {
    overlay.classList.remove("open");
}

document.getElementById("newMessageBtn")?.addEventListener("click", () => openModal("create"));
document.getElementById("modalClose")?.addEventListener("click", closeModal);
document.getElementById("modalCancel")?.addEventListener("click", closeModal);
overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
});

messageForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = mName.value.trim();
    const email = mEmail.value.trim();
    const message = mMessage.value.trim();
    const status = mStatus.value;
    const id = messageIdField.value;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name) return showModalAlert("Please enter a name.", "error");
    if (!emailPattern.test(email)) return showModalAlert("Please enter a valid email.", "error");
    if (!message) return showModalAlert("Please enter a message.", "error");

    modalSubmitBtn.disabled = true;
    modalSubmitBtn.textContent = "Saving...";

    try {
        let res, data;

        if (id) {
            // Update (PUT)
            res = await fetch(`${API_BASE}/api/contact/${id}`, {
                method: "PUT",
                headers: authHeaders(),
                body: JSON.stringify({ name, email, message, status }),
            });
        } else {
            // Create (POST)
            res = await fetch(`${API_BASE}/api/contact`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ name, email, message, status }),
            });
        }

        data = await res.json();

        if (res.ok && data.success) {
            closeModal();
            showAlert(id ? "Message updated." : "Message created.", "success");
            loadMessages();
        } else {
            showModalAlert(data.error || "Something went wrong.", "error");
        }
    } catch (err) {
        showModalAlert("⚠️ Could not reach the server.", "error");
        console.error(err);
    } finally {
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.textContent = "Save";
    }
});

document.getElementById("logoutBtn")?.addEventListener("click", logout);

if (token) {
    verifySession();
}
