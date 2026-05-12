import dotenv from "dotenv";
dotenv.config();

import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

import sequelize from './config/database';

// Routes
import authRoutes from "./routes/auth.routes";
import bloodbankRoutes from "./routes/bloodbank.routes";
import bloodRequestRoutes from "./routes/bloodRequest.routes";
import profileRoutes from "./routes/profile.routes";
import landingContentRoutes from "./routes/landingContent.routes";
import aboutRoutes from "./routes/about.routes";
import adminRoutes from "./routes/admin.routes";
import donationRoutes from "./routes/donation.routes";
import inventoryRoutes from "./routes/inventory.form.routes";
import ocrRoutes from "./routes/ocr.routes";
import facilitiesRoutes from "./routes/facilities.routes";

// Jobs
import { startAutoExpireJob } from "./jobs/autoExpireBloodRequests";
import mapRoutes from "./routes/map.routes";
import { startDonationReminderCron } from "./controllers/donationReminder.cron";

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist
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

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://claret.sbs",
      "https://www.claret.sbs",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// Static files
app.use(
  "/uploads",
  (req: any, res: any, next: any) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(process.cwd(), "public/uploads"))
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bloodbanks", bloodbankRoutes);
app.use("/api/blood-requests", bloodRequestRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/content", landingContentRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/facilities", facilitiesRoutes); // ✅ NEW
app.use("/api", mapRoutes);

// Health check
app.get("/", (_req, res) => {
  res.send("Server is running!");
});

app.get("/api/test", (_req, res) => {
  res.json({ message: "test route works" });
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("FULL ERROR:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start server
const start = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("DB connected");

    startAutoExpireJob();
    console.log("Auto-expire job started");

    startDonationReminderCron();
    console.log("Donation reminder cron started");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
};

start();

export default app;