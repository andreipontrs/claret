import { Express } from "express";

// Routes
import authRoutes from "./auth.routes";
import bloodbankRoutes from "./bloodbank.routes";
import bloodRequestRoutes from "./bloodRequest.routes";
import profileRoutes from "./profile.routes";
import landingContentRoutes from "./landingContent.routes";
import aboutRoutes from "./about.routes";
import adminRoutes from "./admin.routes";
import donationRoutes from "./donation.routes";
import inventoryRoutes from "./inventory.form.routes";
import ocrRoutes from "./ocr.routes";
import facilitiesRoutes from "./facilities.routes";
import mapRoutes from "./map.routes";
import BloodBank from "./bloodBank";

export const Routes = (app: Express): void => {
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
  app.use("/api/facilities", facilitiesRoutes);
  app.use("/api/dashboard", BloodBank);
  app.use("/api", mapRoutes);

  // Health checks
  app.get("/", (_req, res) => {
    res.send("Server is running!");
  });

  app.get("/api/test", (_req, res) => {
    res.json({ message: "test route works" });
  });
};