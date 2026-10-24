// Nikhar Skincare - Admin Management Router & Single Page Application (/admin)
// Bulletproof, 80:15:5 UI, Hash Routes (#/overview, #/bookings, #/products), Glass Drawer, Security Rules

const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { connectDB, isDbConnected, Booking, Event, Product, Meta } = require("./db");
const { CLIENT } = require("./data");

const router = express.Router();

// Fallback seed products (identical to CONFIG.seedProducts with "100% organic")
const FALLBACK_SEED_PRODUCTS = [
  {
    name: "Nikhar Skincare Gold Advance Bridal Avocado Night Cream, 50gm, Skin Whitening Formula, Jar",
    slug: "nikhar-skincare-gold-advance-bridal-avocado-night-cream",
    sku: "NK-AVO-01",
    category: "skin",
    mrp: 650,
    salePrice: 650,
    stockStatus: "in_stock",
    stock: 25,
    images: [
      {
        url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
        alt: "Nikhar Skincare Gold Advance Bridal Avocado Night Cream",
        isPrimary: true
      }
    ],
    description: "The Nikhar Skincare Gold Advance Bridal Avocado Night Cream is a premium herbal formulation designed for intensive overnight skin repair and whitening. Enriched with high quality Avocado extracts this cream works while you sleep to provide deep nourishment and hydration to tired dull skin. It is specifically engineered for bridal skincare routines ensuring a fresh glowing and spotless appearance by morning. The formula is 100% organic paraben free and cruelty free making it suitable for all skin types including sensitive skin. Regular application helps in reducing dark spots and evening out skin tone with visible results typically observed within 7 days of consistent use. This 50gm jar is a staple for B2B beauty distributors looking for high performance herbal skincare solutions.",
    specs: [
      { key: "Brand", value: "Nikhar Skincare" },
      { key: "Weight", value: "50gm" },
      { key: "Type", value: "Night Cream" },
      { key: "Packaging Type", value: "Gold-toned Jar" },
      { key: "Formulation", value: "Cream" },
      { key: "Skin Type", value: "All Skin Types" },
      { key: "Color", value: "Gold" },
      { key: "Benefits", value: "Deep nourishment, Repairs dull skin, Supports healthy-looking skin, Moisturizes deeply" },
      { key: "Model", value: "Gold Advance Bridal Avocado" },
      { key: "Features", value: "Paraben Free, Cruelty Free, 100% Organic Ingredients, Herbal & Safe" },
      { key: "Flavor", value: "Avocado" },
      { key: "Application Time", value: "Night" },
      { key: "Primary Ingredient", value: "Avocado Extract" },
      { key: "Results Timeline", value: "Visible results in 7 days" }
    ],
    isVisible: true,
    isFeatured: true,
    badgeEn: "Bridal Signature",
    badgeHi: "ब्राइडल स्पेशल",
    metaTitle: "Gold Advance Bridal Avocado Night Cream • Nikhar Skincare",
    metaDescription: "100% organic bridal avocado night cream for overnight whitening, repair and spotless glow."
  },
  {
    name: "Skin Whitening Kesar Cream, 50gm",
    slug: "skin-whitening-kesar-cream",
    sku: "NK-KSR-02",
    category: "skin",
    mrp: 550,
    salePrice: 499,
    stockStatus: "in_stock",
    stock: 35,
    images: [
      {
        url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        alt: "Skin Whitening Kesar Cream",
        isPrimary: true
      }
    ],
    description: "Pure Kashmiri saffron infused daylight and evening herbal cream designed to restore natural glow, even out skin tone, and reduce pigmentation safely. 100% chemical-free and steroid-free.",
    specs: [
      { key: "Brand", value: "Nikhar Skincare" },
      { key: "Weight", value: "50gm" },
      { key: "Primary Ingredient", value: "Kashmiri Kesar (Saffron)" },
      { key: "Skin Type", value: "All Skin Types" }
    ],
    isVisible: true,
    isFeatured: true,
    badgeEn: "Customer Favorite",
    badgeHi: "पसंदीदा उत्पाद",
    metaTitle: "Skin Whitening Kesar Cream • Nikhar Skincare",
    metaDescription: "Pure Kashmiri saffron cream for natural glow and even tone without steroids."
  },
  {
    name: "Handcrafted Herbal Soaps Collection (Pack of 3)",
    slug: "handcrafted-herbal-soaps-collection",
    sku: "NK-SOP-03",
    category: "body",
    mrp: 350,
    salePrice: 299,
    stockStatus: "in_stock",
    stock: 40,
    images: [
      {
        url: "https://images.unsplash.com/photo-1607006314644-8d488bb25492?auto=format&fit=crop&w=800&q=80",
        alt: "Handcrafted Herbal Soaps",
        isPrimary: true
      }
    ],
    description: "Cold-processed artisanal handmade soaps in therapeutic aromas including saffron, sandalwood, and lavender. Nourishes skin and maintains moisture barrier.",
    specs: [
      { key: "Brand", value: "Nikhar Skincare" },
      { key: "Weight", value: "3 x 100gm" },
      { key: "Formulation", value: "Cold Process Bar" },
      { key: "Features", value: "Paraben & Sulfate Free, 100% Herbal" }
    ],
    isVisible: true,
    isFeatured: true,
    badgeEn: "Artisanal",
    badgeHi: "हस्तनिर्मित",
    metaTitle: "Handmade Herbal Soaps • Nikhar Skincare",
    metaDescription: "Artisanal cold-processed soaps made with pure botanical oils and extracts."
  }
];

function getSeedProducts() {
  try {
    const parent = require("./index");
    if (parent && parent.CONFIG && Array.isArray(parent.CONFIG.seedProducts)) {
      return parent.CONFIG.seedProducts;
    }
  } catch {
    // Return fallback if circular or uninitialized
  }
  return FALLBACK_SEED_PRODUCTS;
}

// Safe Admin Env Credentials
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

const SESSION_SECRET = (process.env.ADMIN_PASSWORD || "nikhar-default-insecure-secret-key-salt") + "-nikhar-salt-2026";
const COOKIE_NAME = "nikhar_admin_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

// Rate limiting for login
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
    entry.lockedUntil = now + 15 * 60 * 1000;
  }
  loginAttempts.set(ip, entry);
}

// Cookie parser
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

// Session HMAC
function createSessionToken(username) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${username}:${expiresAt}`;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}:${hmac}`;
}

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
  const hmacBuf = Buffer.from(receivedHmac);
  const expBuf = Buffer.from(expectedHmac);
  if (hmacBuf.length !== expBuf.length || !crypto.timingSafeEqual(hmacBuf, expBuf)) {
    return null;
  }
  return { username, expiresAt };
}

function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
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

// Security Middleware: Mutating Route Header Check
function requireMutatingSecurity(req, res, next) {
  const xReq = req.headers["x-requested-with"];
  if (!xReq || xReq.toLowerCase() !== "xmlhttprequest") {
    return res.status(403).json({ ok: false, error: "Forbidden: Missing X-Requested-With header" });
  }
  next();
}

// ObjectId validation middleware
function validateObjectId(req, res, next) {
  const id = req.params.id;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ ok: false, error: "Invalid ID parameter" });
  }
  next();
}

// Admin Security Headers
router.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

// --------------------------------------------------------------------------
// Auth Routes
// --------------------------------------------------------------------------

// GET /admin/login
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
  <title>Admin Sign In • ${CLIENT.brand}</title>
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
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
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({
              username: form.username.value,
              password: form.password.value
            })
          });
          const data = await res.json();
          if (data.ok) {
            window.location.href = '/admin#/overview';
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

// POST /admin/api/login
router.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";

  if (isIpThrottled(ip)) {
    return res.status(429).json({ ok: false, error: "Too many failed attempts. Please try again in 15 minutes." });
  }

  const creds = getAdminCredentials();
  if (!creds.isConfigured) {
    return res.status(503).json({ ok: false, error: "Admin credentials are not configured in environment variables." });
  }

  const isUserValid = safeCompare(username, creds.username);
  const isPassValid = safeCompare(password, creds.password);

  if (!isUserValid || !isPassValid) {
    recordLoginAttempt(ip, false);
    return res.status(401).json({ ok: false, error: "Invalid username or password" });
  }

  recordLoginAttempt(ip, true);
  const token = createSessionToken(creds.username);

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

// --------------------------------------------------------------------------
// Overview API
// --------------------------------------------------------------------------

// GET /admin/api/overview
router.get("/api/overview", requireAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db || !isDbConnected()) {
      return res.json({
        ok: true,
        db: "offline",
        bookings: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, today: 0, upcoming: 0 },
        products: { total: 0, visible: 0, hidden: 0, outOfStock: 0, limited: 0 }
      });
    }

    const todayDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    const [
      bTotal,
      bPending,
      bConfirmed,
      bCompleted,
      bCancelled,
      bToday,
      bUpcoming,
      pTotal,
      pVisible,
      pHidden,
      pOutOfStock,
      pLimited
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.countDocuments({ date: todayDateStr }),
      Booking.countDocuments({ date: { $gt: todayDateStr }, status: { $in: ["pending", "confirmed"] } }),
      Product.countDocuments(),
      Product.countDocuments({ isVisible: true }),
      Product.countDocuments({ isVisible: false }),
      Product.countDocuments({ stockStatus: "out_of_stock" }),
      Product.countDocuments({ stockStatus: "limited" })
    ]);

    return res.json({
      ok: true,
      db: "online",
      bookings: {
        total: bTotal,
        pending: bPending,
        confirmed: bConfirmed,
        completed: bCompleted,
        cancelled: bCancelled,
        today: bToday,
        upcoming: bUpcoming
      },
      products: {
        total: pTotal,
        visible: pVisible,
        hidden: pHidden,
        outOfStock: pOutOfStock,
        limited: pLimited
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Failed to load overview" });
  }
});

