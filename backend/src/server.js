const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRouter = require("./routes/auth");
const meetingRoutes = require('./routes/meetings');
const {
  getMissingEnvironmentVariables,
  parseAllowedOrigins,
} = require("./utils/config");

require("dotenv").config();

const missingEnvironmentVariables = getMissingEnvironmentVariables(process.env);
if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(", ")}`
  );
}

const app = express();
const server = http.createServer(app);
const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

// Socket.io configuration for production
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true,
}));

app.set("trust proxy", 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Routes
app.use("/api/auth", authRouter);
app.use('/api/meetings', meetingRoutes);

// Health check API
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Video Conferencing API", 
    version: "1.0.0" 
  });
});

app.use((error, _req, res, _next) => {
  if (error.message === "Origin is not allowed by CORS") {
    return res.status(403).json({ success: false, message: error.message });
  }

  console.error("Unhandled request error:", error.message);
  return res.status(500).json({ success: false, message: "Internal server error" });
});

// Socket.io handlers
const setupSocketHandlers = require('./socket/socketHandlers');
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");

  return server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start the server:", error.message);
    process.exit(1);
  });
}

module.exports = { app, io, server, startServer };
