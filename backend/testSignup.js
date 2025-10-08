import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/signup", (req, res) => {
  console.log("Body received:", req.body); // Terminalde görebileceksin
  res.status(201).json({ message: "Signup route reachable!" });
});

app.listen(5000, () => console.log("Test server running on port 5000"));