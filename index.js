// Nikhar Skincare - Main Express Server & Single-Page Application 
// Bulletproof, CommonJS, bilingual (EN/HI), online booking, and contact tracking

const express = require("express");
const path = require("path");
const crypto = require("crypto");
const adminRouter = require("./admin");
const { connectDB, isDbConnected, getDbStatus, Booking, Event } = require("./db");
const { CLIENT, PRODUCTS, SERVICES, TIME_SLOTS, SLOT_CAPACITY, TRUST_BADGES, TRANSLATIONS } = require("./data");

const app = express();

// Safe process-level uncaught exception & rejection logging without terminating
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// Middleware: Body parser with size limits
app.use(express.json({ limit: "150kb" }));
app.use(express.urlencoded({ extended: true, limit: "150kb" }));

// Safe handling of malformed JSON errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ ok: false, error: "Malformed JSON payload" });
  }
  next();
});

// Global security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Serve static assets from /public
app.use("/public", express.static(path.join(__dirname, "public"), { maxAge: "1d" }));

// Mount Admin Router
app.use("/admin", adminRouter);

// Async route wrapper to safely catch errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Date validation helper for Asia/Kolkata timezone
function getKolkataDateBounds() {
  const now = new Date();
  const minDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const maxDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const maxDateStr = maxDate.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return { minDateStr, maxDateStr };
}

// Generate unique booking reference NK-YYYYMMDD-XXXX
function generateBookingRef(dateStr) {
  const cleanDate = (dateStr || "").replace(/-/g, "");
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `NK-${cleanDate || "20261023"}-${randomPart}`;
}

// Sanitize phone number (Indian 10-digit mobile)
function sanitizeIndianPhone(raw) {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.replace(/[^\d]/g, "");
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91") && /^[6-9]\d{9}$/.test(cleaned.slice(2))) {
    return cleaned.slice(2);
  }
  return null;
}

// --------------------------------------------------------------------------
// Public APIs
// --------------------------------------------------------------------------

// GET /api/health - Never throws
app.get("/api/health", asyncHandler(async (req, res) => {
  try {
    const db = await connectDB();
    const isConn = Boolean(db && isDbConnected());
    const adminConfigured = Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
    return res.json({
      ok: true,
      db: isConn ? "online" : "offline",
      adminConfigured,
      timestamp: new Date().toISOString()
    });
  } catch {
    return res.json({
      ok: true,
      db: "offline",
      adminConfigured: false,
      timestamp: new Date().toISOString()
    });
  }
}));

// GET /api/slots?date=YYYY-MM-DD
app.get("/api/slots", asyncHandler(async (req, res) => {
  const { date } = req.query;
  const { minDateStr, maxDateStr } = getKolkataDateBounds();

  if (!date || typeof date !== "string" || date < minDateStr || date > maxDateStr) {
    return res.status(400).json({
      ok: false,
      error: "Invalid date. Please choose a date between today and 60 days ahead."
    });
  }

  const db = await connectDB();
  if (!db) {
    // If DB is offline, return all slots as available with offline indicator
    const fallbackSlots = TIME_SLOTS.map((slot) => ({
      slot,
      booked: 0,
      capacity: SLOT_CAPACITY,
      available: true
    }));
    return res.json({ ok: true, db: "offline", date, slots: fallbackSlots });
  }

  try {
    const bookedCounts = await Booking.aggregate([
      { $match: { date, status: { $in: ["pending", "confirmed"] } } },
      { $group: { _id: "$slot", count: { $sum: 1 } } }
    ]);

    const countsMap = {};
    bookedCounts.forEach((item) => {
      countsMap[item._id] = item.count;
    });

    const slots = TIME_SLOTS.map((slot) => {
      const booked = countsMap[slot] || 0;
      return {
        slot,
        booked,
        capacity: SLOT_CAPACITY,
        available: booked < SLOT_CAPACITY
      };
    });

    return res.json({ ok: true, db: "online", date, slots });
  } catch (err) {
    // Graceful fallback on query failure
    const fallbackSlots = TIME_SLOTS.map((slot) => ({
      slot,
      booked: 0,
      capacity: SLOT_CAPACITY,
      available: true
    }));
    return res.json({ ok: true, db: "offline", date, slots: fallbackSlots });
  }
}));

