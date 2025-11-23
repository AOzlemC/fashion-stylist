/*
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./db.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// 🧩 Signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await db("users").where({ email }).first();
    if (existingUser) return res.status(400).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db("users").insert({ name, email, password: hashedPassword });
    //signup
    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🪄 Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db("users").where({ email }).first();
    if (!user) return res.status(404).json({ message: "User not found." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid password." });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;*/

// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./db.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// 🧩 Signup
router.post("/signup", async (req, res) => {
  const { name, email, password, dateofbirth } = req.body;

  console.log("Signup request received:", { name, email, hasPassword: !!password, dateofbirth });

  try {
    const existingUser = await db("users").where({ email }).first();
    if (existingUser) return res.status(400).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Prepare insert data
    const insertData = { 
      name, 
      email, 
      password: hashedPassword,
      dateofbirth: dateofbirth || null
    };

    console.log("Inserting user with data:", { ...insertData, password: "[HIDDEN]" });
    
    await db("users").insert(insertData);
    console.log("User registered successfully with dateofbirth:", dateofbirth || "none");
    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 🪄 Login – artık name ve profileImage döndürüyor
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db("users").where({ email }).first();
    if (!user) return res.status(404).json({ message: "User not found." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid password." });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const responseData = {
      message: "Login successful",
      token,
      name: user.name || "",
      email: user.email || "",
      profileImage: user.profileImage || null,
      dateofbirth: user.dateofbirth || ""
    };

    console.log("Login successful for:", user.email, "dateofbirth:", responseData.dateofbirth || "(empty)");
    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 📝 Update User Profile
router.post("/update-profile", async (req, res) => {
  const { email, name, dateofbirth } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const user = await db("users").where({ email }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (dateofbirth !== undefined) updateData.dateofbirth = dateofbirth;

    await db("users").where({ email }).update(updateData);

    res.json({ message: "Profile updated successfully." });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 🔐 Update Password
router.post("/update-password", async (req, res) => {
  console.log("Update password route hit!");
  console.log("Request body:", req.body);
  
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    console.log("Missing email or password");
    return res.status(400).json({ message: "Email and new password are required." });
  }

  try {
    console.log("Looking for user with email:", email);
    const user = await db("users").where({ email }).first();
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found." });
    }

    console.log("User found, updating password...");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db("users").where({ email }).update({ password: hashedPassword });

    console.log("Password updated successfully");
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;

/*
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "./db.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// 🧩 Signup
router.post("/signup", async (req, res) => {
  const { name, email, password, dateofbirth } = req.body;

  try {
    const existingUser = await db("users").where({ email }).first();
    if (existingUser) return res.status(400).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db("users").insert({ name, email, password: hashedPassword, dateofbirth });

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🪄 Login – artık name, email, dateofbirth, profileImage döndürüyor
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db("users").where({ email }).first();
    if (!user) return res.status(404).json({ message: "User not found." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid password." });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        name: user.name,
        email: user.email,
        dateofbirth: user.dateofbirth || "",
        profileImage: user.profileImage || null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;*/