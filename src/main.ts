import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

import sequelize from "./config/database";
import { Routes } from "./routes/routes";

import "./models/index"

// Jobs
// import { startAutoExpireJob } from "./jobs/autoExpireBloodRequests";
import { startDonationReminderCron } from "./controllers/donationReminder.cron";

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Ensure required upload directories exist
 */
const ensureUploadDirectories = (): void => {
  const uploadDirs = [
    "public/uploads",
    "public/uploads/transfusion-requests/images",
    "public/uploads/transfusion-requests/files",
  ];

  uploadDirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${fullPath}`);
    }
  });
};

/**
 * Configure global middlewares
 */
const configureMiddlewares = (): void => {
  app.use(
  cors({
    origin: "*",
    credentials: true,
  })
  );

  app.use(express.json({ limit: "10mb" }));

  // Static uploads
  app.use(
    "/uploads",
    (_req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    express.static(path.join(process.cwd(), "public/uploads"))
  );
};

/**
 * Global error handler
 */
const configureErrorHandler = (): void => {
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("FULL ERROR:", err);

    res.status(err.status || 500).json({
      message: err.message || "Internal Server Error",
      stack:
        process.env.NODE_ENV === "development"
          ? err.stack
          : undefined,
    });
  });
};

/**
 * Start background jobs
 */
const startBackgroundJobs = (): void => {
  // startAutoExpireJob();
  console.log("Auto-expire job started");

  startDonationReminderCron();
  console.log("Donation reminder cron started");
};

/**
 * Bootstrap application
 */
const startServer = async (): Promise<void> => {
  try {
    ensureUploadDirectories();

    configureMiddlewares();

    Routes(app);

    configureErrorHandler();

    await sequelize.authenticate();
    console.log("DB connected");

    startBackgroundJobs();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
};

startServer();

export default app;