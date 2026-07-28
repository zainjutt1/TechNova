/* ============================================================
   TechNova — contact.html
   The whole page is gated behind login: visitors see a
   "sign in" card until they have a valid JWT, then get the
   contact form (Create) plus a table of their messages
   (Read / Update / Delete).
============================================================ */

const API_BASE = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
    ? "http://localhost:5000"
    : window.location.origin;

const token = localStorage.getItem("technova-token");

function authHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

function logout() {
    localStorage.removeItem("technova-token");
    localStorage.removeItem("technova-user");
    window.location.href = "contact.html";
}

function showAlert(text, type) {
    const box = document.getElementById("alertBox");
    if (!box) return;
    box.textContent = text;
    box.className = "alert show " + type;
    setTimeout(() => box.classList.remove("show"), 4000);
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

/* ---------- Gate: show login prompt or the real content ---------- */

function showGate() {
    document.getElementById("authGate").style.display = "flex";
    document.getElementById("contactContent").style.display = "none";
    document.getElementById("logoutBtn").style.display = "none";
}

function showContent(user) {
    document.getElementById("authGate").style.display = "none";
    document.getElementById("contactContent").style.display = "block";

    const greeting = document.getElementById("userGreeting");
    const formGreeting = document.getElementById("formGreeting");
    const logoutBtn = document.getElementById("logoutBtn");

    if (user) {
        if (greeting) greeting.textContent = `Hi, ${user.name}`;
        if (formGreeting) formGreeting.textContent = user.name;
        // Pre-fill the message form with the logged-in user's details.
        const nameField = document.getElementById("name");
        const emailField = document.getElementById("email");
        if (nameField && !nameField.value) nameField.value = user.name;
        if (emailField && !emailField.value) emailField.value = user.email;
    }
    if (logoutBtn) logoutBtn.style.display = "inline-flex";

    loadMessages();
}

async function checkAuth() {
    if (!token) {
        showGate();
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders() });
        if (!res.ok) {
            localStorage.removeItem("technova-token");
            localStorage.removeItem("technova-user");
            showGate();
            return;
        }
        const data = await res.json();
        showContent(data.user);
    } catch (err) {
        console.error(err);
        // Backend unreachable — fall back to cached user info so the page still opens.
        const cached = localStorage.getItem("technova-user");
        showContent(cached ? JSON.parse(cached) : null);
    }
}

/* ---------- Contact form (Create) ---------- */

(function () {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const submitBtn = document.getElementById("submitBtn");
    const formStatus = document.getElementById("formStatus");
    const message = document.getElementById("message");
    const count = document.getElementById("count");

    if (message && count) {
        message.addEventListener("input", function () {
            count.textContent = message.value.length;
        });
    }

    function showStatus(text, type) {
        formStatus.textContent = text;
        formStatus.className = "form-status " + type;
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const msg = document.getElementById("message").value.trim();

        if (!name) return showStatus("Please enter your name.", "error");

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) return showStatus("Please enter a valid email.", "error");
        if (!msg) return showStatus("Please enter your message.", "error");

        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        try {
            const res = await fetch(`${API_BASE}/api/contact`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ name, email, message: msg }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                showStatus("✅ Message sent. We'll be in touch soon!", "success");
                message.value = "";
                if (count) count.textContent = "0";
                loadMessages();
            } else if (res.status === 401) {
                showStatus("Your session expired — please log in again.", "error");
                setTimeout(() => { window.location.href = "login.html?redirect=contact.html"; }, 1200);
            } else {
                showStatus(data.error || "Something went wrong. Please try again.", "error");
            }
        } catch (err) {
            showStatus("⚠️ Could not reach the server. Is the backend running?", "error");
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Message";
        }
    });
})();

/* ---------- Messages table (Read / Update / Delete) ---------- */

let cachedMessages = [];

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
            if (msg) openEditModal(msg);
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
            showGate();
            return;
        }

        const data = await res.json();

        if (res.ok && data.success) {
            cachedMessages = data.data;
            renderTable(data.data);
        } else {
            showAlert(data.error || "Could not load messages.", "error");
        }
    } catch (err) {
        showAlert("⚠️ Could not reach the server. Is the backend running?", "error");
        console.error(err);
        const loadingRow = document.getElementById("loadingRow");
        if (loadingRow) loadingRow.textContent = "Could not load messages.";
    }
}

/* ---------- Edit modal (Update) ---------- */

const overlay = document.getElementById("modalOverlay");
const editForm = document.getElementById("editForm");
const editId = document.getElementById("editId");
const eName = document.getElementById("eName");
const eEmail = document.getElementById("eEmail");
const eMessage = document.getElementById("eMessage");
const eStatus = document.getElementById("eStatus");
const editSubmitBtn = document.getElementById("editSubmitBtn");

function showModalAlert(text, type) {
    const box = document.getElementById("modalAlert");
    if (!box) return;
    box.textContent = text;
    box.className = "alert show " + type;
}

function openEditModal(msg) {
    document.getElementById("modalAlert").className = "alert";
    editId.value = msg._id;
    eName.value = msg.name;
    eEmail.value = msg.email;
    eMessage.value = msg.message;
    eStatus.value = msg.status;
    overlay.classList.add("open");
}

function closeModal() {
    overlay.classList.remove("open");
}

document.getElementById("modalClose")?.addEventListener("click", closeModal);
document.getElementById("modalCancel")?.addEventListener("click", closeModal);
overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
});

editForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = eName.value.trim();
    const email = eEmail.value.trim();
    const message = eMessage.value.trim();
    const status = eStatus.value;
    const id = editId.value;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name) return showModalAlert("Please enter a name.", "error");
    if (!emailPattern.test(email)) return showModalAlert("Please enter a valid email.", "error");
    if (!message) return showModalAlert("Please enter a message.", "error");

    editSubmitBtn.disabled = true;
    editSubmitBtn.textContent = "Saving...";

    try {
        const res = await fetch(`${API_BASE}/api/contact/${id}`, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ name, email, message, status }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
            closeModal();
            showAlert("Message updated.", "success");
            loadMessages();
        } else {
            showModalAlert(data.error || "Something went wrong.", "error");
        }
    } catch (err) {
        showModalAlert("⚠️ Could not reach the server.", "error");
        console.error(err);
    } finally {
        editSubmitBtn.disabled = false;
        editSubmitBtn.textContent = "Save Changes";
    }
});

document.getElementById("logoutBtn")?.addEventListener("click", logout);

checkAuth();
