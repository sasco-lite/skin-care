// Nikhar Skincare - Admin Dashboard Router (/admin)
// Bulletproof auth, manual cookie parsing, constant-time compare, KPIs, Charts, Table & CSV

const express = require("express");
const crypto = require("crypto");
const { connectDB, isDbConnected, Booking, Event } = require("./db");
const { CLIENT, SERVICES, TIME_SLOTS } = require("./data");

const router = express.Router();

// Safe Env Getters
function getAdminCredentials() {
  const user = process.env.ADMIN_USERNAME
    ? process.env.ADMIN_USERNAME.trim().replace(/^['"]+|['"]+$/g, "")
    : "";
  const pass = process.env.ADMIN_PASSWORD
    ? process.env.ADMIN_PASSWORD.trim().replace(/^['"]+|['"]+$/g, "")
    : "";
  return {
    username: user,
    password: pass,
    isConfigured: Boolean(user && pass)
  };
}

// Session HMAC secret
const SESSION_SECRET = (process.env.ADMIN_PASSWORD || "nikhar-default-insecure-secret-key-salt") + "-nikhar-salt-2026";
const COOKIE_NAME = "nikhar_admin_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

// Simple In-Memory Login Rate Limiting (IP -> { count, lockedUntil })
const loginAttempts = new Map();

function isIpThrottled(ip) {
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return true;
  }
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    loginAttempts.delete(ip);
    return false;
  }
  return false;
}

function recordLoginAttempt(ip, success) {
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, firstAttempt: now, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= 5) {
    entry.lockedUntil = now + 15 * 60 * 1000; // Lock for 15 minutes
  }
  loginAttempts.set(ip, entry);
}

// Manual Cookie Parser
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts.shift().trim();
    if (key) {
      list[key] = decodeURIComponent(parts.join("=").trim());
    }
  });
  return list;
}

// Sign Session
function createSessionToken(username) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${username}:${expiresAt}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}:${hmac}`;
}

// Verify Session
function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const [username, expiresAtStr, receivedHmac] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return null;
  }
  const payload = `${username}:${expiresAtStr}`;
  const expectedHmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  
  // Constant time comparison for HMAC
  const hmacBuf = Buffer.from(receivedHmac);
  const expBuf = Buffer.from(expectedHmac);
  if (hmacBuf.length !== expBuf.length || !crypto.timingSafeEqual(hmacBuf, expBuf)) {
    return null;
  }
  return { username, expiresAt };
}

// Timing safe string comparison
function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    // Perform dummy comparison to mitigate timing attacks
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// Auth Middleware
function requireAdmin(req, res, next) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  const session = verifySessionToken(token);
  if (!session) {
    if (req.path.startsWith("/api/")) {
      return res.status(401).json({ ok: false, error: "Unauthorized. Please log in." });
    }
    return res.redirect("/admin/login");
  }
  req.adminUser = session.username;
  next();
}

// Security headers middleware for all admin routes
router.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

// Admin Login Page
router.get("/login", (req, res) => {
  const cookies = parseCookies(req);
  const session = verifySessionToken(cookies[COOKIE_NAME]);
  if (session) {
    return res.redirect("/admin");
  }

  const { isConfigured } = getAdminCredentials();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Portal • ${CLIENT.brand}</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/public/style.css">
</head>
<body class="admin-body">
  <div class="admin-login-wrapper">
    <div class="admin-login-card soft-card">
      <div class="admin-login-header">
        <a href="/" class="admin-back-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Website
        </a>
        <div class="admin-logo-mark">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2D5A43" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
        </div>
        <h1 class="serif-title">${CLIENT.brand}</h1>
        <p class="admin-login-sub">Admin Management Dashboard</p>
      </div>

      ${
        !isConfigured
          ? `<div class="admin-unconfigured-notice">
              <div class="notice-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <div class="notice-text">
                <h3>Admin Not Configured</h3>
                <p>Environment variables <code>ADMIN_USERNAME</code> and <code>ADMIN_PASSWORD</code> are missing. Login is disabled until configured in your environment.</p>
              </div>
            </div>`
          : `<form id="adminLoginForm" class="admin-form" method="POST" action="/admin/api/login">
              <div id="loginError" class="admin-alert-error" style="display: none;"></div>
              
              <div class="form-group">
                <label for="adminUser">Admin Username</label>
                <div class="input-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <input type="text" id="adminUser" name="username" required autocomplete="username" placeholder="Enter username">
                </div>
              </div>

              <div class="form-group">
                <label for="adminPass">Password</label>
                <div class="input-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <input type="password" id="adminPass" name="password" required autocomplete="current-password" placeholder="Enter password">
                </div>
              </div>

              <button type="submit" id="loginBtn" class="btn btn-primary clay-btn w-full">
                <span class="btn-text">Sign In to Dashboard</span>
              </button>
            </form>`
      }

      <div class="admin-login-footer">
        <p>Nikhar Skincare by Hunaina Shethwala • Ahmedabad</p>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('adminLoginForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('loginError');
        const btn = document.getElementById('loginBtn');
        errEl.style.display = 'none';
        btn.disabled = true;
        btn.querySelector('.btn-text').textContent = 'Authenticating...';

        try {
          const res = await fetch('/admin/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: form.username.value,
              password: form.password.value
            })
          });
          const data = await res.json();
          if (data.ok) {
            window.location.href = '/admin';
          } else {
            errEl.textContent = data.error || 'Invalid credentials';
            errEl.style.display = 'block';
            btn.disabled = false;
            btn.querySelector('.btn-text').textContent = 'Sign In to Dashboard';
          }
        } catch {
          errEl.textContent = 'Connection error. Please try again.';
          errEl.style.display = 'block';
          btn.disabled = false;
          btn.querySelector('.btn-text').textContent = 'Sign In to Dashboard';
        }
      });
    }
  </script>
</body>
</html>`;
  res.send(html);
});

