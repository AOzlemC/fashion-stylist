import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./authRoutes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5050;

app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
app.use(express.json());

// Ana rota
app.get("/", (req, res) => {
  res.send("Backend running successfully!");
});

// Auth rotaları
app.use("/auth", authRoutes);

// Test endpoint to verify server is running
app.post("/test", (req, res) => {
    res.json({ message: "Test OK" });
  });

// Debug: Log when server starts
console.log("Auth routes registered:");
console.log("  POST /auth/signup");
console.log("  POST /auth/login");
console.log("  POST /auth/update-profile");
console.log("  POST /auth/update-password");

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});