import { Router } from "express";
import {
  getAboutContact,
  saveAboutContact,
} from "../controllers/about.controller";

const router = Router();

router.get("/getAbout", getAboutContact);
router.put("/saveAbout", saveAboutContact);

export default router;