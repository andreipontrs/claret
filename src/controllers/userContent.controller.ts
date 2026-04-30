import { Request, Response } from "express";
import UserContent from "../models/userContent";
import path from "path";
import fs from "fs";

// Extend Request for multer file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Helper: parse ID safely
const parseId = (id: string): number | null => {
  const parsed = Number(id);
  return isNaN(parsed) ? null : parsed;
};

// GET all user contents
export const getUserContents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const userContents = await UserContent.findAll();
    res.status(200).json({ success: true, data: userContents });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// GET single user content by ID
export const getUserContentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id as string);

    if (!id) {
      res.status(400).json({ success: false, message: "Invalid ID" });
      return;
    }

    const userContentItem = await UserContent.findByPk(id);

    if (!userContentItem) {
      res.status(404).json({ success: false, message: "User content not found" });
      return;
    }

    res.status(200).json({ success: true, data: userContentItem });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// CREATE user content
export const createUserContent = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      type,
      content: bodyContent,
      address,
      donation_time,
      donation_date,
    } = req.body;

    if (!title || !type) {
      res.status(400).json({ success: false, message: "Title and Type are required" });
      return;
    }

    // Validate Donation-specific fields
    if (type === "Donation" && (!address || !donation_time || !donation_date)) {
      res.status(400).json({
        success: false,
        message: "Address, time, and date are required for Donation type",
      });
      return;
    }

    const file_path = req.file ? `/uploads/${req.file.filename}` : null;

    const newUserContent = await UserContent.create({
      title,
      type,
      content: bodyContent ?? null,
      file_path,
      address: type === "Donation" ? address : null,
      donation_time: type === "Donation" ? donation_time : null,
      donation_date: type === "Donation" ? donation_date : null,
    });

    res.status(201).json({ success: true, message: "User content created successfully", data: newUserContent });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// UPDATE user content
export const updateUserContent = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id as string);

    if (!id) {
      res.status(400).json({ success: false, message: "Invalid ID" });
      return;
    }

    const userContentItem = await UserContent.findByPk(id);

    if (!userContentItem) {
      res.status(404).json({ success: false, message: "User content not found" });
      return;
    }

    const {
      title,
      type,
      content: bodyContent,
      address,
      donation_time,
      donation_date,
    } = req.body;

    const resolvedType = type ?? userContentItem.type;

    // Validate Donation-specific fields on update
    if (resolvedType === "Donation" && (!address || !donation_time || !donation_date)) {
      res.status(400).json({
        success: false,
        message: "Address, time, and date are required for Donation type",
      });
      return;
    }

    // Replace file if new one uploaded
    if (req.file) {
      if (userContentItem.file_path) {
        const oldFilePath = path.join(__dirname, "..", "public", userContentItem.file_path);
        if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
      }
      userContentItem.file_path = `/uploads/${req.file.filename}`;
    }

    userContentItem.title = title ?? userContentItem.title;
    userContentItem.type = resolvedType;
    userContentItem.content = bodyContent ?? userContentItem.content;

    // Set or clear donation fields based on type
    if (resolvedType === "Donation") {
      userContentItem.address = address ?? userContentItem.address;
      userContentItem.donation_time = donation_time ?? userContentItem.donation_time;
      userContentItem.donation_date = donation_date ?? userContentItem.donation_date;
    } else {
      userContentItem.address = null;
      userContentItem.donation_time = null;
      userContentItem.donation_date = null;
    }

    await userContentItem.save();

    res.status(200).json({ success: true, message: "User content updated successfully", data: userContentItem });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// DELETE user content
export const deleteUserContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseId(req.params.id as string);

    if (!id) {
      res.status(400).json({ success: false, message: "Invalid ID" });
      return;
    }

    const userContentItem = await UserContent.findByPk(id);

    if (!userContentItem) {
      res.status(404).json({ success: false, message: "User content not found" });
      return;
    }

    // Delete file if exists
    if (userContentItem.file_path) {
      const filePath = path.join(__dirname, "..", "public", userContentItem.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await userContentItem.destroy();

    res.status(200).json({ success: true, message: "User content removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};