// POST /api/book
app.post("/api/book", asyncHandler(async (req, res) => {
  const body = req.body || {};

  // Honeypot check (anti-bot)
  if (body.website_hp && body.website_hp.trim().length > 0) {
    return res.status(400).json({ ok: false, error: "Validation failed" });
  }

  const fullName = (body.fullName || "").trim();
  const rawPhone = (body.phone || "").trim();
  const email = (body.email || "").trim();
  const service = (body.service || "").trim();
  const date = (body.date || "").trim();
  const slot = (body.slot || "").trim();
  const notes = (body.notes || "").trim();
  const lang = body.lang === "hi" ? "hi" : "en";

  // Client validation
  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    return res.status(400).json({ ok: false, field: "fullName", error: "Please enter a valid full name." });
  }

  const sanitizedPhone = sanitizeIndianPhone(rawPhone);
  if (!sanitizedPhone) {
    return res.status(400).json({ ok: false, field: "phone", error: "Please enter a valid 10-digit Indian phone number." });
  }

  const validService = SERVICES.find((s) =>
    s.id === service ||
    s.nameEn.toLowerCase() === service.toLowerCase() ||
    s.nameHi.trim() === service.trim()
  );
  if (!validService) {
    return res.status(400).json({ ok: false, field: "service", error: "Please select a valid service." });
  }

  const { minDateStr, maxDateStr } = getKolkataDateBounds();
  if (!date || date < minDateStr || date > maxDateStr) {
    return res.status(400).json({ ok: false, field: "date", error: "Date must be within the next 60 days." });
  }

  if (!TIME_SLOTS.includes(slot)) {
    return res.status(400).json({ ok: false, field: "slot", error: "Please choose a valid time slot." });
  }

  // Check Database connection
  const db = await connectDB();
  if (!db) {
    return res.status(503).json({
      ok: false,
      code: "DB_OFFLINE",
      message: "Database is temporarily unavailable. Please book directly via WhatsApp or phone call."
    });
  }

  // Capacity check
  const existingCount = await Booking.countDocuments({
    date,
    slot,
    status: { $in: ["pending", "confirmed"] }
  });

  if (existingCount >= SLOT_CAPACITY) {
    return res.status(409).json({
      ok: false,
      code: "SLOT_FULL",
      error: "This time slot is now fully booked. Please choose another slot."
    });
  }

  const ref = generateBookingRef(date);
  const ip = req.ip || req.headers["x-forwarded-for"] || "";

  const booking = await Booking.create({
    ref,
    fullName,
    phone: sanitizedPhone,
    email: email.slice(0, 120),
    service: validService.nameEn,
    date,
    slot,
    notes: notes.slice(0, 1000),
    lang,
    status: "pending",
    ip
  });

  return res.json({
    ok: true,
    ref: booking.ref,
    booking: {
      ref: booking.ref,
      fullName: booking.fullName,
      phone: booking.phone,
      service: booking.service,
      date: booking.date,
      slot: booking.slot,
      lang: booking.lang
    }
  });
}));

// POST /api/track - Silent, best-effort contact click tracking
app.post("/api/track", asyncHandler(async (req, res) => {
  const { event, meta, lang } = req.body || {};
  if (!event || typeof event !== "string") {
    return res.json({ ok: false });
  }

  // Fire and forget, never crash if DB offline
  const allowedEvents = ["call", "whatsapp", "directions", "instagram", "book_open", "other"];
  if (allowedEvents.includes(event)) {
    connectDB()
      .then((db) => {
        if (db) {
          return Event.create({
            type: event,
            meta: (meta || "").toString().slice(0, 500),
            ip: req.ip || req.headers["x-forwarded-for"] || "",
            lang: lang === "hi" ? "hi" : "en"
          });
        }
      })
      .catch(() => {});
  }

  return res.json({ ok: true });
}));

// --------------------------------------------------------------------------
// HTML Page Renderer for Single-Page Application
// --------------------------------------------------------------------------

