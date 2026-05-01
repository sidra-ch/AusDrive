import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../lib/prisma";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional(),
  profileImage: z.string().url("Invalid URL").optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().datetime().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Password must be at least 8 characters"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      `SELECT id, name, email, phone, profile_image, role, is_verified, created_at, updated_at
       FROM users WHERE id = $1 LIMIT 1`,
      [Number(userId)]
    );
    const user = result.rows[0];

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profile_image,
        licenseNumber: null,
        licenseExpiry: null,
        role: user.role,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const validatedData = updateProfileSchema.parse(req.body);

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           profile_image = COALESCE($3, profile_image),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, email, phone, profile_image, role, is_verified, updated_at`,
      [
        validatedData.name ?? null,
        validatedData.phone ?? null,
        validatedData.profileImage ?? null,
        Number(userId),
      ]
    );

    const user = result.rows[0];

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profile_image,
        licenseNumber: validatedData.licenseNumber ?? null,
        licenseExpiry: validatedData.licenseExpiry ?? null,
        role: user.role,
        isVerified: user.is_verified,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const validatedData = changePasswordSchema.parse(req.body);

    const result = await pool.query(
      `SELECT password FROM users WHERE id = $1 LIMIT 1`,
      [Number(userId)]
    );
    const user = result.rows[0] as { password: string | null } | undefined;

    if (!user || !user.password) {
      res.status(400).json({ error: "User does not have a password set" });
      return;
    }

    const passwordMatch = await bcrypt.compare(
      validatedData.currentPassword,
      user.password
    );

    if (!passwordMatch) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    await pool.query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, Number(userId)]
    );

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error("Change Password Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { password } = req.body;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!password) {
      res.status(400).json({ error: "Password is required to delete account" });
      return;
    }

    const result = await pool.query(
      `SELECT password FROM users WHERE id = $1 LIMIT 1`,
      [Number(userId)]
    );
    const user = result.rows[0] as { password: string | null } | undefined;

    if (!user || !user.password) {
      res.status(400).json({ error: "User does not have a password set" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: "Password is incorrect" });
      return;
    }

    await pool.query(`DELETE FROM user_sessions WHERE user_id = $1`, [Number(userId)]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [Number(userId)]);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
