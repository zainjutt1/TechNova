/* ============================================================
   TechNova — shared front-end behaviour
   Runs on index.html, about.html and contact.html.
   Every block checks that its elements exist before wiring up,
   so pages that don't include a given section stay unaffected.
============================================================ */

/* ---------- Dark / light mode (persisted) ---------- */

(function () {
    const darkBtn = document.getElementById("darkBtn");
    if (!darkBtn) return;

    const stored = localStorage.getItem("technova-theme");
    if (stored === "light") {
        document.body.classList.add("light-mode");
        darkBtn.innerHTML = "☀️";
    }

    darkBtn.addEventListener("click", function () {
        document.body.classList.toggle("light-mode");
        const isLight = document.body.classList.contains("light-mode");
        darkBtn.innerHTML = isLight ? "☀️" : "🌙";
        localStorage.setItem("technova-theme", isLight ? "light" : "dark");
    });
})();

/* ---------- Mobile nav toggle ---------- */

(function () {
    const navToggle = document.getElementById("navToggle");
    const navLinks = document.getElementById("navLinks");
    if (!navToggle || !navLinks) return;

    navToggle.addEventListener("click", function () {
        const isOpen = navLinks.classList.toggle("open");
        navToggle.classList.toggle("open", isOpen);
        navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            navLinks.classList.remove("open");
            navToggle.classList.remove("open");
            navToggle.setAttribute("aria-expanded", "false");
        });
    });
})();

/* ---------- Scrollspy for in-page sections (index only) ---------- */

(function () {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-links a");
    if (!sections.length || !navLinks.length) return;

    // Only run scrollspy on pages that actually have hash links to sections.
    const hasHashLinks = Array.from(navLinks).some(function (l) {
        return l.getAttribute("href") && l.getAttribute("href").includes("#");
    });
    if (!hasHashLinks) return;

    window.addEventListener("scroll", function () {
        let current = "";
        sections.forEach(function (section) {
            const sectionTop = section.offsetTop - 150;
            if (window.pageYOffset >= sectionTop) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(function (link) {
            const href = link.getAttribute("href") || "";
            if (!href.includes("#")) return;
            link.classList.remove("active");
            if (href.endsWith("#" + current)) {
                link.classList.add("active");
            }
        });
    });
})();

/* ---------- Contact form (contact.html only) ---------- */

(function () {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const submitBtn = document.getElementById("submitBtn");
    const formStatus = document.getElementById("formStatus");
    const message = document.getElementById("message");
    const count = document.getElementById("count");

    if (message && count) {
        message.addEventListener("input", function () {
            count.innerHTML = message.value.length;
        });
    }

    const API_BASE = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
        ? "http://localhost:5000"
        : window.location.origin;

    function showStatus(text, type) {
        formStatus.innerHTML = text;
        formStatus.className = "form-status " + type;
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const msg = document.getElementById("message").value.trim();

        if (name === "") {
            showStatus("Please enter your name.", "error");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showStatus("Please enter a valid email.", "error");
            return;
        }

        if (msg === "") {
            showStatus("Please enter your message.", "error");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = "Sending...";

        try {
            const res = await fetch(`${API_BASE}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message: msg }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showStatus("✅ Message sent. We'll be in touch soon!", "success");
                form.reset();
                if (count) count.innerHTML = "0";
            } else {
                showStatus(data.error || "Something went wrong. Please try again.", "error");
            }
        } catch (err) {
            showStatus("⚠️ Could not reach the server. Is the backend running?", "error");
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = "Send Message";
        }
    });
})();

/* ---------- FAQ accordion (contact.html only) ---------- */

(function () {
    const items = document.querySelectorAll(".faq-item");
    if (!items.length) return;

    items.forEach(function (item) {
        const question = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");
        if (!question || !answer) return;

        question.addEventListener("click", function () {
            const isOpen = item.classList.contains("open");

            items.forEach(function (other) {
                other.classList.remove("open");
                const otherAnswer = other.querySelector(".faq-answer");
                if (otherAnswer) otherAnswer.style.maxHeight = null;
            });

            if (!isOpen) {
                item.classList.add("open");
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });
})();

/* ---------- Reveal-on-scroll ---------- */

(function () {
    const targets = document.querySelectorAll(".reveal");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
        targets.forEach(function (t) { t.classList.add("in-view"); });
        return;
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    targets.forEach(function (t) { observer.observe(t); });
})();

/* ---------- Animated stat counters (about.html only) ---------- */

(function () {
    const stats = document.querySelectorAll(".stat-num[data-count]");
    if (!stats.length) return;

    if (!("IntersectionObserver" in window)) {
        stats.forEach(function (el) { el.textContent = el.dataset.count; });
        return;
    }

    function animateCount(el) {
        const target = parseInt(el.dataset.count, 10) || 0;
        const duration = 1200;
        const start = performance.now();

        function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            el.textContent = Math.floor(progress * target);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target;
            }
        }
        requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    stats.forEach(function (el) { observer.observe(el); });
})();

/* ---------- Back-to-top button (all pages) ---------- */

(function () {
    const topBtn = document.createElement("button");
    topBtn.innerHTML = "⬆";
    topBtn.id = "topBtn";
    topBtn.setAttribute("aria-label", "Back to top");
    document.body.appendChild(topBtn);

    window.addEventListener("scroll", function () {
        topBtn.style.display = window.scrollY > 300 ? "block" : "none";
    });

    topBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
})();

/* ---------- Typed code effect (index.html hero only) ---------- */

(function () {
    const typedCodeEl = document.getElementById("typedCode");
    if (!typedCodeEl) return;

    const codeSnippet =
`const site = {
  name: "TechNova",
  stack: ["HTML", "CSS", "JS", "Node"],
  status: "deployed"
};

connectDB(process.env.MONGODB_URI)
  .then(() => launch(site));`;

    let typeIndex = 0;

    function typeCode() {
        if (typeIndex <= codeSnippet.length) {
            typedCodeEl.textContent = codeSnippet.slice(0, typeIndex);
            typeIndex++;
            setTimeout(typeCode, 22);
        } else {
            setTimeout(function () {
                typeIndex = 0;
                typeCode();
            }, 2500);
        }
    }

    typeCode();
})();

console.log("TechNova front end loaded.");
