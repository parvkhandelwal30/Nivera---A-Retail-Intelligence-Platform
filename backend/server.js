require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const stockoutRoutes = require("./routes/stockoutRoutes");

const app = express();

// ===============================
// Database
// ===============================
connectDB();

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// Health Check
// ===============================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Retail system API is running",
  });
});

// ===============================
// API Routes
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

// Stockout Intelligence / ML
app.use("/api/stockout", stockoutRoutes);

// ===============================
// 404 Handler
// ===============================
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ===============================
// Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    message: "Something went wrong",
    error: err.message,
  });
});

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});