function renderSvgIcon(name, size = 20, className = "") {
  switch (name) {
    case "leaf":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>`;
    case "shield-check":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>`;
    case "heart-pulse":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"></path></svg>`;
    case "sparkles":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path></svg>`;
    case "calendar":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
    case "clock":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
    case "phone":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
    case "whatsapp":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`;
    case "map-pin":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    case "instagram":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`;
    case "mail":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
    case "external-link":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
    case "check":
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    default:
      return `<svg width="${size}" height="${size}" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`;
  }
}

app.get("/", (req, res) => {
  const en = TRANSLATIONS.en;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "name": CLIENT.brand,
    "alternateName": CLIENT.brandHi,
    "founder": {
      "@type": "Person",
      "name": CLIENT.owner
    },
    "description": en.metaDesc,
    "telephone": "+919033442501",
    "email": CLIENT.email,
    "priceRange": "Ask for price",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Royal Park Society, near Raza E Mustufa Masjid, Juhapura",
      "addressLocality": "Ahmedabad",
      "addressRegion": "Gujarat",
      "postalCode": "380055",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": CLIENT.coordinates.lat,
      "longitude": CLIENT.coordinates.lng
    },
    "hasMap": CLIENT.mapsShortLink,
    "openingHours": "Mo-Su 10:00-19:00",
    "sameAs": [
      CLIENT.instagramUrl
    ]
  };

  const productCardsHtml = PRODUCTS.map((p) => {
    return `
      <article class="product-card soft-card" data-category="${p.category}" data-accent="${p.accent}">
        <div class="product-card-top">
          <span class="product-badge badge-${p.accent}" data-i18n-badge-en="${p.badgeEn}" data-i18n-badge-hi="${p.badgeHi}">
            ${p.badgeEn}
          </span>
          <span class="product-category-tag">${p.category.toUpperCase()} CARE</span>
        </div>
        <div class="product-card-art art-${p.accent}">
          <div class="art-blob"></div>
          <div class="art-icon">
            ${renderSvgIcon(p.category === "hair" ? "sparkles" : p.category === "body" ? "heart-pulse" : "leaf", 38)}
          </div>
        </div>
        <div class="product-card-body">
          <h3 class="product-name" data-i18n-name-en="${p.nameEn}" data-i18n-name-hi="${p.nameHi}">${p.nameEn}</h3>
          <p class="product-desc" data-i18n-desc-en="${p.descEn}" data-i18n-desc-hi="${p.descHi}">${p.descEn}</p>
        </div>
        <div class="product-card-footer">
          <div class="price-notice" data-i18n="cardAskPrice">${en.cardAskPrice}</div>
          <button class="btn btn-wa-enquire" data-product-id="${p.id}" data-product-name-en="${p.nameEn}" data-product-name-hi="${p.nameHi}">
            ${renderSvgIcon("whatsapp", 16)}
            <span class="btn-text" data-i18n="cardEnquireBtn">${en.cardEnquireBtn}</span>
          </button>
        </div>
      </article>
    `;
  }).join("");

  const trustBadgesHtml = TRUST_BADGES.map((b) => {
    return `
      <div class="trust-badge-card soft-card">
        <div class="badge-icon-bubble">
          ${renderSvgIcon(b.icon, 24)}
        </div>
        <div class="badge-content">
          <h4 data-i18n-title-en="${b.titleEn}" data-i18n-title-hi="${b.titleHi}">${b.titleEn}</h4>
          <p data-i18n-sub-en="${b.subtitleEn}" data-i18n-sub-hi="${b.subtitleHi}">${b.subtitleEn}</p>
        </div>
      </div>
    `;
  }).join("");

  const serviceOptionsHtml = SERVICES.map((s) => {
    return `<option value="${s.id}" data-name-en="${s.nameEn}" data-name-hi="${s.nameHi}">${s.nameEn}</option>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title data-i18n="metaTitle">${en.metaTitle}</title>
  <meta name="description" content="${en.metaDesc}" data-i18n-content="metaDesc">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${en.metaTitle}" data-i18n-content="metaTitle">
  <meta property="og:description" content="${en.metaDesc}" data-i18n-content="metaDesc">
  <meta property="og:site_name" content="${CLIENT.brand}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${en.metaTitle}" data-i18n-content="metaTitle">
  <meta name="twitter:description" content="${en.metaDesc}" data-i18n-content="metaDesc">

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
    ${JSON.stringify(jsonLd, null, 2)}
  </script>

  <!-- Typography: Playfair Display + Poppins + Noto Sans Devanagari -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <link rel="stylesheet" href="/public/style.css">
</head>
<body class="site-body">
  <!-- Preloader -->
  <div id="sitePreloader" class="site-preloader">
    <div class="preloader-spinner"></div>
    <div class="preloader-text">Nikhar Skincare</div>
  </div>

  <!-- Main Sticky Navigation -->
  <nav id="mainNav" class="main-nav glass-nav">
    <div class="nav-container">
      <a href="#hero" class="nav-brand">
        <div class="brand-symbol">
          ${renderSvgIcon("leaf", 22)}
        </div>
        <div class="brand-text">
          <span class="brand-title serif-title" data-i18n="navBrand">${en.navBrand}</span>
          <span class="brand-sub">by Hunaina Shethwala</span>
        </div>
      </a>

      <!-- Desktop Nav Links -->
      <div class="nav-links">
        <a href="#about" class="nav-link" data-i18n="navAbout">${en.navAbout}</a>
        <a href="#products" class="nav-link" data-i18n="navProducts">${en.navProducts}</a>
        <a href="#why" class="nav-link" data-i18n="navWhy">${en.navWhy}</a>
        <a href="#location" class="nav-link" data-i18n="navLocation">${en.navLocation}</a>
        <a href="#contact" class="nav-link" data-i18n="navContact">${en.navContact}</a>
        <a href="/admin" class="nav-link nav-admin-link" data-i18n="navAdmin">${en.navAdmin}</a>
      </div>

      <!-- Actions & Language Switcher -->
      <div class="nav-actions">
        <!-- Language Switcher Pill -->
        <div class="lang-switch-pill glass-pill" role="radiogroup" aria-label="Language Selector">
          <button type="button" id="langBtnEn" class="lang-btn active" data-lang="en">EN</button>
          <span class="lang-divider">|</span>
          <button type="button" id="langBtnHi" class="lang-btn" data-lang="hi">हि</button>
        </div>

        <a href="#booking" class="btn btn-sm btn-primary clay-btn nav-cta-btn" data-i18n="navBooking">
          ${en.navBooking}
        </a>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <header id="hero" class="hero-section">
    <div class="hero-bg-blobs">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="hero-container">
      <div class="hero-content">
        <span class="hero-eyebrow glass-pill" data-i18n="heroEyebrow">
          ${renderSvgIcon("leaf", 16)}
          <span>${en.heroEyebrow}</span>
        </span>
        <h1 class="hero-title serif-title" data-i18n="heroHeading">
          ${en.heroHeading}
        </h1>
        <p class="hero-lead" data-i18n="heroLead">
          ${en.heroLead}
        </p>

        <div class="hero-actions">
          <a href="#booking" class="btn btn-lg btn-primary clay-btn hero-btn" data-track="book_open">
            ${renderSvgIcon("calendar", 20)}
            <span data-i18n="heroCtaBook">${en.heroCtaBook}</span>
          </a>
          <a href="${CLIENT.whatsappBase}?text=${encodeURIComponent(en.waPrefillGeneral)}" target="_blank" rel="noopener noreferrer" class="btn btn-lg btn-secondary hero-btn hero-btn-wa" data-track="whatsapp" id="heroWaBtn">
            ${renderSvgIcon("whatsapp", 20)}
            <span data-i18n="heroCtaWhatsapp">${en.heroCtaWhatsapp}</span>
          </a>
        </div>
      </div>

      <!-- Glassmorphic Hero Card with Stats -->
      <div class="hero-visual">
        <div class="hero-glass-card glass-card">
          <div class="glass-card-header">
            <div class="glass-avatar">
              <div class="avatar-monogram">HS</div>
            </div>
            <div>
              <h3 class="glass-title">Nikhar Handcrafted</h3>
              <p class="glass-sub" data-i18n="tagline">${CLIENT.tagline}</p>
            </div>
          </div>

          <div class="hero-stats-grid">
            <div class="hero-stat-box">
              <div class="stat-number" data-i18n="heroStat1Val">${en.heroStat1Val}</div>
              <div class="stat-text" data-i18n="heroStat1Lbl">${en.heroStat1Lbl}</div>
            </div>
            <div class="hero-stat-box">
              <div class="stat-number" data-i18n="heroStat2Val">${en.heroStat2Val}</div>
              <div class="stat-text" data-i18n="heroStat2Lbl">${en.heroStat2Lbl}</div>
            </div>
            <div class="hero-stat-box">
              <div class="stat-number" data-i18n="heroStat3Val">${en.heroStat3Val}</div>
              <div class="stat-text" data-i18n="heroStat3Lbl">${en.heroStat3Lbl}</div>
            </div>
          </div>

          <div class="glass-card-footer">
            <div class="pulse-indicator"></div>
            <span>Open today in Juhapura: 10:00 AM - 7:00 PM</span>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Trust Badges Section -->
  <section class="trust-section">
    <div class="site-container">
      <div class="trust-grid">
        ${trustBadgesHtml}
      </div>
    </div>
  </section>

  <!-- About Founder Section -->
  <section id="about" class="about-section">
    <div class="site-container">
      <div class="about-grid">
        <div class="about-visual soft-card">
          <div class="about-card-badge glass-pill">
            ${renderSvgIcon("shield-check", 16)}
            <span data-i18n="aboutBadge">${en.aboutBadge}</span>
          </div>
          <div class="about-illustration">
            <div class="botanical-circle">
              <div class="founder-seal">
                <span class="seal-script">Hunaina</span>
                <span class="seal-sub">Shethwala</span>
              </div>
            </div>
          </div>
          <div class="about-card-footer">
            <h4 data-i18n="aboutRole">${en.aboutRole}</h4>
            <p>Formulator of Herbal Skin & Hair Care</p>
          </div>
        </div>

        <div class="about-content">
          <span class="section-eyebrow" data-i18n="aboutEyebrow">${en.aboutEyebrow}</span>
          <h2 class="section-title serif-title" data-i18n="aboutHeading">${en.aboutHeading}</h2>
          <p class="about-p" data-i18n="aboutP1">${en.aboutP1}</p>
          <p class="about-p" data-i18n="aboutP2">${en.aboutP2}</p>

          <div class="about-highlights">
            <div class="about-item">
              <div class="item-check">${renderSvgIcon("check", 16)}</div>
              <div>
                <strong>Chemical-Free Philosophy</strong>
                <p>Zero parabens, artificial bleaching agents, or steroid additives.</p>
              </div>
            </div>
            <div class="about-item">
              <div class="item-check">${renderSvgIcon("check", 16)}</div>
              <div>
                <strong>Custom In-Person Consultations</strong>
                <p>Personalized attention for every individual skin and scalp type.</p>
              </div>
            </div>
          </div>

          <div class="about-actions">
            <a href="#booking" class="btn btn-primary clay-btn" data-i18n="heroCtaBook">${en.heroCtaBook}</a>
            <a href="${CLIENT.phoneTel}" class="btn btn-secondary" data-track="call">
              ${renderSvgIcon("phone", 18)}
              <span>+91 9033442501</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Products Section -->
  <section id="products" class="products-section">
    <div class="site-container">
      <div class="section-header text-center">
        <span class="section-eyebrow" data-i18n="productsEyebrow">${en.productsEyebrow}</span>
        <h2 class="section-title serif-title" data-i18n="productsHeading">${en.productsHeading}</h2>
        <p class="section-sub max-w-2xl mx-auto" data-i18n="productsSub">${en.productsSub}</p>
      </div>

      <!-- Category Filter Tabs -->
      <div class="product-tabs" role="tablist">
        <button class="tab-btn active" data-filter="all" data-i18n="filterAll">${en.filterAll}</button>
        <button class="tab-btn" data-filter="skin" data-i18n="filterSkin">${en.filterSkin}</button>
        <button class="tab-btn" data-filter="body" data-i18n="filterBody">${en.filterBody}</button>
        <button class="tab-btn" data-filter="hair" data-i18n="filterHair">${en.filterHair}</button>
      </div>

      <!-- Products Grid -->
      <div id="productsGrid" class="products-grid">
        ${productCardsHtml}
      </div>
    </div>
  </section>

  <!-- Why Nikhar Skincare Section -->
  <section id="why" class="why-section">
    <div class="site-container">
      <div class="section-header text-center">
        <span class="section-eyebrow" data-i18n="whyEyebrow">${en.whyEyebrow}</span>
        <h2 class="section-title serif-title" data-i18n="whyHeading">${en.whyHeading}</h2>
      </div>

      <div class="why-grid">
        <div class="why-card soft-card">
          <div class="why-icon-bubble bg-sage">
            ${renderSvgIcon("shield-check", 26)}
          </div>
          <h3 data-i18n="whyPoint1Title">${en.whyPoint1Title}</h3>
          <p data-i18n="whyPoint1Desc">${en.whyPoint1Desc}</p>
        </div>

        <div class="why-card soft-card">
          <div class="why-icon-bubble bg-gold">
            ${renderSvgIcon("sparkles", 26)}
          </div>
          <h3 data-i18n="whyPoint2Title">${en.whyPoint2Title}</h3>
          <p data-i18n="whyPoint2Desc">${en.whyPoint2Desc}</p>
        </div>

        <div class="why-card soft-card">
          <div class="why-icon-bubble bg-rose">
            ${renderSvgIcon("heart-pulse", 26)}
          </div>
          <h3 data-i18n="whyPoint3Title">${en.whyPoint3Title}</h3>
          <p data-i18n="whyPoint3Desc">${en.whyPoint3Desc}</p>
        </div>

        <div class="why-card soft-card">
          <div class="why-icon-bubble bg-peach">
            ${renderSvgIcon("map-pin", 26)}
          </div>
          <h3 data-i18n="whyPoint4Title">${en.whyPoint4Title}</h3>
          <p data-i18n="whyPoint4Desc">${en.whyPoint4Desc}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- How Booking Works Steps Section -->
  <section class="steps-section">
    <div class="site-container">
      <div class="section-header text-center">
        <span class="section-eyebrow" data-i18n="stepsEyebrow">${en.stepsEyebrow}</span>
        <h2 class="section-title serif-title" data-i18n="stepsHeading">${en.stepsHeading}</h2>
      </div>

      <div class="steps-grid">
        <div class="step-card soft-card">
          <div class="step-number">01</div>
          <h3 data-i18n="step1Title">${en.step1Title}</h3>
          <p data-i18n="step1Desc">${en.step1Desc}</p>
        </div>

        <div class="step-card soft-card">
          <div class="step-number">02</div>
          <h3 data-i18n="step2Title">${en.step2Title}</h3>
          <p data-i18n="step2Desc">${en.step2Desc}</p>
        </div>

        <div class="step-card soft-card">
          <div class="step-number">03</div>
          <h3 data-i18n="step3Title">${en.step3Title}</h3>
          <p data-i18n="step3Desc">${en.step3Desc}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Online Booking Section -->
  <section id="booking" class="booking-section">
    <div class="site-container">
      <div class="booking-wrapper soft-card">
        <div class="booking-header text-center">
          <span class="section-eyebrow" data-i18n="bookingEyebrow">${en.bookingEyebrow}</span>
          <h2 class="section-title serif-title" data-i18n="bookingHeading">${en.bookingHeading}</h2>
          <p class="section-sub" data-i18n="bookingSub">${en.bookingSub}</p>
        </div>

        <!-- Offline Fallback Notice (hidden by default) -->
        <div id="bookingOfflineNotice" class="booking-offline-card" style="display: none;">
          <div class="offline-icon">
            ${renderSvgIcon("whatsapp", 32)}
          </div>
          <h3 data-i18n="bookOfflineNotice">${en.bookOfflineNotice}</h3>
          <div class="offline-actions">
            <a id="offlineWaLink" href="${CLIENT.whatsappBase}?text=${encodeURIComponent(en.waPrefillGeneral)}" target="_blank" class="btn btn-primary clay-btn" data-track="whatsapp">
              ${renderSvgIcon("whatsapp", 20)}
              <span data-i18n="bookOfflineWaBtn">${en.bookOfflineWaBtn}</span>
            </a>
            <a href="${CLIENT.phoneTel}" class="btn btn-secondary" data-track="call">
              ${renderSvgIcon("phone", 18)}
              <span data-i18n="bookOfflineCallBtn">${en.bookOfflineCallBtn}</span>
            </a>
          </div>
        </div>

        <!-- Booking Form Container -->
        <form id="bookingForm" class="booking-form" novalidate>
          <!-- Hidden Honeypot for Anti-bot Protection -->
          <input type="text" name="website_hp" style="display: none;" tabindex="-1" autocomplete="off">

          <div class="form-grid">
            <!-- Full Name -->
            <div class="form-group col-span-1">
              <label for="bookFullName" data-i18n="formFullName">${en.formFullName}</label>
              <div class="input-wrap">
                <input type="text" id="bookFullName" name="fullName" required placeholder="${en.formFullNamePh}" data-i18n-ph="formFullNamePh">
              </div>
              <div class="form-error" id="errFullName"></div>
            </div>

            <!-- Phone -->
            <div class="form-group col-span-1">
              <label for="bookPhone" data-i18n="formPhone">${en.formPhone}</label>
              <div class="input-wrap">
                <span class="phone-prefix">+91</span>
                <input type="tel" id="bookPhone" name="phone" required placeholder="${en.formPhonePh}" data-i18n-ph="formPhonePh">
              </div>
              <small class="form-help" data-i18n="formPhoneHelp">${en.formPhoneHelp}</small>
              <div class="form-error" id="errPhone"></div>
            </div>

            <!-- Email (Optional) -->
            <div class="form-group col-span-1">
              <label for="bookEmail" data-i18n="formEmail">${en.formEmail}</label>
              <div class="input-wrap">
                <input type="email" id="bookEmail" name="email" placeholder="${en.formEmailPh}" data-i18n-ph="formEmailPh">
              </div>
              <div class="form-error" id="errEmail"></div>
            </div>

            <!-- Service Selection -->
            <div class="form-group col-span-1">
              <label for="bookService" data-i18n="formService">${en.formService}</label>
              <div class="input-wrap">
                <select id="bookService" name="service" required>
                  <option value="" data-i18n="formServiceDefault">${en.formServiceDefault}</option>
                  ${serviceOptionsHtml}
                </select>
              </div>
              <div class="form-error" id="errService"></div>
            </div>

            <!-- Preferred Date -->
            <div class="form-group col-span-1">
              <label for="bookDate" data-i18n="formDate">${en.formDate}</label>
              <div class="input-wrap">
                <input type="date" id="bookDate" name="date" required>
              </div>
              <div class="form-error" id="errDate"></div>
            </div>

            <!-- Time Slot Selection -->
            <div class="form-group col-span-1">
              <label for="bookSlot" data-i18n="formSlot">${en.formSlot}</label>
              <div class="input-wrap">
                <select id="bookSlot" name="slot" required>
                  <option value="" data-i18n="formSlotDefault">${en.formSlotDefault}</option>
                  ${TIME_SLOTS.map((s) => `<option value="${s}">${s}</option>`).join("")}
                </select>
              </div>
              <div class="form-error" id="errSlot"></div>
            </div>

            <!-- Specific Notes (Optional) -->
            <div class="form-group col-span-2">
              <label for="bookNotes" data-i18n="formNotes">${en.formNotes}</label>
              <div class="input-wrap">
                <textarea id="bookNotes" name="notes" rows="3" placeholder="${en.formNotesPh}" data-i18n-ph="formNotesPh"></textarea>
              </div>
            </div>
          </div>

          <div class="form-footer">
            <p class="form-privacy" data-i18n="formPrivacy">${en.formPrivacy}</p>
            <button type="submit" id="bookSubmitBtn" class="btn btn-primary clay-btn btn-submit">
              ${renderSvgIcon("calendar", 18)}
              <span class="btn-text" data-i18n="formSubmitBtn">${en.formSubmitBtn}</span>
            </button>
          </div>
        </form>

        <!-- Booking Success State Card -->
        <div id="bookingSuccessCard" class="booking-success-card" style="display: none;">
          <div class="success-icon-wrap">
            ${renderSvgIcon("check", 40)}
          </div>
          <h3 class="serif-title" data-i18n="bookSuccessTitle">${en.bookSuccessTitle}</h3>
          <p data-i18n="bookSuccessSub">${en.bookSuccessSub}</p>
          
          <div class="booking-ref-box">
            <span class="ref-label" data-i18n="bookSuccessRefLabel">${en.bookSuccessRefLabel}</span>
            <div class="ref-code" id="successRefCode">NK-20261023-XXXX</div>
          </div>

          <p class="success-next-step" data-i18n="bookSuccessNext">${en.bookSuccessNext}</p>

          <div class="success-actions">
            <a id="successWaBtn" href="#" target="_blank" rel="noopener noreferrer" class="btn btn-lg btn-wa-enquire clay-btn">
              ${renderSvgIcon("whatsapp", 22)}
              <span data-i18n="bookSuccessWaBtn">${en.bookSuccessWaBtn}</span>
            </a>
            <button id="bookAnotherBtn" type="button" class="btn btn-secondary">
              <span data-i18n="bookSuccessNewBtn">${en.bookSuccessNewBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Location & Embedded Google Map Section -->
  <section id="location" class="location-section">
    <div class="site-container">
      <div class="section-header text-center">
        <span class="section-eyebrow" data-i18n="locationEyebrow">${en.locationEyebrow}</span>
        <h2 class="section-title serif-title" data-i18n="locationHeading">${en.locationHeading}</h2>
        <p class="section-sub" data-i18n="locationSub">${en.locationSub}</p>
      </div>

      <div class="location-grid">
        <div class="location-info-card soft-card">
          <div class="info-block">
            <div class="info-icon">${renderSvgIcon("map-pin", 22)}</div>
            <div>
              <h4 data-i18n="addressTitle">${en.addressTitle}</h4>
              <p data-i18n="shortAddress">${CLIENT.shortAddress}</p>
            </div>
          </div>

          <div class="info-block">
            <div class="info-icon">${renderSvgIcon("map-pin", 22)}</div>
            <div>
              <h4 data-i18n="addressFullLabel">${en.addressFullLabel}</h4>
              <p class="text-sm text-muted">${CLIENT.fullAddress}</p>
            </div>
          </div>

          <div class="info-block">
            <div class="info-icon">${renderSvgIcon("clock", 22)}</div>
            <div>
              <h4 data-i18n="hoursTitle">${en.hoursTitle}</h4>
              <p data-i18n="workingHours">${CLIENT.workingHours}</p>
            </div>
          </div>

          <div class="info-block">
            <div class="info-icon">${renderSvgIcon("phone", 22)}</div>
            <div>
              <h4 data-i18n="phoneTitle">${en.phoneTitle}</h4>
              <p><a href="${CLIENT.phoneTel}">+91 9033442501</a></p>
            </div>
          </div>

          <div class="location-actions">
            <a href="${CLIENT.mapsDirectionsLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary clay-btn" data-track="directions">
              ${renderSvgIcon("map-pin", 18)}
              <span data-i18n="btnGetDirections">${en.btnGetDirections}</span>
            </a>
            <a href="${CLIENT.mapsShortLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" data-track="directions">
              ${renderSvgIcon("external-link", 18)}
              <span data-i18n="btnViewMaps">${en.btnViewMaps}</span>
            </a>
          </div>
        </div>

        <!-- Embedded Keyless Map -->
        <div class="map-embed-wrapper soft-card">
          <iframe 
            src="${CLIENT.mapsEmbedUrl}" 
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade"
            title="Nikhar Skincare Location Map">
          </iframe>
        </div>
      </div>
    </div>
  </section>

  <!-- Quick Contact Section -->
  <section id="contact" class="contact-section">
    <div class="site-container">
      <div class="section-header text-center">
        <span class="section-eyebrow" data-i18n="contactEyebrow">${en.contactEyebrow}</span>
        <h2 class="section-title serif-title" data-i18n="contactHeading">${en.contactHeading}</h2>
        <p class="section-sub" data-i18n="contactSub">${en.contactSub}</p>
      </div>

      <div class="contact-grid">
        <!-- Call -->
        <div class="contact-card soft-card">
          <div class="contact-icon bg-sage">${renderSvgIcon("phone", 22)}</div>
          <h3 data-i18n="quickCallTitle">${en.quickCallTitle}</h3>
          <p>+91 9033442501</p>
          <a href="${CLIENT.phoneTel}" class="btn btn-secondary contact-card-btn" data-track="call" data-i18n="quickCallBtn">${en.quickCallBtn}</a>
        </div>

        <!-- WhatsApp -->
        <div class="contact-card soft-card">
          <div class="contact-icon bg-gold">${renderSvgIcon("whatsapp", 22)}</div>
          <h3 data-i18n="quickWaTitle">${en.quickWaTitle}</h3>
          <p>Direct message to Hunaina</p>
          <a href="${CLIENT.whatsappBase}?text=${encodeURIComponent(en.waPrefillGeneral)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary contact-card-btn" data-track="whatsapp" data-i18n="quickWaBtn">${en.quickWaBtn}</a>
        </div>

        <!-- Instagram -->
        <div class="contact-card soft-card">
          <div class="contact-icon bg-rose">${renderSvgIcon("instagram", 22)}</div>
          <h3 data-i18n="quickIgTitle">${en.quickIgTitle}</h3>
          <p>${CLIENT.instagramHandle}</p>
          <a href="${CLIENT.instagramUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary contact-card-btn" data-track="instagram" data-i18n="quickIgBtn">${en.quickIgBtn}</a>
        </div>

        <!-- Email -->
        <div class="contact-card soft-card">
          <div class="contact-icon bg-lavender">${renderSvgIcon("mail", 22)}</div>
          <h3 data-i18n="quickEmailTitle">${en.quickEmailTitle}</h3>
          <p class="contact-card-email">${CLIENT.email}</p>
          <a href="${CLIENT.emailMailto}" class="btn btn-secondary contact-card-btn" data-i18n="quickEmailBtn">${en.quickEmailBtn}</a>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="site-container">
      <div class="footer-grid">
        <div class="footer-brand-col">
          <div class="footer-brand">
            <span class="serif-title">${CLIENT.brand}</span>
            <span class="footer-by">by Hunaina Shethwala</span>
          </div>
          <p class="footer-desc" data-i18n="footerAbout">${en.footerAbout}</p>
          <div class="footer-socials">
            <a href="${CLIENT.instagramUrl}" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Instagram">
              ${renderSvgIcon("instagram", 18)}
            </a>
            <a href="${CLIENT.whatsappBase}" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="WhatsApp">
              ${renderSvgIcon("whatsapp", 18)}
            </a>
            <a href="${CLIENT.emailMailto}" class="social-icon" aria-label="Email">
              ${renderSvgIcon("mail", 18)}
            </a>
          </div>
        </div>

        <div class="footer-links-col">
          <h4 data-i18n="footerQuickLinks">${en.footerQuickLinks}</h4>
          <ul>
            <li><a href="#about" data-i18n="navAbout">${en.navAbout}</a></li>
            <li><a href="#products" data-i18n="navProducts">${en.navProducts}</a></li>
            <li><a href="#why" data-i18n="navWhy">${en.navWhy}</a></li>
            <li><a href="#booking" data-i18n="navBooking">${en.navBooking}</a></li>
            <li><a href="#location" data-i18n="navLocation">${en.navLocation}</a></li>
            <li><a href="/admin" data-i18n="navAdmin">${en.navAdmin}</a></li>
          </ul>
        </div>

        <div class="footer-address-col">
          <h4 data-i18n="footerContact">${en.footerContact}</h4>
          <p data-i18n="shortAddress">${CLIENT.shortAddress}</p>
          <p><a href="${CLIENT.phoneTel}">+91 9033442501</a></p>
          <p><a href="${CLIENT.emailMailto}">${CLIENT.email}</a></p>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${CLIENT.brand} by ${CLIENT.owner}. <span data-i18n="footerNotice">${en.footerNotice}</span></p>
      </div>
    </div>
  </footer>

  <!-- Floating Quick-Action Buttons (Desktop) -->
  <aside class="floating-actions" aria-label="Quick contact buttons">
    <a href="${CLIENT.phoneTel}" class="floating-btn clay-btn" aria-label="Call Nikhar Skincare" data-track="call">
      ${renderSvgIcon("phone", 22)}
    </a>
    <a href="${CLIENT.whatsappBase}?text=${encodeURIComponent(en.waPrefillGeneral)}" target="_blank" rel="noopener noreferrer" class="floating-btn clay-btn floating-wa" aria-label="Chat on WhatsApp" data-track="whatsapp" id="floatingWaBtn">
      ${renderSvgIcon("whatsapp", 24)}
    </a>
    <a href="#booking" class="floating-btn clay-btn floating-book" aria-label="Jump to Booking" data-track="book_open">
      ${renderSvgIcon("calendar", 22)}
    </a>
  </aside>

  <!-- Sticky Bottom Action Bar (Mobile Only) -->
  <aside class="mobile-action-bar" aria-label="Mobile Navigation Quick Bar">
    <a href="${CLIENT.phoneTel}" class="mobile-bar-btn" data-track="call">
      ${renderSvgIcon("phone", 20)}
      <span data-i18n="mobileBarCall">${en.mobileBarCall}</span>
    </a>
    <a href="${CLIENT.whatsappBase}?text=${encodeURIComponent(en.waPrefillGeneral)}" target="_blank" rel="noopener noreferrer" class="mobile-bar-btn" data-track="whatsapp" id="mobileBarWaBtn">
      ${renderSvgIcon("whatsapp", 20)}
      <span data-i18n="mobileBarWa">${en.mobileBarWa}</span>
    </a>
    <a href="${CLIENT.mapsDirectionsLink}" target="_blank" rel="noopener noreferrer" class="mobile-bar-btn" data-track="directions">
      ${renderSvgIcon("map-pin", 20)}
      <span data-i18n="mobileBarDirections">${en.mobileBarDirections}</span>
    </a>
    <a href="#booking" class="mobile-bar-btn mobile-bar-cta" data-track="book_open">
      ${renderSvgIcon("calendar", 20)}
      <span data-i18n="mobileBarBook">${en.mobileBarBook}</span>
    </a>
  </aside>

  <!-- Notification Toast Container -->
  <div id="toastContainer" class="toast-container" aria-live="polite"></div>

  <!-- Scripts -->
  <script src="/public/app.js"></script>
</body>
</html>`;

  res.send(html);
});

// 404 Handler
app.use((req, res) => {
  if (req.accepts("html")) {
    return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found • Nikhar Skincare</title>
  <link rel="stylesheet" href="/public/style.css">
</head>
<body class="site-body flex items-center justify-center min-h-screen">
  <div class="text-center p-8 soft-card max-w-md mx-auto">
    <h1 class="serif-title text-4xl mb-3">404</h1>
    <p class="mb-6">The requested page does not exist.</p>
    <a href="/" class="btn btn-primary clay-btn">Return to Home</a>
  </div>
</body>
</html>`);
  }
  return res.status(404).json({ ok: false, error: "Not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({
    ok: false,
    error: "An unexpected error occurred. Please try again."
  });
});

// Export app for Vercel Serverless
module.exports = app;

// Listen only when run locally
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Nikhar Skincare server running on port ${PORT}`);
  });
}
