import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../lib/prisma";
import { ensureBackendSchema } from "../lib/schema";
import { generateToken } from "../utils/jwt";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  isEmailTransportConfigured,
  getEmailErrorMessage,
} from "../utils/email";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    if (!isEmailTransportConfigured()) {
      res.status(503).json({
        error: "Email service is not configured. Please contact support.",
      });
      return;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existingResult = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [validatedData.email]
      );

      if (existingResult.rows.length > 0) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: "Email already in use" });
        return;
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      const result = await client.query(
        "INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email",
        [validatedData.name, validatedData.email, hashedPassword, "STAFF", false]
      );
      const user = result.rows[0];

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      try {
        await sendVerificationEmail(user.email, verificationCode);
      } catch (emailError) {
        throw new Error(`EMAIL_DELIVERY_FAILED:${getEmailErrorMessage(emailError)}`);
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: "Registration successful. Please check your email to verify your account.",
        user: { id: String(user.id), name: user.name, email: user.email }
      });
      return;
    } catch (error) {
      await client.query("ROLLBACK");

      if (error instanceof Error && error.message.startsWith("EMAIL_DELIVERY_FAILED:")) {
        console.error("Register Email Delivery Error:", error.message);
        res.status(503).json({
          error: "Unable to send verification email right now. Please try again shortly.",
        });
        return;
      }

      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error("Register Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureBackendSchema();

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const result = await pool.query(
      "SELECT id, name, email, password, role, branch, is_active FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];

    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid email" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: "Wrong password" });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ error: "Account not active. Please contact your administrator." });
      return;
    }

    const token = generateToken(String(user.id));

    // Update last_login timestamp
    await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    // Create session record
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    
    await pool.query(
      `INSERT INTO user_sessions
       (user_id, access_token, device_name, device_type, ip_address, user_agent, expires_at, is_active, last_activity_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,NOW(),NOW())`,
      [
        user.id,
        token,
        userAgent.substring(0, 255),
        userAgent.includes("Mobile") ? "mobile" : "web",
        String(ipAddress).split(",")[0],
        userAgent.substring(0, 500),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ]
    );

    res.status(200).json({
      token,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      res.status(400).json({ error: "Email and code are required" });
      return;
    }

    await pool.query(
      "UPDATE users SET is_active = true WHERE email = $1",
      [email]
    );

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureBackendSchema();

    const { email, name, googleId, profileImage } = req.body;

    if (!email || !googleId) {
      res.status(400).json({ error: "Email and Google ID are required" });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    let userResult = await pool.query(
      "SELECT id, name, email, role, provider, profile_image FROM users WHERE lower(email) = $1 LIMIT 1",
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      userResult = await pool.query(
        `INSERT INTO users (name, email, role, branch, is_active, provider, is_verified, google_id, profile_image)
         VALUES ($1, $2, 'USER', 'Sydney', TRUE, 'google', TRUE, $3, $4)
         RETURNING id, name, email, role, provider, profile_image`,
        [name || normalizedEmail.split("@")[0], normalizedEmail, googleId, profileImage || null]
      );
    } else {
      await pool.query(
        `UPDATE users
         SET provider = 'google', is_verified = TRUE, google_id = $1, profile_image = COALESCE($2, profile_image), last_login = NOW()
         WHERE id = $3`,
        [googleId, profileImage || null, userResult.rows[0].id]
      );
    }

    const user = userResult.rows[0];
    const token = generateToken(String(user.id));

    // Create session record
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

    await pool.query(
      `INSERT INTO user_sessions
       (user_id, access_token, device_name, device_type, ip_address, user_agent, expires_at, is_active, last_activity_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,NOW(),NOW())`,
      [
        Number(user.id),
        token,
        userAgent.substring(0, 255),
        userAgent.includes("Mobile") ? "mobile" : "web",
        String(ipAddress).split(",")[0],
        userAgent.substring(0, 500),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ]
    );

    res.status(200).json({
      token,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profile_image,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const result = await pool.query(
      "SELECT id, name, email, role, branch, is_active FROM users WHERE id = $1",
      [userId]
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
        role: user.role,
        branch: user.branch,
        isVerified: user.is_active,
      }
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  if (!isEmailTransportConfigured()) {
    res.status(503).json({ error: "Email service is temporarily unavailable." });
    return;
  }

  const result = await pool.query("SELECT email FROM users WHERE email = $1", [email]);
  if (result.rows.length > 0) {
    try {
      await sendPasswordResetEmail(email, "RESET-TOKEN-123");
    } catch (error) {
      console.error("Forgot Password Email Error:", getEmailErrorMessage(error));
      res.status(503).json({ error: "Email service is temporarily unavailable." });
      return;
    }
  }
  res.status(200).json({ message: "If that email exists, a password reset link has been sent." });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) { res.status(400).json({ error: "Required fields missing" }); return; }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  try {
    await pool.query(
      "UPDATE users SET password = $1 WHERE email = $2",
      [hashedPassword, email]
    );
    res.status(200).json({ message: "Password reset successful." });
  } catch (e) {
    res.status(500).json({ error: "Failed to reset password." });
  }
};

export const appleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureBackendSchema();

    const { email, name, appleId, profileImage } = req.body;

    if (!email || !appleId) {
      res.status(400).json({ error: "Email and Apple ID are required" });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    let userResult = await pool.query(
      "SELECT id, name, email, role, provider, profile_image FROM users WHERE lower(email) = $1 LIMIT 1",
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      userResult = await pool.query(
        `INSERT INTO users (name, email, role, branch, is_active, provider, is_verified, apple_sub, profile_image)
         VALUES ($1, $2, 'USER', 'Sydney', TRUE, 'apple', TRUE, $3, $4)
         RETURNING id, name, email, role, provider, profile_image`,
        [name || normalizedEmail.split("@")[0], normalizedEmail, appleId, profileImage || null]
      );
    } else {
      await pool.query(
        `UPDATE users
         SET provider = 'apple', is_verified = TRUE, apple_sub = COALESCE($1, apple_sub), profile_image = COALESCE($2, profile_image), last_login = NOW()
         WHERE id = $3`,
        [appleId, profileImage || null, userResult.rows[0].id]
      );
    }

    const user = userResult.rows[0];
    const token = generateToken(String(user.id));

    // Create session record
    const userAgent = req.headers["user-agent"] || "";
    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";

    await pool.query(
      `INSERT INTO user_sessions
       (user_id, access_token, device_name, device_type, ip_address, user_agent, expires_at, is_active, last_activity_at, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,NOW(),NOW())`,
      [
        Number(user.id),
        token,
        userAgent.substring(0, 255),
        userAgent.includes("Mobile") ? "mobile" : "web",
        String(ipAddress).split(",")[0],
        userAgent.substring(0, 500),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ]
    );

    res.status(200).json({
      token,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profile_image,
      },
    });
  } catch (error) {
    console.error("Apple Login Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
