// Nikhar Skincare - Safe Cached Database Layer
// Bulletproof resilience: Never crashes on missing/invalid URI or network dropouts

const mongoose = require("mongoose");

// Safe environment variable getter
function getSafeMongoUri() {
  const raw = process.env.MONGODB_URI;
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim().replace(/^['"]+|['"]+$/g, "");
  if (!trimmed.startsWith("mongodb://") && !trimmed.startsWith("mongodb+srv://")) {
    return null;
  }
  return trimmed;
}

// Global cached connection state for serverless execution
if (!globalThis._nikharMongoCache) {
  globalThis._nikharMongoCache = {
    conn: null,
    promise: null,
    lastAttempt: 0,
    cooldownMs: 30000, // 30 second cooldown before retrying after failure
    lastError: null
  };
}

const cache = globalThis._nikharMongoCache;

async function connectDB() {
  const uri = getSafeMongoUri();
  if (!uri) {
    cache.lastError = "MONGODB_URI not configured or invalid";
    return null;
  }

  // If connection is established and readyState is 1 (connected)
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  // Cooldown check: if recent failure, do not retry on every request
  const now = Date.now();
  if (cache.lastError && (now - cache.lastAttempt < cache.cooldownMs)) {
    return null;
  }

  if (cache.promise) {
    try {
      cache.conn = await cache.promise;
      return cache.conn;
    } catch {
      cache.promise = null;
      return null;
    }
  }

  cache.lastAttempt = now;
  cache.lastError = null;

  try {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      maxPoolSize: 10
    };

    cache.promise = mongoose.connect(uri, opts).then((m) => {
      cache.lastError = null;
      return m;
    });

    cache.conn = await cache.promise;
    return cache.conn;
  } catch (err) {
    cache.promise = null;
    cache.conn = null;
    cache.lastError = err.message || "Failed to connect to MongoDB";
    return null;
  }
}

function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

function getDbStatus() {
  if (isDbConnected()) return "online";
  const uri = getSafeMongoUri();
  if (!uri) return "unconfigured";
  return "offline";
}

// Schemas & Models
const bookingSchema = new mongoose.Schema(
  {
    ref: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    email: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120
    },
    service: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    date: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    slot: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000
    },
    lang: {
      type: String,
      enum: ["en", "hi"],
      default: "en"
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true
    },
    ip: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      index: true,
      enum: ["call", "whatsapp", "directions", "instagram", "book_open", "other"]
    },
    meta: {
      type: String,
      default: "",
      maxlength: 500
    },
    ip: {
      type: String,
      default: ""
    },
    lang: {
      type: String,
      enum: ["en", "hi"],
      default: "en"
    }
  },
  {
    timestamps: true
  }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 300 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    sku: { type: String, trim: true, default: "", maxlength: 100 },
    category: { type: String, required: true, trim: true, enum: ["skin", "body", "hair", "general"], default: "skin", index: true },
    mrp: { type: Number, default: 0, min: 0 },
    salePrice: { type: Number, default: 0, min: 0 },
    stockStatus: { type: String, enum: ["in_stock", "limited", "out_of_stock"], default: "in_stock", index: true },
    stock: { type: Number, default: 0, min: 0 },
    images: [
      {
        url: { type: String, required: true, trim: true },
        alt: { type: String, default: "", trim: true },
        isPrimary: { type: Boolean, default: false }
      }
    ],
    description: { type: String, default: "", trim: true },
    shortDescription: { type: String, default: "", trim: true },
    specs: [
      {
        key: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true }
      }
    ],
    isVisible: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    badgeEn: { type: String, default: "", trim: true },
    badgeHi: { type: String, default: "", trim: true },
    metaTitle: { type: String, default: "", trim: true },
    metaDescription: { type: String, default: "", trim: true }
  },
  { timestamps: true }
);

const metaSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: true }
  },
  { timestamps: true }
);

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
const Meta = mongoose.models.Meta || mongoose.model("Meta", metaSchema);

module.exports = {
  connectDB,
  isDbConnected,
  getDbStatus,
  Booking,
  Event,
  Product,
  Meta
};

