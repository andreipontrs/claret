import { Request, Response } from "express";
import Content from "../models/landingContent";

const getUser = (req: Request) => ({
  role:   (req as any).user?.role   as "admin" | "blood_bank" | undefined,
  userId: (req as any).user?.id     as string  | undefined,
});

export const getContents = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { role, userId } = getUser(req);
    const { section } = req.query;

    const where: any = {};
    if (section) where.section = section;

    if (role === "admin" || role === "blood_bank") {
      where.created_by = userId;
    }

    const data = await Content.findAll({
      where,
      order: [["order", "ASC"]],
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getContents error:", error);
    return res.status(500).json({ success: false, message: "Server error.", error });
  }
};

export const getContentById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const id = String(req.params.id);
    const entry = await Content.findByPk(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: "Content not found." });
    }

    return res.status(200).json({ success: true, data: entry });
  } catch (error) {
    console.error("getContentById error:", error);
    return res.status(500).json({ success: false, message: "Server error.", error });
  }
};

export const createContent = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { role, userId } = getUser(req);

    const {
      title,
      type,
      section,
      content,
      event_start_date,
      event_end_date,
      location,
      location_address,
      location_unit,
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({ success: false, message: "Title and Type are required." });
    }

    const maxOrderEntry = await Content.findOne({
      where: { section },
      order: [["order", "DESC"]],
    });
    const nextOrder = maxOrderEntry ? (maxOrderEntry.order + 1) : 0;

    const entry = await Content.create({
      title,
      type,
      section,
      content:          content          || null,
      file_path:        req.file         ? `/uploads/${req.file.filename}` : null,
      order:            nextOrder,
      event_start_date:       event_start_date       || null,
      event_end_date:       event_end_date       || null,
      location:         location         || null,
      location_address: location_address || null,
      location_unit:    location_unit    || null,
      created_by:       userId           ?? null,
      role_scope:       role             ?? null,
    });

    return res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error("createContent error:", error);
    return res.status(500).json({ success: false, message: "Server error.", error });
  }
};

export const updateContent = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { role, userId } = getUser(req);
    const id = String(req.params.id);

    const entry = await Content.findByPk(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: "Content not found." });
    }

    if (role === "blood_bank" && entry.created_by !== userId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const {
      title,
      type,
      section,
      content,
      event_start_date,
      event_end_date,
      location,
      location_address,
      location_unit,
    } = req.body;

    await entry.update({
      ...(title            !== undefined && { title }),
      ...(type             !== undefined && { type }),
      ...(section          !== undefined && { section }),
      ...(content          !== undefined && { content }),
      ...(event_start_date       !== undefined && { event_start_date }),
      ...(event_end_date       !== undefined && { event_end_date }),
      ...(location         !== undefined && { location }),
      ...(location_address !== undefined && { location_address }),
      ...(location_unit    !== undefined && { location_unit }),
      ...(req.file && { file_path: `/uploads/${req.file.filename}` }),
    });

    return res.status(200).json({ success: true, data: entry });
  } catch (error) {
    console.error("updateContent error:", error);
    return res.status(500).json({ success: false, message: "Server error.", error });
  }
};

export const deleteContent = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { role, userId } = getUser(req);
    const id = String(req.params.id);
    const entry = await Content.findByPk(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: "Content not found." });
    }

    if (role === "blood_bank" && entry.created_by !== userId) {
      return res.status(403).json({ success: false, message: "Access denied. You can only delete your own posts." });
    }

    await entry.destroy();
    return res.status(200).json({ success: true, message: "Content deleted." });
  } catch (error) {
    console.error("deleteContent error:", error);
    return res.status(500).json({ success: false, message: "Server error.", error });
  }
};

export const reorderContent = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id, direction } = req.body;

    if (!id || !["up", "down"].includes(direction)) {
      return res.status(400).json({ success: false, message: "Invalid id or direction." });
    }

    const entry = await Content.findByPk(id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Content not found." });
    }

    const swapOrder = direction === "up" ? entry.order - 1 : entry.order + 1;

    const neighbor = await Content.findOne({
      where: { section: entry.section, order: swapOrder },
    });

    if (!neighbor) {
      return res.status(400).json({ success: false, message: "Cannot move further in that direction." });
    }

    const tempOrder = entry.order;
    await entry.update({ order: neighbor.order });
    await neighbor.update({ order: tempOrder });

    return res.status(200).json({ success: true, message: "Reordered successfully." });
  } catch (error) {
    console.error("reorderContent error:", error);
    return res.status(500).json({ success: false, message: "Server error.", error });
  }
};