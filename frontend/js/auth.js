/* ============================================================
   TechNova — authentication (login.html & register.html)
   Supports ?redirect=<page> so logging in from the Contact
   page's gate sends the visitor straight back there.
============================================================ */

const API_BASE = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
    ? "http://localhost:5000"
    : window.location.origin;

const params = new URLSearchParams(window.location.search);
const redirectTarget = params.get("redirect") || "contact.html";

// Keep the "Create one" / "Log in" switch links pointing at the same destination.
(function preserveRedirectOnSwitchLinks() {
    const q = params.get("redirect") ? `?redirect=${encodeURIComponent(params.get("redirect"))}` : "";
    const registerLink = document.getElementById("registerLink");
    const loginLink = document.getElementById("loginLink");
    if (registerLink) registerLink.href = "register.html" + q;
    if (loginLink) loginLink.href = "login.html" + q;
})();

function showAlert(text, type) {
    const box = document.getElementById("alertBox");
    if (!box) return;
    box.textContent = text;
    box.className = "alert show " + type;
}

// If a token is already stored, skip straight to the redirect target.
(function redirectIfLoggedIn() {
    if (localStorage.getItem("technova-token") &&
        (window.location.pathname.endsWith("login.html") || window.location.pathname.endsWith("register.html"))) {
        window.location.href = redirectTarget;
    }
})();

/* ---------- Login ---------- */

(function () {
    const form = document.getElementById("loginForm");
    if (!form) return;

    const loginBtn = document.getElementById("loginBtn");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showAlert("Please enter a valid email.", "error");
            return;
        }
        if (!password) {
            showAlert("Please enter your password.", "error");
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = "Logging in...";

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem("technova-token", data.token);
                localStorage.setItem("technova-user", JSON.stringify(data.user));
                showAlert("✅ Logged in — redirecting...", "success");
                window.location.href = redirectTarget;
            } else {
                showAlert(data.error || "Invalid email or password.", "error");
            }
        } catch (err) {
            showAlert("⚠️ Could not reach the server. Is the backend running?", "error");
            console.error(err);
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = "Log In";
        }
    });
})();

/* ---------- Register ---------- */

(function () {
    const form = document.getElementById("registerForm");
    if (!form) return;

    const registerBtn = document.getElementById("registerBtn");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!name) {
            showAlert("Please enter your name.", "error");
            return;
        }
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showAlert("Please enter a valid email.", "error");
            return;
        }
        if (password.length < 6) {
            showAlert("Password must be at least 6 characters.", "error");
            return;
        }

        registerBtn.disabled = true;
        registerBtn.innerHTML = "Creating account...";

        try {
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem("technova-token", data.token);
                localStorage.setItem("technova-user", JSON.stringify(data.user));
                showAlert("✅ Account created — redirecting...", "success");
                window.location.href = redirectTarget;
            } else {
                showAlert(data.error || "Could not create account.", "error");
            }
        } catch (err) {
            showAlert("⚠️ Could not reach the server. Is the backend running?", "error");
            console.error(err);
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = "Create Account";
        }
    });
})();
