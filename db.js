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

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

module.exports = {
  connectDB,
  isDbConnected,
  getDbStatus,
  Booking,
  Event
};
