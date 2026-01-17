const express = require("express");
const path = require("path");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const userRoutes = require("./routes/userRoutes");

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Get allowed origins from environment or use defaults
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "https://sagargi.github.io"];

console.log("🔓 CORS Configuration:");
console.log("Allowed Origins:", ALLOWED_ORIGINS);

// CRITICAL: CORS must be FIRST middleware, before any routes
app.use((req, res, next) => {
  const origin = req.headers.origin;

  console.log(
    `📨 ${req.method} ${req.path} from origin: ${origin || "no-origin"}`
  );

  // Always set CORS headers for allowed origins
  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    const allowOrigin = origin || ALLOWED_ORIGINS[0];
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, HEAD"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

    console.log(`✅ CORS headers set for: ${allowOrigin}`);
  } else {
    console.log(`❌ CORS blocked: ${origin}`);
  }

  // Handle preflight immediately
  if (req.method === "OPTIONS") {
    console.log("✈️ Preflight request - sending 204");
    return res.status(204).end();
  }

  next();
});

// Body parsers - AFTER CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/users", userRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Velion DKN API is running",
    timestamp: new Date().toISOString(),
    cors: "enabled",
    allowedOrigins: ALLOWED_ORIGINS,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size too large. Maximum size is 10MB.",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌍 Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`);
});

module.exports = app;
