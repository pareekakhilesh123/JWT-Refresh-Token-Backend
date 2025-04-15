const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");

app.get("/", (req, res) => {
  res.send("Server is Running");
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
