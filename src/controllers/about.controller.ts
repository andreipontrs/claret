import { Request, Response } from "express";
import AboutContact from "../models/about";

// GET
export const getAboutContact = async (req: Request, res: Response) => {
  try {
    const data = await AboutContact.findOne();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data" });
  }
};

// SAVE / UPDATE
export const saveAboutContact = async (req: Request, res: Response) => {
  try {
    const { about, contact } = req.body;

    if (!about || !contact) {
      return res.status(400).json({ message: "Both fields are required" });
    }

    let record = await AboutContact.findOne();

    if (!record) {
      record = await AboutContact.create({ about, contact });
    } else {
      await record.update({ about, contact });
    }

    res.json({ message: "Saved successfully", data: record });
  } catch (error) {
    res.status(500).json({ message: "Error saving data" });
  }
};