// Legacy /admin/api/stats for compatibility
router.get("/api/stats", requireAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db) {
      return res.json({
        ok: true,
        db: "offline",
        kpis: { total: 0, today: 0, pending: 0, confirmed: 0, completionRate: 0, totalClicks: 0 },
        charts: {}
      });
    }
    const todayDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const [total, today, pending, confirmed, completed] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ date: todayDateStr }),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "completed" })
    ]);
    return res.json({
      ok: true,
      db: "online",
      kpis: {
        total,
        today,
        pending,
        confirmed,
        completed,
        completionRate: `${total > 0 ? Math.round((completed / total) * 100) : 0}%`,
        totalClicks: 0
      }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// --------------------------------------------------------------------------
// Bookings APIs
// --------------------------------------------------------------------------

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
      query.$or = [{ ref: regex }, { fullName: regex }, { phone: regex }, { service: regex }];
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
router.patch("/api/bookings/:id", requireAdmin, requireMutatingSecurity, validateObjectId, async (req, res) => {
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
router.delete("/api/bookings/:id", requireAdmin, requireMutatingSecurity, validateObjectId, async (req, res) => {
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

// GET /admin/api/export (CSV)
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

// --------------------------------------------------------------------------
// Products APIs
// --------------------------------------------------------------------------

// Whitelisted product validator
function validateProductPayload(data, isUpdate = false, existingId = null) {
  const errors = {};
  const cleaned = {};

  // Name
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name || name.length < 2) {
    errors.name = "Product name must be at least 2 characters.";
  } else if (name.length > 300) {
    errors.name = "Product name cannot exceed 300 characters.";
  } else {
    cleaned.name = name;
  }

  // Slug
  let slug = typeof data.slug === "string" ? data.slug.trim().toLowerCase() : "";
  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = "Slug must contain only lowercase alphanumeric characters and hyphens.";
  } else {
    cleaned.slug = slug;
  }

  // SKU
  cleaned.sku = typeof data.sku === "string" ? data.sku.trim().slice(0, 100) : "";

  // Category
  const validCategories = ["skin", "body", "hair", "general"];
  const cat = typeof data.category === "string" ? data.category.trim().toLowerCase() : "skin";
  if (!validCategories.includes(cat)) {
    errors.category = "Category must be one of: Skin, Body, Hair, General.";
  } else {
    cleaned.category = cat;
  }

  // Pricing
  const mrp = parseFloat(data.mrp);
  if (isNaN(mrp) || mrp < 0) {
    errors.mrp = "MRP must be a valid positive number.";
  } else {
    cleaned.mrp = mrp;
  }

  const salePrice = parseFloat(data.salePrice);
  if (isNaN(salePrice) || salePrice < 0) {
    errors.salePrice = "Sale price must be a valid positive number.";
  } else {
    cleaned.salePrice = salePrice;
  }

  // Stock status & quantity
  const validStockStatuses = ["in_stock", "limited", "out_of_stock"];
  const stockStatus = typeof data.stockStatus === "string" ? data.stockStatus.trim() : "in_stock";
  cleaned.stockStatus = validStockStatuses.includes(stockStatus) ? stockStatus : "in_stock";

  const stock = parseInt(data.stock, 10);
  cleaned.stock = isNaN(stock) || stock < 0 ? 0 : stock;

  // Images (0 to 10)
  const rawImages = Array.isArray(data.images) ? data.images : [];
  if (rawImages.length > 10) {
    errors.images = "A maximum of 10 images are allowed.";
  } else {
    const cleanImages = [];
    for (let i = 0; i < rawImages.length; i++) {
      const img = rawImages[i];
      if (img && typeof img.url === "string") {
        const u = img.url.trim();
        if (!u.startsWith("http://") && !u.startsWith("https://")) {
          errors.images = "Image URLs must start with http:// or https://";
          break;
        }
        cleanImages.push({
          url: u,
          alt: typeof img.alt === "string" ? img.alt.trim().slice(0, 200) : "",
          isPrimary: Boolean(img.isPrimary)
        });
      }
    }
    // Ensure exactly one primary image if images exist
    if (cleanImages.length > 0 && !cleanImages.some((i) => i.isPrimary)) {
      cleanImages[0].isPrimary = true;
    }
    cleaned.images = cleanImages;
  }

  // Content
  cleaned.description = typeof data.description === "string" ? data.description.trim().slice(0, 10000) : "";
  cleaned.shortDescription = typeof data.shortDescription === "string" ? data.shortDescription.trim().slice(0, 1000) : "";

  // Specs
  const rawSpecs = Array.isArray(data.specs) ? data.specs : [];
  const cleanSpecs = [];
  for (let s of rawSpecs) {
    if (s && typeof s === "object") {
      const k = (s.key || "").toString().trim();
      const v = (s.value || "").toString().trim();
      if (k && v) {
        cleanSpecs.push({ key: k.slice(0, 100), value: v.slice(0, 500) });
      }
    }
  }
  cleaned.specs = cleanSpecs;

  // Visibility & Badges
  cleaned.isVisible = data.isVisible !== false && data.isVisible !== "false";
  cleaned.isFeatured = Boolean(data.isFeatured === true || data.isFeatured === "true");
  cleaned.badgeEn = typeof data.badgeEn === "string" ? data.badgeEn.trim().slice(0, 50) : "";
  cleaned.badgeHi = typeof data.badgeHi === "string" ? data.badgeHi.trim().slice(0, 50) : "";

  // SEO
  cleaned.metaTitle = typeof data.metaTitle === "string" ? data.metaTitle.trim().slice(0, 200) : "";
  cleaned.metaDescription = typeof data.metaDescription === "string" ? data.metaDescription.trim().slice(0, 500) : "";

  return { isValid: Object.keys(errors).length === 0, errors, cleaned };
}

// GET /admin/api/products
router.get("/api/products", requireAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db || !isDbConnected()) {
      return res.json({ ok: true, db: "offline", products: [] });
    }

    const { search, filter, category } = req.query;
    const query = {};

    // Filter chip
    if (filter === "visible") query.isVisible = true;
    if (filter === "hidden") query.isVisible = false;
    if (filter === "featured") query.isFeatured = true;
    if (filter === "out_of_stock") query.stockStatus = "out_of_stock";

    // Category
    if (category && ["skin", "body", "hair", "general"].includes(category)) {
      query.category = category;
    }

    // Search
    if (search && typeof search === "string" && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(sanitized, "i");
      query.$or = [{ name: regex }, { sku: regex }, { slug: regex }];
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, db: "online", products });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Failed to load products" });
  }
});

// GET /admin/api/products/:id
router.get("/api/products/:id", requireAdmin, validateObjectId, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db || !isDbConnected()) {
      return res.status(503).json({ ok: false, error: "Database offline" });
    }
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }
    return res.json({ ok: true, product });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /admin/api/products
router.post("/api/products", requireAdmin, requireMutatingSecurity, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db || !isDbConnected()) {
      return res.status(503).json({ ok: false, error: "Database offline" });
    }

    const { isValid, errors, cleaned } = validateProductPayload(req.body || {});
    if (!isValid) {
      return res.status(400).json({ ok: false, error: "Validation failed", errors });
    }

    // Check slug uniqueness
    const existingSlug = await Product.findOne({ slug: cleaned.slug });
    if (existingSlug) {
      return res.status(400).json({
        ok: false,
        error: "A product with this slug already exists. Please choose a different slug.",
        errors: { slug: "Slug already in use." }
      });
    }

    const product = await Product.create(cleaned);
    return res.json({ ok: true, product, message: "Product created successfully" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Failed to create product" });
  }
});

// PUT /admin/api/products/:id
router.put("/api/products/:id", requireAdmin, requireMutatingSecurity, validateObjectId, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db || !isDbConnected()) {
      return res.status(503).json({ ok: false, error: "Database offline" });
    }

    const { isValid, errors, cleaned } = validateProductPayload(req.body || {}, true, req.params.id);
    if (!isValid) {
      return res.status(400).json({ ok: false, error: "Validation failed", errors });
    }

    // Check slug uniqueness excluding self
    const existingSlug = await Product.findOne({ slug: cleaned.slug, _id: { $ne: req.params.id } });
    if (existingSlug) {
      return res.status(400).json({
        ok: false,
        error: "A product with this slug already exists.",
        errors: { slug: "Slug already in use." }
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: cleaned },
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }

    return res.json({ ok: true, product, message: "Product updated successfully" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Failed to update product" });
  }
});

// PATCH /admin/api/products/:id/toggle-visible
router.patch("/api/products/:id/toggle-visible", requireAdmin, requireMutatingSecurity, validateObjectId, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db || !isDbConnected()) {
      return res.status(503).json({ ok: false, error: "Database offline" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }

    product.isVisible = !product.isVisible;
    await product.save();

    return res.json({ ok: true, isVisible: product.isVisible });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Toggle failed" });
  }
});

// POST /admin/api/products/:id/duplicate
router.post("/api/products/:id/duplicate", requireAdmin, requireMutatingSecurity, validateObjectId, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db || !isDbConnected()) {
      return res.status(503).json({ ok: false, error: "Database offline" });
    }

    const orig = await Product.findById(req.params.id).lean();
    if (!orig) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }

    delete orig._id;
    delete orig.createdAt;
    delete orig.updatedAt;

    orig.name = `${orig.name} (Copy)`;
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    orig.slug = `${orig.slug}-copy-${randSuffix}`;
    if (orig.sku) orig.sku = `${orig.sku}-COPY`;
    orig.isVisible = false; // Duplicated product defaults to hidden for safety

    const copy = await Product.create(orig);
    return res.json({ ok: true, product: copy, message: "Product duplicated as draft" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Duplicate failed" });
  }
});

// DELETE /admin/api/products/:id
router.delete("/api/products/:id", requireAdmin, requireMutatingSecurity, validateObjectId, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db || !isDbConnected()) {
      return res.status(503).json({ ok: false, error: "Database offline" });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }
    return res.json({ ok: true, message: "Product deleted permanently" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Delete failed" });
  }
});