// Admin Dashboard Main Page
router.get("/", requireAdmin, (req, res) => {
  const dbStatus = isDbConnected() ? "online" : "offline";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard • ${CLIENT.brand}</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/public/style.css">
  <!-- Pinned Chart.js 4 from jsDelivr -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
</head>
<body class="admin-body">
  <div class="admin-layout">
    <!-- Admin Sidebar / Header -->
    <header class="admin-nav">
      <div class="admin-nav-container">
        <div class="admin-nav-brand">
          <div class="admin-logo-mark small">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5A43" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
          </div>
          <div>
            <h2 class="serif-title">${CLIENT.brand}</h2>
            <span class="admin-badge">Admin Dashboard</span>
          </div>
        </div>

        <div class="admin-nav-actions">
          <div id="dbStatusBadge" class="db-status-pill ${dbStatus}">
            <span class="status-dot"></span>
            <span class="status-label">Database: ${dbStatus}</span>
          </div>
          <a href="/" target="_blank" class="admin-btn-secondary" title="Preview Live Site">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            <span>Live Site</span>
          </a>
          <button id="adminLogoutBtn" class="admin-btn-logout" title="Log Out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>

    <main class="admin-main-content">
      <!-- Database Offline Warning Banner if needed -->
      <div id="adminDbWarning" class="admin-banner-warning" style="display: ${dbStatus === "offline" ? "flex" : "none"};">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <div>
          <strong>Database is currently unreachable.</strong>
          <p>Bookings are temporarily serving safe fallback routes. Data below will populate once MongoDB is connected.</p>
        </div>
        <button id="retryDbBtn" class="btn btn-sm btn-outline">Check Connection</button>
      </div>

      <!-- Overview KPI Cards -->
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <h1 class="admin-page-title">Operational Overview</h1>
            <p class="admin-page-subtitle">Real-time appointments, inquiries, and customer metrics</p>
          </div>
          <button id="refreshDataBtn" class="admin-btn-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            <span>Refresh</span>
          </button>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card soft-card">
            <div class="kpi-icon-bubble bg-sage">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D5A43" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Total Bookings</span>
              <h3 class="kpi-value" id="kpiTotal">0</h3>
            </div>
          </div>

          <div class="kpi-card soft-card">
            <div class="kpi-icon-bubble bg-gold">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8A6715" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Today's Appointments</span>
              <h3 class="kpi-value" id="kpiToday">0</h3>
            </div>
          </div>

          <div class="kpi-card soft-card">
            <div class="kpi-icon-bubble bg-peach">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C05621" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Pending Confirmation</span>
              <h3 class="kpi-value" id="kpiPending">0</h3>
            </div>
          </div>

          <div class="kpi-card soft-card">
            <div class="kpi-icon-bubble bg-rose">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#97266D" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Confirmed Slots</span>
              <h3 class="kpi-value" id="kpiConfirmed">0</h3>
            </div>
          </div>

          <div class="kpi-card soft-card">
            <div class="kpi-icon-bubble bg-lavender">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#553C9A" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Completion Rate</span>
              <h3 class="kpi-value" id="kpiCompletion">0%</h3>
            </div>
          </div>

          <div class="kpi-card soft-card">
            <div class="kpi-icon-bubble bg-hibiscus">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B83280" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Contact Inquiries</span>
              <h3 class="kpi-value" id="kpiClicks">0</h3>
            </div>
          </div>
        </div>
      </section>

      <!-- Charts Grid -->
      <section class="admin-section">
        <h2 class="admin-subheading">Analytics & Insights</h2>
        <div class="charts-grid">
          <!-- 30-Day Trend -->
          <div class="chart-card soft-card col-span-2">
            <div class="chart-header">
              <h3>Bookings Trend (Last 30 Days)</h3>
              <span class="chart-legend-badge">Daily Volume</span>
            </div>
            <div class="chart-container">
              <canvas id="chartTrend"></canvas>
            </div>
          </div>

          <!-- Status Distribution -->
          <div class="chart-card soft-card">
            <div class="chart-header">
              <h3>Status Split</h3>
            </div>
            <div class="chart-container donut-box">
              <canvas id="chartStatus"></canvas>
            </div>
          </div>

          <!-- Popular Services -->
          <div class="chart-card soft-card">
            <div class="chart-header">
              <h3>Bookings by Service</h3>
            </div>
            <div class="chart-container">
              <canvas id="chartServices"></canvas>
            </div>
          </div>

          <!-- Popular Time Slots -->
          <div class="chart-card soft-card">
            <div class="chart-header">
              <h3>Popular Time Slots</h3>
            </div>
            <div class="chart-container">
              <canvas id="chartSlots"></canvas>
            </div>
          </div>

          <!-- Language Preference -->
          <div class="chart-card soft-card">
            <div class="chart-header">
              <h3>Language Split (EN vs HI)</h3>
            </div>
            <div class="chart-container donut-box">
              <canvas id="chartLanguage"></canvas>
            </div>
          </div>

          <!-- Contact Clicks Breakdown -->
          <div class="chart-card soft-card">
            <div class="chart-header">
              <h3>Quick Inquiries by Action</h3>
            </div>
            <div class="chart-container">
              <canvas id="chartClicks"></canvas>
            </div>
          </div>
        </div>
      </section>

      <!-- Bookings Management Table -->
      <section class="admin-section">
        <div class="admin-section-header">
          <div>
            <h2 class="admin-subheading">All Appointments</h2>
            <p class="admin-page-subtitle">Manage customer bookings, update statuses, or export reports</p>
          </div>
          <div class="admin-table-actions">
            <a href="/admin/api/export" class="admin-btn-secondary" id="exportCsvBtn" download="nikhar-bookings.csv">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        <div class="table-filters-card soft-card">
          <div class="table-filter-group">
            <div class="search-input-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="tableSearch" placeholder="Search customer, phone, ref...">
            </div>

            <div class="filter-select-wrap">
              <label for="filterStatus">Status:</label>
              <select id="filterStatus">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div class="filter-select-wrap">
              <label for="filterDate">Date:</label>
              <input type="date" id="filterDate">
            </div>

            <button id="clearFiltersBtn" class="btn btn-sm btn-ghost">Reset Filters</button>
          </div>
        </div>

        <div class="admin-table-wrapper soft-card">
          <table class="admin-table" id="bookingsTable">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Service</th>
                <th>Date & Slot</th>
                <th>Lang</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="bookingsTableBody">
              <tr>
                <td colspan="8" class="text-center py-6 text-muted">Loading appointments...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Table Pagination -->
        <div class="table-pagination">
          <div class="pagination-info" id="paginationInfo">Showing 0 of 0</div>
          <div class="pagination-controls">
            <button id="prevPageBtn" class="btn btn-sm btn-secondary" disabled>Previous</button>
            <span id="currentPageIndicator" class="page-indicator">Page 1</span>
            <button id="nextPageBtn" class="btn btn-sm btn-secondary" disabled>Next</button>
          </div>
        </div>
      </section>
    </main>
  </div>

  <!-- Delete Confirmation Modal -->
  <div id="deleteModal" class="admin-modal" style="display: none;">
    <div class="admin-modal-backdrop"></div>
    <div class="admin-modal-box soft-card">
      <div class="modal-header">
        <h3>Delete Appointment</h3>
      </div>
      <div class="modal-body">
        <p>Are you sure you want to delete booking reference <strong id="deleteTargetRef"></strong>? This action cannot be reversed.</p>
      </div>
      <div class="modal-actions">
        <button id="cancelDeleteBtn" class="btn btn-secondary">Cancel</button>
        <button id="confirmDeleteBtn" class="btn btn-danger">Confirm Delete</button>
      </div>
    </div>
  </div>

  <script src="/public/dashboard.js"></script>
</body>
</html>`;
  res.send(html);
});

// POST /admin/api/login
router.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";

  if (isIpThrottled(ip)) {
    return res.status(429).json({
      ok: false,
      error: "Too many failed attempts. Please try again in 15 minutes."
    });
  }

  const creds = getAdminCredentials();
  if (!creds.isConfigured) {
    return res.status(503).json({
      ok: false,
      error: "Admin credentials are not configured in environment variables."
    });
  }

  const isUserValid = safeCompare(username, creds.username);
  const isPassValid = safeCompare(password, creds.password);

  if (!isUserValid || !isPassValid) {
    recordLoginAttempt(ip, false);
    return res.status(401).json({
      ok: false,
      error: "Invalid username or password"
    });
  }

  recordLoginAttempt(ip, true);
  const token = createSessionToken(creds.username);

  // Set secure, httpOnly session cookie
  const isSecure = process.env.NODE_ENV === "production" || req.secure;
  const cookieOptions = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${8 * 3600}`,
    isSecure ? "Secure" : ""
  ].filter(Boolean).join("; ");

  res.setHeader("Set-Cookie", cookieOptions);
  return res.json({ ok: true, message: "Logged in successfully" });
});

// POST /admin/api/logout
router.post("/api/logout", (req, res) => {
  const cookieOptions = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0"
  ].join("; ");

  res.setHeader("Set-Cookie", cookieOptions);
  return res.json({ ok: true });
});

// GET /admin/api/stats
router.get("/api/stats", requireAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db) {
      return res.json({
        ok: true,
        db: "offline",
        kpis: { total: 0, today: 0, pending: 0, confirmed: 0, completionRate: 0, totalClicks: 0 },
        charts: {
          trend: { labels: [], data: [] },
          status: { pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
          services: {},
          slots: {},
          language: { en: 0, hi: 0 },
          clicks: {}
        }
      });
    }

    const todayDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    // Parallel aggregate queries
    const [
      totalBookings,
      todayBookings,
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      totalClicks,
      clicksByType,
      bookingsList
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ date: todayDateStr }),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Event.countDocuments(),
      Event.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      Booking.find().select("date service slot lang status createdAt").lean()
    ]);

    const resolvedTotal = completedCount + cancelledCount;
    const completionRate = resolvedTotal > 0
      ? Math.round((completedCount / (totalBookings || 1)) * 100)
      : totalBookings > 0 ? Math.round((confirmedCount / totalBookings) * 100) : 0;

    // Last 30 days trend map
    const trendMap = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const str = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      trendMap[str] = 0;
    }

    const servicesMap = {};
    const slotsMap = {};
    const langMap = { en: 0, hi: 0 };

    bookingsList.forEach((b) => {
      if (b.date && Object.prototype.hasOwnProperty.call(trendMap, b.date)) {
        trendMap[b.date] = (trendMap[b.date] || 0) + 1;
      }
      if (b.service) {
        servicesMap[b.service] = (servicesMap[b.service] || 0) + 1;
      }
      if (b.slot) {
        slotsMap[b.slot] = (slotsMap[b.slot] || 0) + 1;
      }
      if (b.lang === "hi") {
        langMap.hi += 1;
      } else {
        langMap.en += 1;
      }
    });

    const clicksMap = {};
    clicksByType.forEach((c) => {
      clicksMap[c._id] = c.count;
    });

    return res.json({
      ok: true,
      db: "online",
      kpis: {
        total: totalBookings,
        today: todayBookings,
        pending: pendingCount,
        confirmed: confirmedCount,
        completed: completedCount,
        completionRate: `${completionRate}%`,
        totalClicks
      },
      charts: {
        trend: {
          labels: Object.keys(trendMap).map((d) => d.slice(5)), // MM-DD
          data: Object.values(trendMap)
        },
        status: {
          pending: pendingCount,
          confirmed: confirmedCount,
          completed: completedCount,
          cancelled: cancelledCount
        },
        services: servicesMap,
        slots: slotsMap,
        language: langMap,
        clicks: clicksMap
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Failed to load stats" });
  }
});