// POST /admin/api/products/load-samples
router.post("/api/products/load-samples", requireAdmin, requireMutatingSecurity, async (req, res) => {
  try {
    const db = await connectDB();
    if (!db || !isDbConnected()) {
      return res.status(503).json({ ok: false, error: "Database offline" });
    }

    const samples = getSeedProducts();
    let insertedCount = 0;

    for (const item of samples) {
      const exists = await Product.findOne({ slug: item.slug });
      if (!exists) {
        await Product.create(item);
        insertedCount++;
      }
    }

    return res.json({
      ok: true,
      inserted: insertedCount,
      message: `${insertedCount} sample product(s) loaded successfully.`
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Failed to load samples" });
  }
});

// --------------------------------------------------------------------------
// Admin Dashboard Main Page (Single Page App with Hash Routes)
// --------------------------------------------------------------------------

router.get("/", requireAdmin, (req, res) => {
  const dbStatus = isDbConnected() ? "online" : "offline";

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
  <style>
    /* Admin SPA & 80:15:5 Design System Enhancements */
    .admin-app {
      display: flex;
      min-height: 100vh;
      background: var(--bg-page);
    }
    .admin-topbar {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
      background: var(--glass-bg);
      border-bottom: 1px solid var(--border-soft);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 16px rgba(45,90,67,0.03);
    }
    .admin-brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .admin-sidebar {
      width: 240px;
      background: #FFFFFF;
      border-right: 1px solid var(--border-soft);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      padding: 24px 16px;
    }
    .sidebar-menu {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.92rem;
      transition: all var(--transition-fast);
    }
    .sidebar-link:hover {
      background: var(--bg-card-subtle);
      color: var(--primary-deep);
    }
    .sidebar-link.active {
      background: var(--accent-sage-bg);
      color: var(--primary-deep);
      font-weight: 600;
    }
    .sidebar-badge {
      margin-left: auto;
      font-size: 0.72rem;
      padding: 2px 7px;
      border-radius: var(--radius-full);
      background: rgba(45,90,67,0.1);
      color: var(--primary-deep);
    }
    .admin-body-area {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .admin-content-view {
      padding: 28px 32px 80px;
      flex-grow: 1;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }
    .admin-tab-pane {
      display: none;
    }
    .admin-tab-pane.active {
      display: block;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    /* Mobile bottom tab bar */
    .admin-mobile-tabs {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(12px);
      border-top: 1px solid var(--border-soft);
      z-index: 95;
      padding: 8px 16px;
      justify-content: space-around;
    }
    .mobile-tab-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: var(--text-muted);
      font-size: 0.72rem;
      font-weight: 500;
      text-decoration: none;
    }
    .mobile-tab-btn.active {
      color: var(--primary-deep);
      font-weight: 600;
    }
    /* Toolbar & Filter Chips */
    .products-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      background: #FFFFFF;
      padding: 16px 20px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-soft);
    }
    .toolbar-left {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      flex: 1;
      min-width: 280px;
    }
    .chip-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .filter-chip {
      padding: 6px 14px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-soft);
      background: var(--bg-card-subtle);
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .filter-chip:hover {
      border-color: var(--primary-deep);
      color: var(--primary-deep);
    }
    .filter-chip.active {
      background: var(--primary-deep);
      color: #FFFFFF;
      border-color: var(--primary-deep);
      box-shadow: 0 4px 10px rgba(45,90,67,0.2);
    }
    /* Product Table Specifics */
    .thumb-cell {
      width: 54px;
      height: 54px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: var(--bg-card-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-soft);
    }
    .thumb-cell img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .stock-pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: 0.74rem;
      font-weight: 600;
      text-transform: capitalize;
    }
    .stock-in_stock { background: #C6F6D5; color: #22543D; }
    .stock-limited { background: #FEEBC8; color: #7B341E; }
    .stock-out_of_stock { background: #FED7D7; color: #742A2A; }

    /* Switch Toggle */
    .clay-switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      vertical-align: middle;
    }
    .clay-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .clay-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #E2E8F0;
      transition: .2s cubic-bezier(0.16,1,0.3,1);
      border-radius: 24px;
    }
    .clay-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .2s cubic-bezier(0.16,1,0.3,1);
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }
    .clay-switch input:checked + .clay-slider {
      background-color: var(--primary-deep);
    }
    .clay-switch input:checked + .clay-slider:before {
      transform: translateX(20px);
    }

    /* Glass Drawer (Product Editor) */
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      z-index: 200;
      display: none;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .drawer-overlay.open {
      display: block;
      opacity: 1;
    }
    .glass-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 620px;
      max-width: 100vw;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      border-left: 1px solid var(--border-soft);
      box-shadow: -8px 0 32px rgba(45,90,67,0.12);
      z-index: 210;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .drawer-overlay.open .glass-drawer {
      transform: translateX(0);
    }
    .drawer-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--border-soft);
      background: rgba(255,255,255,0.85);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .drawer-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border-soft);
      background: rgba(255,255,255,0.85);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      bottom: 0;
      z-index: 10;
    }
    .drawer-section {
      background: #FFFFFF;
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
      padding: 20px;
    }
    .drawer-section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--primary-deep);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .inline-error {
      color: #E53E3E;
      font-size: 0.78rem;
      margin-top: 4px;
    }
    /* Image Tiles */
    .image-tiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }
    .image-tile {
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-md);
      padding: 8px;
      background: var(--bg-card-subtle);
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .image-tile.is-primary {
      border-color: var(--primary-deep);
      background: var(--accent-sage-bg);
    }
    .image-tile-thumb {
      width: 100%;
      height: 90px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      background: #EEE;
    }
    .image-tile-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    /* Specs Rows */
    .spec-row {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }
    /* Mobile cards */
    .mobile-cards-list {
      display: none;
      flex-direction: column;
      gap: 14px;
    }
    .item-card {
      background: #FFFFFF;
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    @media (max-width: 900px) {
      .admin-sidebar { display: none; }
      .admin-mobile-tabs { display: flex; }
      .admin-content-view { padding: 18px 16px 80px; }
      .admin-table-wrapper { display: none; }
      .mobile-cards-list { display: flex; }
      .glass-drawer { width: 100vw; }
    }
  </style>
</head>
<body class="admin-body">
  <div class="admin-app">
    <!-- Desktop Left Sidebar -->
    <aside class="admin-sidebar" aria-label="Admin Navigation">
      <div class="sidebar-brand mb-6 flex items-center gap-2">
        <div class="admin-logo-mark small">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D5A43" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
        </div>
        <div>
          <h2 class="serif-title text-base font-bold text-gray-800">${CLIENT.brand}</h2>
          <span class="text-xs text-muted">Admin Control</span>
        </div>
      </div>

      <nav class="sidebar-menu">
        <a href="#/overview" class="sidebar-link active" data-tab="overview">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Overview</span>
        </a>
        <a href="#/bookings" class="sidebar-link" data-tab="bookings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Bookings</span>
          <span class="sidebar-badge" id="badgePendingBookings">0</span>
        </a>
        <a href="#/products" class="sidebar-link" data-tab="products">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          <span>Products</span>
          <span class="sidebar-badge" id="badgeTotalProducts">0</span>
        </a>
      </nav>

      <div class="mt-auto pt-6 border-t border-gray-100 flex flex-col gap-2">
        <a href="/" target="_blank" class="sidebar-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          <span>View Site</span>
        </a>
        <button id="adminLogoutSidebar" class="sidebar-link text-danger w-full text-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="admin-body-area">
      <!-- Top Bar -->
      <header class="admin-topbar">
        <div class="admin-brand-group">
          <h2 class="serif-title text-lg font-bold text-gray-800">${CLIENT.brand}</h2>
          <div id="dbStatusBadge" class="db-status-pill ${dbStatus}">
            <span class="status-dot"></span>
            <span class="status-label">Database: ${dbStatus}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <a href="/" target="_blank" class="btn btn-sm btn-secondary flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            <span>View site</span>
          </a>
          <button id="adminLogoutTop" class="btn btn-sm btn-ghost text-muted hover:text-danger">Logout</button>
        </div>
      </header>

      <!-- Tab Content Views -->
      <main class="admin-content-view">
        <!-- Database Offline Warning Banner -->
        <div id="adminDbWarning" class="admin-banner-warning mb-6" style="display: ${dbStatus === "offline" ? "flex" : "none"};">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <div>
            <strong>Database is currently unreachable.</strong>
            <p>Admin is serving safe cached endpoints. Reconnect MongoDB to persist changes.</p>
          </div>
          <button id="retryDbBtn" class="btn btn-sm btn-outline ml-auto">Check Connection</button>
        </div>

        <!-- 1. PAGE: OVERVIEW -->
        <section id="paneOverview" class="admin-tab-pane active">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h1 class="admin-page-title">Executive Overview</h1>
              <p class="admin-page-subtitle">Real-time appointments, upcoming bookings & product catalog metrics</p>
            </div>
            <button id="refreshOverviewBtn" class="admin-btn-secondary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              <span>Refresh</span>
            </button>
          </div>

          <!-- Booking Counts Grid -->
          <div class="mb-8">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Booking Operations</h3>
            <div class="kpi-grid">
              <div class="kpi-card soft-card">
                <span class="kpi-label">Total Bookings</span>
                <h3 class="kpi-value" id="ovBookingTotal">0</h3>
              </div>
              <div class="kpi-card soft-card">
                <span class="kpi-label">Pending</span>
                <h3 class="kpi-value text-amber-600" id="ovBookingPending">0</h3>
              </div>
              <div class="kpi-card soft-card">
                <span class="kpi-label">Confirmed</span>
                <h3 class="kpi-value text-emerald-700" id="ovBookingConfirmed">0</h3>
              </div>
              <div class="kpi-card soft-card">
                <span class="kpi-label">Completed</span>
                <h3 class="kpi-value text-purple-700" id="ovBookingCompleted">0</h3>
              </div>
              <div class="kpi-card soft-card">
                <span class="kpi-label">Cancelled</span>
                <h3 class="kpi-value text-rose-600" id="ovBookingCancelled">0</h3>
              </div>
              <div class="kpi-card soft-card">
                <span class="kpi-label">Today</span>
                <h3 class="kpi-value text-yellow-600" id="ovBookingToday">0</h3>
              </div>
              <div class="kpi-card soft-card">
                <span class="kpi-label">Upcoming</span>
                <h3 class="kpi-value text-indigo-600" id="ovBookingUpcoming">0</h3>
              </div>
            </div>
          </div>

          <!-- Product Counts Grid -->
          <div class="mb-8">
            <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Product Catalog</h3>
            <div class="kpi-grid">
              <div class="kpi-card soft-card">
                <span class="kpi-label">Total Products</span>
                <h3 class="kpi-value" id="ovProductTotal">0</h3>
              </div>
              <div class="kpi-card soft-card">
                <span class="kpi-label">Visible Online</span>
                <h3 class="kpi-value text-emerald-700" id="ovProductVisible">0</h3>
              </div>
              <div class="kpi-card soft-card">
                <span class="kpi-label">Hidden / Drafts</span>
                <h3 class="kpi-value text-gray-500" id="ovProductHidden">0</h3>
              </div>
              <div class="kpi-card soft-card">
                <span class="kpi-label">Out of Stock</span>
                <h3 class="kpi-value text-rose-600" id="ovProductOutOfStock">0</h3>
              </div>
              <div class="kpi-card soft-card">
                <span class="kpi-label">Limited Stock</span>
                <h3 class="kpi-value text-amber-600" id="ovProductLimited">0</h3>
              </div>
            </div>
          </div>

          <!-- Quick Navigation Actions -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="soft-card p-6 flex justify-between items-center">
              <div>
                <h4 class="font-semibold text-gray-800">Manage Appointments</h4>
                <p class="text-xs text-muted mt-1">Review pending customer requests, confirm slots, or export CSV report.</p>
              </div>
              <a href="#/bookings" class="btn btn-secondary btn-sm">Go to Bookings</a>
            </div>
            <div class="soft-card p-6 flex justify-between items-center">
              <div>
                <h4 class="font-semibold text-gray-800">Product Inventory</h4>
                <p class="text-xs text-muted mt-1">Add herbal formulations, update prices & specs, or load samples.</p>
              </div>
              <a href="#/products" class="btn btn-primary clay-btn btn-sm">Go to Products</a>
            </div>
          </div>
        </section>

        <!-- 2. PAGE: BOOKINGS -->
        <section id="paneBookings" class="admin-tab-pane">
          <div class="admin-section-header">
            <div>
              <h1 class="admin-page-title">Bookings & Consultations</h1>
              <p class="admin-page-subtitle">Track customer appointments, update statuses, or export to CSV</p>
            </div>
            <div class="admin-table-actions">
              <a href="/admin/api/export" class="admin-btn-secondary" id="exportCsvBtn" download="nikhar-bookings.csv">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Export CSV</span>
              </a>
            </div>
          </div>

          <!-- Filter Bar -->
          <div class="table-filters-card soft-card">
            <div class="table-filter-group">
              <div class="search-input-wrap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="bookingSearchInput" placeholder="Search reference, customer name, phone...">
              </div>

              <div class="filter-select-wrap">
                <label for="filterBookingStatus">Status:</label>
                <select id="filterBookingStatus">
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div class="filter-select-wrap">
                <label for="filterBookingDate">Date:</label>
                <input type="date" id="filterBookingDate">
              </div>

              <button id="clearBookingFiltersBtn" class="btn btn-sm btn-ghost">Reset</button>
            </div>
          </div>

          <!-- Bookings Table (Desktop) -->
          <div class="admin-table-wrapper soft-card">
            <table class="admin-table" id="bookingsTable">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Service</th>
                  <th>Date & Slot</th>
                  <th>Status</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="bookingsTableBody">
                <tr><td colspan="7" class="text-center py-8 text-muted">Loading bookings...</td></tr>
              </tbody>
            </table>
          </div>

          <!-- Bookings Cards (Mobile) -->
          <div id="bookingsMobileList" class="mobile-cards-list"></div>

          <!-- Pagination -->
          <div class="table-pagination">
            <div class="pagination-info" id="bookingPaginationInfo">Showing 0 of 0</div>
            <div class="pagination-controls">
              <button id="bookingPrevBtn" class="btn btn-sm btn-secondary" disabled>Previous</button>
              <span id="bookingPageIndicator" class="page-indicator">Page 1</span>
              <button id="bookingNextBtn" class="btn btn-sm btn-secondary" disabled>Next</button>
            </div>
          </div>
        </section>

        <!-- 3. PAGE: PRODUCTS -->
        <section id="paneProducts" class="admin-tab-pane">
          <div class="admin-section-header">
            <div>
              <h1 class="admin-page-title">Products Catalogue</h1>
              <p class="admin-page-subtitle">Manage formulations, pricing, stock levels, specs, and online visibility</p>
            </div>
            <button id="addProductBtn" class="btn btn-primary clay-btn flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <span>Add product</span>
            </button>
          </div>

          <!-- Products Toolbar -->
          <div class="products-toolbar">
            <div class="toolbar-left">
              <div class="search-input-wrap" style="max-width: 260px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input type="text" id="productSearchInput" placeholder="Search by name, SKU...">
              </div>

              <!-- Filter Chips -->
              <div class="chip-group" id="productFilterChips">
                <button type="button" class="filter-chip active" data-filter="all">All</button>
                <button type="button" class="filter-chip" data-filter="visible">Visible</button>
                <button type="button" class="filter-chip" data-filter="hidden">Hidden</button>
                <button type="button" class="filter-chip" data-filter="featured">Featured</button>
                <button type="button" class="filter-chip" data-filter="out_of_stock">Out of stock</button>
              </div>

              <!-- Category Dropdown -->
              <div class="filter-select-wrap">
                <select id="productCategorySelect">
                  <option value="">All Categories</option>
                  <option value="skin">Skin Care</option>
                  <option value="body">Body Care</option>
                  <option value="hair">Hair Care</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Empty State (Hidden when products exist) -->
          <div id="productsEmptyState" class="soft-card p-12 text-center" style="display: none;">
            <div class="w-16 h-16 rounded-full bg-sage/10 text-primary-deep flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2D5A43" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            </div>
            <h3 class="serif-title text-xl font-bold text-gray-800 mb-2">No Products in Catalogue</h3>
            <p class="text-sm text-muted max-w-md mx-auto mb-6">Your store currently has no products listed. Add your first herbal product or preload standard sample products.</p>
            <div class="flex justify-center gap-3">
              <button id="emptyAddProductBtn" class="btn btn-secondary">Add your first product</button>
              <button id="emptyLoadSamplesBtn" class="btn btn-primary clay-btn">Load sample products</button>
            </div>
          </div>

          <!-- Products Table (Desktop) -->
          <div class="admin-table-wrapper soft-card" id="productsTableCard">
            <table class="admin-table" id="productsTable">
              <thead>
                <tr>
                  <th style="width: 70px;">Image</th>
                  <th>Product & SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Visible</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="productsTableBody">
                <tr><td colspan="7" class="text-center py-8 text-muted">Loading products...</td></tr>
              </tbody>
            </table>
          </div>

          <!-- Products Cards (Mobile) -->
          <div id="productsMobileList" class="mobile-cards-list"></div>
        </section>
      </main>

      <!-- Bottom Mobile Tabs -->
      <nav class="admin-mobile-tabs" aria-label="Mobile Navigation">
        <a href="#/overview" class="mobile-tab-btn active" data-tab="overview">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Overview</span>
        </a>
        <a href="#/bookings" class="mobile-tab-btn" data-tab="bookings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>Bookings</span>
        </a>
        <a href="#/products" class="mobile-tab-btn" data-tab="products">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          <span>Products</span>
        </a>
      </nav>
    </div>
  </div>

  <!-- PRODUCT EDITOR RIGHT-SIDE GLASS DRAWER -->
  <div id="productDrawerOverlay" class="drawer-overlay">
    <div class="glass-drawer" id="productDrawerBox">
      <!-- Sticky Header -->
      <div class="drawer-header">
        <div>
          <h2 class="serif-title text-lg font-bold text-gray-800" id="drawerTitle">Add New Product</h2>
          <span class="text-xs text-muted" id="drawerSubtitle">Configure product details, specs, and visibility</span>
        </div>
        <button type="button" id="closeDrawerBtn" class="action-btn-icon" aria-label="Close Drawer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <!-- Scrollable Form Body -->
      <form id="productForm" class="drawer-body" novalidate>
        <input type="hidden" id="editProductId" name="_id" value="">

        <!-- Section 1: Basics -->
        <div class="drawer-section">
          <h3 class="drawer-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            <span>Basics</span>
          </h3>

          <div class="form-group mb-3">
            <label for="pName">Product Name *</label>
            <input type="text" id="pName" name="name" required placeholder="e.g. Nikhar Skincare Gold Advance Bridal Avocado Night Cream, 50gm">
            <div class="inline-error" id="err_name"></div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div class="form-group">
              <label for="pSlug">URL Slug *</label>
              <input type="text" id="pSlug" name="slug" required placeholder="auto-generated-slug">
              <div class="inline-error" id="err_slug"></div>
            </div>
            <div class="form-group">
              <label for="pSku">SKU Code</label>
              <input type="text" id="pSku" name="sku" placeholder="e.g. NK-AVO-01">
              <div class="inline-error" id="err_sku"></div>
            </div>
          </div>

          <div class="form-group">
            <label for="pCategory">Category *</label>
            <select id="pCategory" name="category" required>
              <option value="skin">Skin Care</option>
              <option value="body">Body Care</option>
              <option value="hair">Hair Care</option>
              <option value="general">General</option>
            </select>
            <div class="inline-error" id="err_category"></div>
          </div>
        </div>

        <!-- Section 2: Pricing & Stock -->
        <div class="drawer-section">
          <h3 class="drawer-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            <span>Pricing & Stock</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div class="form-group">
              <label for="pMrp">MRP (₹) *</label>
              <input type="number" id="pMrp" name="mrp" min="0" step="1" required placeholder="650">
              <div class="inline-error" id="err_mrp"></div>
            </div>
            <div class="form-group">
              <label for="pSalePrice">Sale Price (₹) *</label>
              <input type="number" id="pSalePrice" name="salePrice" min="0" step="1" required placeholder="599">
              <div class="inline-error" id="err_salePrice"></div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="form-group">
              <label for="pStockStatus">Stock Status</label>
              <select id="pStockStatus" name="stockStatus">
                <option value="in_stock">In Stock</option>
                <option value="limited">Limited Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            <div class="form-group">
              <label for="pStock">Units in Stock</label>
              <input type="number" id="pStock" name="stock" min="0" step="1" placeholder="25">
            </div>
          </div>
        </div>

        <!-- Section 3: Images -->
        <div class="drawer-section">
          <h3 class="drawer-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <span>Images (1 to 10)</span>
          </h3>

          <div class="flex gap-2">
            <input type="url" id="newImageUrl" placeholder="Paste direct image link (https://...)" class="flex-1">
            <button type="button" id="addImageUrlBtn" class="btn btn-secondary btn-sm">Add Image</button>
          </div>
          <small class="text-xs text-muted block mt-1">Hint: Paste a direct image link, e.g. https://i.ibb.co/xxxx/photo.jpg. No uploads.</small>
          <div class="inline-error" id="err_images"></div>

          <!-- Image Tiles Grid -->
          <div id="imageTilesContainer" class="image-tiles-grid"></div>
        </div>

        <!-- Section 4: Content -->
        <div class="drawer-section">
          <h3 class="drawer-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span>Content & Description</span>
          </h3>

          <div class="form-group mb-3">
            <label for="pDescription">Detailed Description</label>
            <textarea id="pDescription" name="description" rows="4" placeholder="Full herbal ingredients, usage instructions, benefit summary..."></textarea>
            <div class="inline-error" id="err_description"></div>
          </div>

          <div class="form-group">
            <label for="pShortDescription">Short Tagline / Teaser</label>
            <input type="text" id="pShortDescription" name="shortDescription" placeholder="Quick one-line summary for product card">
          </div>
        </div>

        <!-- Section 5: Specs -->
        <div class="drawer-section">
          <h3 class="drawer-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            <span>Product Specifications</span>
          </h3>

          <!-- Specs Rows List -->
          <div id="specsRowsContainer"></div>

          <button type="button" id="addSpecRowBtn" class="btn btn-ghost btn-sm mt-2 text-primary-deep flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Add Specification</span>
          </button>

          <!-- Paste Specs Quick Box -->
          <div class="mt-4 pt-3 border-t border-gray-100">
            <label class="text-xs font-semibold text-gray-700 block mb-1">Quick Paste Specifications (Key: Value)</label>
            <textarea id="pasteSpecsArea" rows="3" class="w-full text-xs font-mono" placeholder="Brand: Nikhar Skincare&#10;Weight: 50gm&#10;Skin Type: All Skin Types&#10;Features: 100% Organic, Paraben Free"></textarea>
            <button type="button" id="parseSpecsBtn" class="btn btn-secondary btn-sm mt-1">Parse & Add</button>
          </div>
        </div>

        <!-- Section 6: Visibility & Badges -->
        <div class="drawer-section">
          <h3 class="drawer-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            <span>Visibility & Badges</span>
          </h3>

          <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <strong class="text-sm block">Visible on Website</strong>
              <small class="text-xs text-muted">Show this product on the public catalogue</small>
            </div>
            <label class="clay-switch">
              <input type="checkbox" id="pIsVisible" name="isVisible" checked>
              <span class="clay-slider"></span>
            </label>
          </div>

          <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <strong class="text-sm block">Featured Product</strong>
              <small class="text-xs text-muted">Highlight in signature formulations section</small>
            </div>
            <label class="clay-switch">
              <input type="checkbox" id="pIsFeatured" name="isFeatured">
              <span class="clay-slider"></span>
            </label>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div class="form-group">
              <label for="pBadgeEn">Badge (English)</label>
              <input type="text" id="pBadgeEn" name="badgeEn" placeholder="e.g. Bridal Signature">
            </div>
            <div class="form-group">
              <label for="pBadgeHi">Badge (Hindi)</label>
              <input type="text" id="pBadgeHi" name="badgeHi" placeholder="e.g. ब्राइडल स्पेशल">
            </div>
          </div>
        </div>

        <!-- Section 7: SEO -->
        <div class="drawer-section">
          <h3 class="drawer-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>Search Engine Optimization (SEO)</span>
          </h3>

          <div class="form-group mb-3">
            <label for="pMetaTitle">Meta Title</label>
            <input type="text" id="pMetaTitle" name="metaTitle" placeholder="Product Title • Nikhar Skincare">
          </div>
          <div class="form-group">
            <label for="pMetaDesc">Meta Description</label>
            <textarea id="pMetaDesc" name="metaDescription" rows="2" placeholder="Brief description for search engines and social cards..."></textarea>
          </div>
        </div>
      </form>

      <!-- Sticky Footer -->
      <div class="drawer-footer">
        <button type="button" id="drawerDeleteBtn" class="btn btn-danger btn-sm" style="display: none;">Delete Product</button>
        <div class="flex items-center gap-2 ml-auto">
          <button type="button" id="drawerCancelBtn" class="btn btn-secondary">Cancel</button>
          <button type="button" id="drawerSaveBtn" class="btn btn-primary clay-btn">
            <span class="btn-text">Save Product</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Glass Modal -->
  <div id="adminDeleteModal" class="admin-modal" style="display: none;">
    <div class="admin-modal-backdrop" id="deleteBackdrop"></div>
    <div class="admin-modal-box soft-card">
      <div class="modal-header">
        <h3 id="deleteModalTitle">Confirm Deletion</h3>
      </div>
      <div class="modal-body">
        <p id="deleteModalMessage">Are you sure you want to delete this item? This action cannot be reversed.</p>
      </div>
      <div class="modal-actions">
        <button id="cancelDeleteModalBtn" class="btn btn-secondary">Cancel</button>
        <button id="confirmDeleteModalBtn" class="btn btn-danger">Confirm Delete</button>
      </div>
    </div>
  </div>

  <!-- Toast Notification Container -->
  <div id="toastContainer" class="toast-container" aria-live="polite"></div>

  <!-- Admin Front-end Controller Script -->
  <script>
    (function() {
      "use strict";

      // Global State
      let state = {
        currentTab: "overview",
        bookings: [],
        bookingsTotal: 0,
        bookingPage: 1,
        products: [],
        productFilter: "all",
        productCategory: "",
        productSearch: "",
        deleteAction: null,
        drawerImages: [],
        drawerSpecs: [],
        isSlugManuallyEdited: false
      };

      // Toast Helper
      function showToast(msg, type = "success") {
        const c = document.getElementById("toastContainer");
        if (!c) return;
        const t = document.createElement("div");
        t.className = "toast " + (type === "error" ? "toast-error" : "");
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => {
          t.classList.add("fade-out");
          setTimeout(() => t.remove(), 300);
        }, 3500);
      }

      // Safe XHR Fetch Helper with Mutating Header
      async function apiFetch(url, options = {}) {
        options.headers = Object.assign({
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }, options.headers || {});
        return fetch(url, options);
      }

      // Hash Routing (#/overview, #/bookings, #/products)
      function initRouting() {
        function handleHash() {
          const hash = window.location.hash || "#/overview";
          let tab = "overview";
          if (hash.startsWith("#/bookings")) tab = "bookings";
          else if (hash.startsWith("#/products")) tab = "products";
          switchTab(tab);
        }
        window.addEventListener("hashchange", handleHash);
        handleHash();
      }

      function switchTab(tab) {
        state.currentTab = tab;
        document.querySelectorAll(".sidebar-link").forEach(l => {
          l.classList.toggle("active", l.getAttribute("data-tab") === tab);
        });
        document.querySelectorAll(".mobile-tab-btn").forEach(l => {
          l.classList.toggle("active", l.getAttribute("data-tab") === tab);
        });
        document.querySelectorAll(".admin-tab-pane").forEach(p => {
          p.classList.remove("active");
        });
        const activePane = document.getElementById("pane" + tab.charAt(0).toUpperCase() + tab.slice(1));
        if (activePane) activePane.classList.add("active");

        if (tab === "overview") loadOverview();
        if (tab === "bookings") loadBookings();
        if (tab === "products") loadProducts();
      }

      // Load Overview
      async function loadOverview() {
        try {
          const res = await apiFetch("/admin/api/overview");
          const data = await res.json();
          if (!data.ok) return;

          const b = data.bookings || {};
          const p = data.products || {};

          document.getElementById("ovBookingTotal").textContent = b.total || 0;
          document.getElementById("ovBookingPending").textContent = b.pending || 0;
          document.getElementById("ovBookingConfirmed").textContent = b.confirmed || 0;
          document.getElementById("ovBookingCompleted").textContent = b.completed || 0;
          document.getElementById("ovBookingCancelled").textContent = b.cancelled || 0;
          document.getElementById("ovBookingToday").textContent = b.today || 0;
          document.getElementById("ovBookingUpcoming").textContent = b.upcoming || 0;

          document.getElementById("ovProductTotal").textContent = p.total || 0;
          document.getElementById("ovProductVisible").textContent = p.visible || 0;
          document.getElementById("ovProductHidden").textContent = p.hidden || 0;
          document.getElementById("ovProductOutOfStock").textContent = p.outOfStock || 0;
          document.getElementById("ovProductLimited").textContent = p.limited || 0;

          const badgeB = document.getElementById("badgePendingBookings");
          if (badgeB) badgeB.textContent = b.pending || 0;
          const badgeP = document.getElementById("badgeTotalProducts");
          if (badgeP) badgeP.textContent = p.total || 0;
        } catch (err) {
          console.warn("Failed to load overview:", err);
        }
      }

      // Load Bookings
      async function loadBookings() {
        const tbody = document.getElementById("bookingsTableBody");
        const mList = document.getElementById("bookingsMobileList");
        const search = (document.getElementById("bookingSearchInput")?.value || "").trim();
        const status = (document.getElementById("filterBookingStatus")?.value || "").trim();
        const date = (document.getElementById("filterBookingDate")?.value || "").trim();

        const params = new URLSearchParams({
          page: state.bookingPage,
          limit: 15
        });
        if (search) params.append("search", search);
        if (status) params.append("status", status);
        if (date) params.append("date", date);

        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-muted">Loading bookings...</td></tr>';
        mList.innerHTML = '<div class="text-center py-6 text-muted">Loading bookings...</div>';

        try {
          const res = await apiFetch("/admin/api/bookings?" + params.toString());
          const data = await res.json();

          if (!data.ok || !data.bookings || data.bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-muted">No appointments found.</td></tr>';
            mList.innerHTML = '<div class="soft-card p-6 text-center text-muted">No appointments found.</div>';
            updateBookingPagination(0, 0, 1, 1);
            return;
          }

          state.bookings = data.bookings;
          state.bookingsTotal = data.total;

          // Render Desktop Table
          tbody.innerHTML = data.bookings.map(b => {
            const waLink = "https://wa.me/91" + b.phone + "?text=" + encodeURIComponent("Hello " + b.fullName + ", regarding your Nikhar Skincare appointment (" + b.ref + ") on " + b.date + " at " + b.slot + ": ");
            return \`
              <tr data-id="\${b._id}">
                <td><span class="ref-pill">\${escapeHtml(b.ref)}</span></td>
                <td>
                  <strong>\${escapeHtml(b.fullName)}</strong>
                  \${b.email ? '<br><small class="text-muted">' + escapeHtml(b.email) + '</small>' : ''}
                </td>
                <td>
                  <div class="table-row-actions">
                    <span>+91 \${escapeHtml(b.phone)}</span>
                    <a href="\${waLink}" target="_blank" rel="noopener noreferrer" class="action-btn-icon" title="Chat on WhatsApp">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </a>
                    <a href="tel:+91\${b.phone}" class="action-btn-icon" title="Call">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2D5A43" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </a>
                  </div>
                </td>
                <td><small>\${escapeHtml(b.service)}</small></td>
                <td>
                  <strong>\${escapeHtml(b.date)}</strong><br>
                  <small class="text-muted">\${escapeHtml(b.slot)}</small>
                </td>
                <td>
                  <select class="status-select-inline booking-status-sel" data-id="\${b._id}">
                    <option value="pending" \${b.status === "pending" ? "selected" : ""}>Pending</option>
                    <option value="confirmed" \${b.status === "confirmed" ? "selected" : ""}>Confirmed</option>
                    <option value="completed" \${b.status === "completed" ? "selected" : ""}>Completed</option>
                    <option value="cancelled" \${b.status === "cancelled" ? "selected" : ""}>Cancelled</option>
                  </select>
                </td>
                <td class="text-right">
                  <button class="action-btn-icon delete btn-delete-booking" data-id="\${b._id}" data-ref="\${escapeHtml(b.ref)}" title="Delete Booking">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </td>
              </tr>
            \`;
          }).join("");

          // Render Mobile Cards
          mList.innerHTML = data.bookings.map(b => {
            const waLink = "https://wa.me/91" + b.phone + "?text=" + encodeURIComponent("Hello " + b.fullName + ", regarding your Nikhar Skincare appointment (" + b.ref + "): ");
            return \`
              <div class="item-card" data-id="\${b._id}">
                <div class="flex justify-between items-center">
                  <span class="ref-pill">\${escapeHtml(b.ref)}</span>
                  <select class="status-select-inline booking-status-sel" data-id="\${b._id}">
                    <option value="pending" \${b.status === "pending" ? "selected" : ""}>Pending</option>
                    <option value="confirmed" \${b.status === "confirmed" ? "selected" : ""}>Confirmed</option>
                    <option value="completed" \${b.status === "completed" ? "selected" : ""}>Completed</option>
                    <option value="cancelled" \${b.status === "cancelled" ? "selected" : ""}>Cancelled</option>
                  </select>
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">\${escapeHtml(b.fullName)}</h4>
                  <p class="text-xs text-muted mt-1">\${escapeHtml(b.service)} • \${escapeHtml(b.date)} (\${escapeHtml(b.slot)})</p>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div class="flex gap-2">
                    <a href="\${waLink}" target="_blank" class="btn btn-sm btn-secondary flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                      <span>WhatsApp</span>
                    </a>
                    <a href="tel:+91\${b.phone}" class="btn btn-sm btn-ghost">Call</a>
                  </div>
                  <button class="action-btn-icon delete btn-delete-booking" data-id="\${b._id}" data-ref="\${escapeHtml(b.ref)}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            \`;
          }).join("");

          updateBookingPagination(data.bookings.length, data.total, data.page, data.totalPages);
          attachBookingListeners();
        } catch (err) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-danger">Failed to load bookings.</td></tr>';
        }
      }

      function attachBookingListeners() {
        document.querySelectorAll(".booking-status-sel").forEach(sel => {
          sel.addEventListener("change", async (e) => {
            const id = e.target.getAttribute("data-id");
            const newStatus = e.target.value;
            try {
              const res = await apiFetch("/admin/api/bookings/" + id, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus })
              });
              const data = await res.json();
              if (data.ok) {
                showToast("Booking updated");
                loadOverview();
              } else {
                showToast(data.error || "Update failed", "error");
                loadBookings();
              }
            } catch {
              showToast("Error updating booking", "error");
              loadBookings();
            }
          });
        });

        document.querySelectorAll(".btn-delete-booking").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const ref = btn.getAttribute("data-ref");
            confirmDeleteModal("Delete Appointment", "Are you sure you want to delete appointment " + ref + "?", async () => {
              try {
                const res = await apiFetch("/admin/api/bookings/" + id, { method: "DELETE" });
                const data = await res.json();
                if (data.ok) {
                  showToast("Appointment deleted");
                  loadOverview();
                  loadBookings();
                } else {
                  showToast(data.error || "Delete failed", "error");
                }
              } catch {
                showToast("Error deleting booking", "error");
              }
            });
          });
        });
      }

      function updateBookingPagination(currentCount, total, page, totalPages) {
        document.getElementById("bookingPaginationInfo").textContent = \`Showing \${currentCount} of \${total} appointments\`;
        document.getElementById("bookingPageIndicator").textContent = \`Page \${page} of \${totalPages}\`;
        document.getElementById("bookingPrevBtn").disabled = page <= 1;
        document.getElementById("bookingNextBtn").disabled = page >= totalPages;
      }

      // Load Products
      async function loadProducts() {
        const tbody = document.getElementById("productsTableBody");
        const mList = document.getElementById("productsMobileList");
        const emptyState = document.getElementById("productsEmptyState");
        const tableCard = document.getElementById("productsTableCard");

        const params = new URLSearchParams();
        if (state.productFilter && state.productFilter !== "all") params.append("filter", state.productFilter);
        if (state.productCategory) params.append("category", state.productCategory);
        if (state.productSearch) params.append("search", state.productSearch);

        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-muted">Loading products...</td></tr>';
        mList.innerHTML = '<div class="text-center py-6 text-muted">Loading products...</div>';

        try {
          const res = await apiFetch("/admin/api/products?" + params.toString());
          const data = await res.json();

          if (!data.ok || !data.products || data.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-muted">No products found.</td></tr>';
            mList.innerHTML = '<div class="soft-card p-6 text-center text-muted">No products found.</div>';
            if (emptyState && (!state.productSearch && state.productFilter === "all" && !state.productCategory)) {
              emptyState.style.display = "block";
              tableCard.style.display = "none";
              mList.style.display = "none";
            }
            return;
          }

          if (emptyState) emptyState.style.display = "none";
          tableCard.style.display = "block";
          mList.style.display = "";

          state.products = data.products;

          // Render Desktop Table
          tbody.innerHTML = data.products.map(p => {
            const primaryImg = (p.images && p.images.find(i => i.isPrimary)) || (p.images && p.images[0]);
            const imgUrl = primaryImg ? primaryImg.url : "";
            const priceHtml = p.mrp > p.salePrice
              ? \`<strong class="text-gray-900">₹\${p.salePrice}</strong> <span class="text-xs text-muted line-through">₹\${p.mrp}</span>\`
              : \`<strong class="text-gray-900">₹\${p.salePrice || p.mrp || 0}</strong>\`;

            const stockClass = p.stockStatus === "out_of_stock" ? "stock-out_of_stock" : p.stockStatus === "limited" ? "stock-limited" : "stock-in_stock";
            const stockLabel = p.stockStatus === "out_of_stock" ? "Out of Stock" : p.stockStatus === "limited" ? "Limited" : "In Stock";

            return \`
              <tr data-id="\${p._id}">
                <td>
                  <div class="thumb-cell">
                    \${imgUrl ? \`<img src="\${imgUrl}" alt="\${escapeHtml(p.name)}" onerror="this.src='';this.alt='No Image';">\` : '<span class="text-xs text-muted">No img</span>'}
                  </div>
                </td>
                <td>
                  <strong>\${escapeHtml(p.name)}</strong>
                  \${p.sku ? \`<br><small class="text-muted font-mono">SKU: \${escapeHtml(p.sku)}</small>\` : ''}
                </td>
                <td><span class="text-xs uppercase tracking-wider font-semibold text-gray-500">\${escapeHtml(p.category)}</span></td>
                <td>\${priceHtml}</td>
                <td><span class="stock-pill \${stockClass}">\${stockLabel}</span></td>
                <td>
                  <label class="clay-switch">
                    <input type="checkbox" class="product-toggle-vis" data-id="\${p._id}" \${p.isVisible ? "checked" : ""}>
                    <span class="clay-slider"></span>
                  </label>
                </td>
                <td class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button class="action-btn-icon btn-edit-product" data-id="\${p._id}" title="Edit Product">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="action-btn-icon btn-duplicate-product" data-id="\${p._id}" title="Duplicate Product">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <button class="action-btn-icon delete btn-delete-product" data-id="\${p._id}" data-name="\${escapeHtml(p.name)}" title="Delete Product">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            \`;
          }).join("");

          // Render Mobile Cards
          mList.innerHTML = data.products.map(p => {
            const primaryImg = (p.images && p.images.find(i => i.isPrimary)) || (p.images && p.images[0]);
            const imgUrl = primaryImg ? primaryImg.url : "";
            const priceHtml = p.mrp > p.salePrice
              ? \`<strong>₹\${p.salePrice}</strong> <span class="text-xs text-muted line-through">₹\${p.mrp}</span>\`
              : \`<strong>₹\${p.salePrice || p.mrp || 0}</strong>\`;

            return \`
              <div class="item-card" data-id="\${p._id}">
                <div class="flex gap-3">
                  <div class="thumb-cell" style="width: 64px; height: 64px;">
                    \${imgUrl ? \`<img src="\${imgUrl}" alt="\${escapeHtml(p.name)}">\` : '<span class="text-xs text-muted">No img</span>'}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-gray-800 text-sm truncate">\${escapeHtml(p.name)}</h4>
                    <span class="text-xs text-muted uppercase">\${escapeHtml(p.category)} CARE \${p.sku ? '• SKU: ' + escapeHtml(p.sku) : ''}</span>
                    <div class="mt-1">\${priceHtml}</div>
                  </div>
                </div>
                <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-muted">Visible:</span>
                    <label class="clay-switch">
                      <input type="checkbox" class="product-toggle-vis" data-id="\${p._id}" \${p.isVisible ? "checked" : ""}>
                      <span class="clay-slider"></span>
                    </label>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="btn btn-sm btn-secondary btn-edit-product" data-id="\${p._id}">Edit</button>
                    <button class="action-btn-icon btn-duplicate-product" data-id="\${p._id}" title="Duplicate">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                    <button class="action-btn-icon delete btn-delete-product" data-id="\${p._id}" data-name="\${escapeHtml(p.name)}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            \`;
          }).join("");

          attachProductListeners();
        } catch (err) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-danger">Failed to load products.</td></tr>';
        }
      }

      function attachProductListeners() {
        // Toggle Visible
        document.querySelectorAll(".product-toggle-vis").forEach(tg => {
          tg.addEventListener("change", async (e) => {
            const id = e.target.getAttribute("data-id");
            try {
              const res = await apiFetch("/admin/api/products/" + id + "/toggle-visible", { method: "PATCH" });
              const data = await res.json();
              if (data.ok) {
                showToast("Product visibility updated");
                loadOverview();
              } else {
                showToast(data.error || "Toggle failed", "error");
                e.target.checked = !e.target.checked;
              }
            } catch {
              showToast("Network error", "error");
              e.target.checked = !e.target.checked;
            }
          });
        });

        // Edit Button
        document.querySelectorAll(".btn-edit-product").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            openProductDrawer(id);
          });
        });

        // Duplicate Button
        document.querySelectorAll(".btn-duplicate-product").forEach(btn => {
          btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            try {
              const res = await apiFetch("/admin/api/products/" + id + "/duplicate", { method: "POST" });
              const data = await res.json();
              if (data.ok) {
                showToast("Product duplicated as draft");
                loadOverview();
                loadProducts();
              } else {
                showToast(data.error || "Duplicate failed", "error");
              }
            } catch {
              showToast("Network error while duplicating", "error");
            }
          });
        });

        // Delete Button
        document.querySelectorAll(".btn-delete-product").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const name = btn.getAttribute("data-name");
            confirmDeleteModal("Delete Product", "Are you sure you want to delete '" + name + "'? This action cannot be undone.", async () => {
              try {
                const res = await apiFetch("/admin/api/products/" + id, { method: "DELETE" });
                const data = await res.json();
                if (data.ok) {
                  showToast("Product deleted");
                  loadOverview();
                  loadProducts();
                } else {
                  showToast(data.error || "Delete failed", "error");
                }
              } catch {
                showToast("Network error while deleting", "error");
              }
            });
          });
        });
      }

      // ----------------------------------------------------------------------
      // Product Editor Drawer & Form State
      // ----------------------------------------------------------------------

      function openProductDrawer(productId = null) {
        clearFormErrors();
        const form = document.getElementById("productForm");
        form.reset();
        state.drawerImages = [];
        state.drawerSpecs = [];
        state.isSlugManuallyEdited = Boolean(productId);

        const titleEl = document.getElementById("drawerTitle");
        const deleteBtn = document.getElementById("drawerDeleteBtn");
        const editIdInput = document.getElementById("editProductId");

        if (productId) {
          titleEl.textContent = "Edit Product";
          deleteBtn.style.display = "block";
          editIdInput.value = productId;
          loadProductIntoDrawer(productId);
        } else {
          titleEl.textContent = "Add New Product";
          deleteBtn.style.display = "none";
          editIdInput.value = "";
          renderDrawerImages();
          renderDrawerSpecs();
        }

        const overlay = document.getElementById("productDrawerOverlay");
        overlay.classList.add("open");
      }

      function closeProductDrawer() {
        const overlay = document.getElementById("productDrawerOverlay");
        overlay.classList.remove("open");
      }

      async function loadProductIntoDrawer(id) {
        try {
          const res = await apiFetch("/admin/api/products/" + id);
          const data = await res.json();
          if (!data.ok || !data.product) {
            showToast("Failed to load product details", "error");
            closeProductDrawer();
            return;
          }

          const p = data.product;
          document.getElementById("pName").value = p.name || "";
          document.getElementById("pSlug").value = p.slug || "";
          document.getElementById("pSku").value = p.sku || "";
          document.getElementById("pCategory").value = p.category || "skin";
          document.getElementById("pMrp").value = p.mrp || 0;
          document.getElementById("pSalePrice").value = p.salePrice || 0;
          document.getElementById("pStockStatus").value = p.stockStatus || "in_stock";
          document.getElementById("pStock").value = p.stock || 0;
          document.getElementById("pDescription").value = p.description || "";
          document.getElementById("pShortDescription").value = p.shortDescription || "";
          document.getElementById("pIsVisible").checked = Boolean(p.isVisible);
          document.getElementById("pIsFeatured").checked = Boolean(p.isFeatured);
          document.getElementById("pBadgeEn").value = p.badgeEn || "";
          document.getElementById("pBadgeHi").value = p.badgeHi || "";
          document.getElementById("pMetaTitle").value = p.metaTitle || "";
          document.getElementById("pMetaDesc").value = p.metaDescription || "";

          state.drawerImages = Array.isArray(p.images) ? JSON.parse(JSON.stringify(p.images)) : [];
          state.drawerSpecs = Array.isArray(p.specs) ? JSON.parse(JSON.stringify(p.specs)) : [];

          renderDrawerImages();
          renderDrawerSpecs();
        } catch (err) {
          showToast("Network error loading product", "error");
        }
      }

      // Drawer Images Manager (1 to 10 images)
      function renderDrawerImages() {
        const container = document.getElementById("imageTilesContainer");
        if (!container) return;

        if (state.drawerImages.length === 0) {
          container.innerHTML = '<p class="text-xs text-muted col-span-full py-2">No images added yet.</p>';
          return;
        }

        container.innerHTML = state.drawerImages.map((img, idx) => {
          return \`
            <div class="image-tile \${img.isPrimary ? "is-primary" : ""}" data-idx="\${idx}">
              <img src="\${img.url}" alt="\${escapeHtml(img.alt)}" class="image-tile-thumb" onerror="this.src='';this.alt='Broken image';">
              <input type="text" value="\${escapeHtml(img.alt || "")}" placeholder="Alt text" class="text-xs p-1 border rounded img-alt-input" data-idx="\${idx}">
              <div class="image-tile-actions">
                <button type="button" class="btn-make-primary text-xs \${img.isPrimary ? "font-bold text-emerald-700" : "text-muted"}" data-idx="\${idx}">
                  \${img.isPrimary ? "Primary" : "Make primary"}
                </button>
                <div class="flex gap-1">
                  <button type="button" class="btn-img-up text-xs text-muted" data-idx="\${idx}" \${idx === 0 ? "disabled" : ""}>&uarr;</button>
                  <button type="button" class="btn-img-down text-xs text-muted" data-idx="\${idx}" \${idx === state.drawerImages.length - 1 ? "disabled" : ""}>&darr;</button>
                  <button type="button" class="btn-img-remove text-xs text-danger" data-idx="\${idx}">&times;</button>
                </div>
              </div>
            </div>
          \`;
        }).join("");

        // Attach image tile listeners
        container.querySelectorAll(".img-alt-input").forEach(inp => {
          inp.addEventListener("input", (e) => {
            const idx = parseInt(e.target.getAttribute("data-idx"), 10);
            if (state.drawerImages[idx]) state.drawerImages[idx].alt = e.target.value;
          });
        });

        container.querySelectorAll(".btn-make-primary").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            state.drawerImages.forEach((img, i) => img.isPrimary = (i === idx));
            renderDrawerImages();
          });
        });

        container.querySelectorAll(".btn-img-up").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            if (idx > 0) {
              const temp = state.drawerImages[idx];
              state.drawerImages[idx] = state.drawerImages[idx - 1];
              state.drawerImages[idx - 1] = temp;
              renderDrawerImages();
            }
          });
        });

        container.querySelectorAll(".btn-img-down").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            if (idx < state.drawerImages.length - 1) {
              const temp = state.drawerImages[idx];
              state.drawerImages[idx] = state.drawerImages[idx + 1];
              state.drawerImages[idx + 1] = temp;
              renderDrawerImages();
            }
          });
        });

        container.querySelectorAll(".btn-img-remove").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            state.drawerImages.splice(idx, 1);
            if (state.drawerImages.length > 0 && !state.drawerImages.some(i => i.isPrimary)) {
              state.drawerImages[0].isPrimary = true;
            }
            renderDrawerImages();
          });
        });
      }

      function addImageUrl() {
        const inp = document.getElementById("newImageUrl");
        const url = (inp.value || "").trim();
        if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
          alert("Please enter a valid http:// or https:// image link.");
          return;
        }
        if (state.drawerImages.length >= 10) {
          alert("Maximum 10 images allowed.");
          return;
        }
        const isPrimary = state.drawerImages.length === 0;
        state.drawerImages.push({ url, alt: "", isPrimary });
        inp.value = "";
        renderDrawerImages();
      }

      // Drawer Specs Manager
      function renderDrawerSpecs() {
        const container = document.getElementById("specsRowsContainer");
        if (!container) return;

        if (state.drawerSpecs.length === 0) {
          container.innerHTML = '<p class="text-xs text-muted py-1">No specifications added.</p>';
          return;
        }

        container.innerHTML = state.drawerSpecs.map((s, idx) => {
          return \`
            <div class="spec-row" data-idx="\${idx}">
              <input type="text" value="\${escapeHtml(s.key)}" placeholder="Key (e.g. Brand)" class="spec-key-inp text-xs p-1.5 border rounded w-1/3" data-idx="\${idx}">
              <input type="text" value="\${escapeHtml(s.value)}" placeholder="Value (e.g. Nikhar Skincare)" class="spec-val-inp text-xs p-1.5 border rounded flex-1" data-idx="\${idx}">
              <button type="button" class="btn-spec-up action-btn-icon" data-idx="\${idx}" \${idx === 0 ? "disabled" : ""}>&uarr;</button>
              <button type="button" class="btn-spec-down action-btn-icon" data-idx="\${idx}" \${idx === state.drawerSpecs.length - 1 ? "disabled" : ""}>&darr;</button>
              <button type="button" class="btn-spec-del action-btn-icon delete" data-idx="\${idx}">&times;</button>
            </div>
          \`;
        }).join("");

        container.querySelectorAll(".spec-key-inp").forEach(inp => {
          inp.addEventListener("input", (e) => {
            const idx = parseInt(e.target.getAttribute("data-idx"), 10);
            if (state.drawerSpecs[idx]) state.drawerSpecs[idx].key = e.target.value;
          });
        });

        container.querySelectorAll(".spec-val-inp").forEach(inp => {
          inp.addEventListener("input", (e) => {
            const idx = parseInt(e.target.getAttribute("data-idx"), 10);
            if (state.drawerSpecs[idx]) state.drawerSpecs[idx].value = e.target.value;
          });
        });

        container.querySelectorAll(".btn-spec-up").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            if (idx > 0) {
              const temp = state.drawerSpecs[idx];
              state.drawerSpecs[idx] = state.drawerSpecs[idx - 1];
              state.drawerSpecs[idx - 1] = temp;
              renderDrawerSpecs();
            }
          });
        });

        container.querySelectorAll(".btn-spec-down").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            if (idx < state.drawerSpecs.length - 1) {
              const temp = state.drawerSpecs[idx];
              state.drawerSpecs[idx] = state.drawerSpecs[idx + 1];
              state.drawerSpecs[idx + 1] = temp;
              renderDrawerSpecs();
            }
          });
        });

        container.querySelectorAll(".btn-spec-del").forEach(btn => {
          btn.addEventListener("click", () => {
            const idx = parseInt(btn.getAttribute("data-idx"), 10);
            state.drawerSpecs.splice(idx, 1);
            renderDrawerSpecs();
          });
        });
      }

      function parseSpecsText() {
        const area = document.getElementById("pasteSpecsArea");
        const text = (area.value || "").trim();
        if (!text) return;

        const lines = text.split(/\\r?\\n/);
        let added = 0;
        lines.forEach(line => {
          const colonIdx = line.indexOf(":");
          if (colonIdx > 0) {
            const key = line.slice(0, colonIdx).trim();
            const value = line.slice(colonIdx + 1).trim();
            if (key && value) {
              state.drawerSpecs.push({ key, value });
              added++;
            }
          }
        });
        area.value = "";
        renderDrawerSpecs();
        showToast("Parsed " + added + " specification(s)");
      }

      // Slug Auto-Generation
      function initSlugAutoFill() {
        const nameInput = document.getElementById("pName");
        const slugInput = document.getElementById("pSlug");

        nameInput.addEventListener("input", () => {
          if (!state.isSlugManuallyEdited) {
            slugInput.value = nameInput.value
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
          }
        });

        slugInput.addEventListener("input", () => {
          state.isSlugManuallyEdited = true;
        });
      }

      function clearFormErrors() {
        document.querySelectorAll(".inline-error").forEach(el => el.textContent = "");
      }

      function mapServerErrors(errors) {
        clearFormErrors();
        if (!errors || typeof errors !== "object") return;
        Object.keys(errors).forEach(field => {
          const errEl = document.getElementById("err_" + field);
          if (errEl) errEl.textContent = errors[field];
        });
      }

      // Save Product
      async function saveProductFromDrawer() {
        clearFormErrors();
        const form = document.getElementById("productForm");
        const saveBtn = document.getElementById("drawerSaveBtn");
        const btnText = saveBtn.querySelector(".btn-text");
        const originalText = btnText.textContent;

        const id = document.getElementById("editProductId").value;
        const payload = {
          name: form.name.value.trim(),
          slug: form.slug.value.trim(),
          sku: form.sku.value.trim(),
          category: form.category.value,
          mrp: parseFloat(form.mrp.value) || 0,
          salePrice: parseFloat(form.salePrice.value) || 0,
          stockStatus: form.stockStatus.value,
          stock: parseInt(form.stock.value, 10) || 0,
          images: state.drawerImages,
          description: form.description.value.trim(),
          shortDescription: form.shortDescription.value.trim(),
          specs: state.drawerSpecs.filter(s => s.key && s.value),
          isVisible: form.isVisible.checked,
          isFeatured: form.isFeatured.checked,
          badgeEn: form.badgeEn.value.trim(),
          badgeHi: form.badgeHi.value.trim(),
          metaTitle: form.metaTitle.value.trim(),
          metaDescription: form.metaDescription.value.trim()
        };

        saveBtn.disabled = true;
        btnText.textContent = "Saving...";

        try {
          const url = id ? "/admin/api/products/" + id : "/admin/api/products";
          const method = id ? "PUT" : "POST";
          const res = await apiFetch(url, {
            method,
            body: JSON.stringify(payload)
          });
          const data = await res.json();

          if (data.ok) {
            closeProductDrawer();
            showToast("Saved. The public site updates within about 30 seconds.");
            loadOverview();
            loadProducts();
          } else {
            if (data.errors) mapServerErrors(data.errors);
            showToast(data.error || "Save failed. Please check form fields.", "error");
          }
        } catch {
          showToast("Network error saving product", "error");
        } finally {
          saveBtn.disabled = false;
          btnText.textContent = originalText;
        }
      }

      // Modal Helper
      function confirmDeleteModal(title, msg, onConfirm) {
        const m = document.getElementById("adminDeleteModal");
        document.getElementById("deleteModalTitle").textContent = title;
        document.getElementById("deleteModalMessage").textContent = msg;
        state.deleteAction = onConfirm;
        m.style.display = "flex";
      }

      function closeDeleteModal() {
        const m = document.getElementById("adminDeleteModal");
        m.style.display = "none";
        state.deleteAction = null;
      }

      // HTML Escape
      function escapeHtml(str) {
        if (!str) return "";
        return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      // Initializer
      document.addEventListener("DOMContentLoaded", () => {
        initRouting();
        initSlugAutoFill();

        // Logout buttons
        const handleLogout = async () => {
          await apiFetch("/admin/api/logout", { method: "POST" });
          window.location.href = "/admin/login";
        };
        const topLogout = document.getElementById("adminLogoutTop");
        if (topLogout) topLogout.addEventListener("click", handleLogout);
        const sideLogout = document.getElementById("adminLogoutSidebar");
        if (sideLogout) sideLogout.addEventListener("click", handleLogout);

        // Overview refresh
        const refOv = document.getElementById("refreshOverviewBtn");
        if (refOv) refOv.addEventListener("click", loadOverview);

        // Retry DB button
        const retryDb = document.getElementById("retryDbBtn");
        if (retryDb) retryDb.addEventListener("click", () => {
          loadOverview();
          if (state.currentTab === "bookings") loadBookings();
          if (state.currentTab === "products") loadProducts();
        });

        // Booking filters
        let bDebounce;
        const bSearch = document.getElementById("bookingSearchInput");
        if (bSearch) bSearch.addEventListener("input", () => {
          clearTimeout(bDebounce);
          bDebounce = setTimeout(() => { state.bookingPage = 1; loadBookings(); }, 300);
        });

        const bStatus = document.getElementById("filterBookingStatus");
        if (bStatus) bStatus.addEventListener("change", () => { state.bookingPage = 1; loadBookings(); });

        const bDate = document.getElementById("filterBookingDate");
        if (bDate) bDate.addEventListener("change", () => { state.bookingPage = 1; loadBookings(); });

        const bReset = document.getElementById("clearBookingFiltersBtn");
        if (bReset) bReset.addEventListener("click", () => {
          if (bSearch) bSearch.value = "";
          if (bStatus) bStatus.value = "";
          if (bDate) bDate.value = "";
          state.bookingPage = 1;
          loadBookings();
        });

        const bPrev = document.getElementById("bookingPrevBtn");
        if (bPrev) bPrev.addEventListener("click", () => {
          if (state.bookingPage > 1) { state.bookingPage--; loadBookings(); }
        });

        const bNext = document.getElementById("bookingNextBtn");
        if (bNext) bNext.addEventListener("click", () => {
          state.bookingPage++;
          loadBookings();
        });

        // Product Filters
        let pDebounce;
        const pSearch = document.getElementById("productSearchInput");
        if (pSearch) pSearch.addEventListener("input", (e) => {
          clearTimeout(pDebounce);
          pDebounce = setTimeout(() => { state.productSearch = e.target.value.trim(); loadProducts(); }, 300);
        });

        document.querySelectorAll("#productFilterChips .filter-chip").forEach(chip => {
          chip.addEventListener("click", () => {
            document.querySelectorAll("#productFilterChips .filter-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            state.productFilter = chip.getAttribute("data-filter");
            loadProducts();
          });
        });

        const pCat = document.getElementById("productCategorySelect");
        if (pCat) pCat.addEventListener("change", (e) => {
          state.productCategory = e.target.value;
          loadProducts();
        });

        // Add Product buttons
        const addPBtn = document.getElementById("addProductBtn");
        if (addPBtn) addPBtn.addEventListener("click", () => openProductDrawer(null));
        const emptyAddP = document.getElementById("emptyAddProductBtn");
        if (emptyAddP) emptyAddP.addEventListener("click", () => openProductDrawer(null));

        // Load Samples button
        const loadSamplesBtn = document.getElementById("emptyLoadSamplesBtn");
        if (loadSamplesBtn) {
          loadSamplesBtn.addEventListener("click", async () => {
            loadSamplesBtn.disabled = true;
            try {
              const res = await apiFetch("/admin/api/products/load-samples", { method: "POST" });
              const data = await res.json();
              if (data.ok) {
                showToast(data.message || "Samples loaded");
                loadOverview();
                loadProducts();
              } else {
                showToast(data.error || "Failed to load samples", "error");
              }
            } catch {
              showToast("Network error loading samples", "error");
            } finally {
              loadSamplesBtn.disabled = false;
            }
          });
        }

        // Drawer Controls
        const closeDrawer = document.getElementById("closeDrawerBtn");
        if (closeDrawer) closeDrawer.addEventListener("click", closeProductDrawer);
        const cancelDrawer = document.getElementById("drawerCancelBtn");
        if (cancelDrawer) cancelDrawer.addEventListener("click", closeProductDrawer);
        const overlay = document.getElementById("productDrawerOverlay");
        if (overlay) {
          overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeProductDrawer();
          });
        }

        const saveDrawerBtn = document.getElementById("drawerSaveBtn");
        if (saveDrawerBtn) saveDrawerBtn.addEventListener("click", saveProductFromDrawer);

        const drawerDelBtn = document.getElementById("drawerDeleteBtn");
        if (drawerDelBtn) {
          drawerDelBtn.addEventListener("click", () => {
            const id = document.getElementById("editProductId").value;
            const name = document.getElementById("pName").value;
            if (!id) return;
            confirmDeleteModal("Delete Product", "Are you sure you want to delete '" + name + "'?", async () => {
              try {
                const res = await apiFetch("/admin/api/products/" + id, { method: "DELETE" });
                const data = await res.json();
                if (data.ok) {
                  closeProductDrawer();
                  showToast("Product deleted");
                  loadOverview();
                  loadProducts();
                } else {
                  showToast(data.error || "Delete failed", "error");
                }
              } catch {
                showToast("Network error", "error");
              }
            });
          });
        }

        // Image add button
        const addImgBtn = document.getElementById("addImageUrlBtn");
        if (addImgBtn) addImgBtn.addEventListener("click", addImageUrl);

        // Spec add & parse buttons
        const addSpecBtn = document.getElementById("addSpecRowBtn");
        if (addSpecBtn) addSpecBtn.addEventListener("click", () => {
          state.drawerSpecs.push({ key: "", value: "" });
          renderDrawerSpecs();
        });

        const parseSpecsBtn = document.getElementById("parseSpecsBtn");
        if (parseSpecsBtn) parseSpecsBtn.addEventListener("click", parseSpecsText);

        // Modal confirm & cancel
        const confirmDel = document.getElementById("confirmDeleteModalBtn");
        if (confirmDel) {
          confirmDel.addEventListener("click", () => {
            if (typeof state.deleteAction === "function") {
              state.deleteAction();
            }
            closeDeleteModal();
          });
        }
        const cancelDel = document.getElementById("cancelDeleteModalBtn");
        if (cancelDel) cancelDel.addEventListener("click", closeDeleteModal);
        const delBackdrop = document.getElementById("deleteBackdrop");
        if (delBackdrop) delBackdrop.addEventListener("click", closeDeleteModal);
      });
    })();
  </script>
</body>
</html>`;
  res.send(html);
});

module.exports = router;