// GET /admin/api/bookings
router.get("/api/bookings", requireAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db) {
      return res.json({ ok: true, db: "offline", bookings: [], total: 0, page: 1, totalPages: 1 });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const status = (req.query.status || "").trim();
    const search = (req.query.search || "").trim();
    const date = (req.query.date || "").trim();

    const query = {};

    if (status && ["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      query.status = status;
    }

    if (date) {
      query.date = date;
    }

    if (search) {
      const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(sanitized, "i");
      query.$or = [
        { ref: regex },
        { fullName: regex },
        { phone: regex },
        { service: regex }
      ];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      ok: true,
      db: "online",
      bookings,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Failed to fetch bookings" });
  }
});

// PATCH /admin/api/bookings/:id
router.patch("/api/bookings/:id", requireAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db) {
      return res.status(503).json({ ok: false, error: "Database offline" });
    }

    const { status } = req.body || {};
    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid status value" });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ ok: false, error: "Booking not found" });
    }

    return res.json({ ok: true, booking });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Update failed" });
  }
});

// DELETE /admin/api/bookings/:id
router.delete("/api/bookings/:id", requireAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db) {
      return res.status(503).json({ ok: false, error: "Database offline" });
    }

    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ ok: false, error: "Booking not found" });
    }

    return res.json({ ok: true, message: "Booking deleted" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Delete failed" });
  }
});

// GET /admin/api/export (CSV export)
router.get("/api/export", requireAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db) {
      return res.status(503).send("Database offline. Cannot generate export.");
    }

    const bookings = await Booking.find().sort({ createdAt: -1 }).lean();

    const headers = ["Reference,Date,Time Slot,Customer Name,Phone,Email,Service,Language,Status,Notes,Created At"];
    const rows = bookings.map((b) => {
      const escape = (str) => `"${(str || "").toString().replace(/"/g, '""')}"`;
      return [
        escape(b.ref),
        escape(b.date),
        escape(b.slot),
        escape(b.fullName),
        escape(b.phone),
        escape(b.email),
        escape(b.service),
        escape(b.lang),
        escape(b.status),
        escape(b.notes),
        escape(b.createdAt ? new Date(b.createdAt).toISOString() : "")
      ].join(",");
    });

    const csvContent = "\uFEFF" + headers.concat(rows).join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="nikhar-skincare-bookings-${Date.now()}.csv"`);
    return res.send(csvContent);
  } catch (err) {
    return res.status(500).send("Export failed: " + err.message);
  }
});

module.exports = router;
