require("dotenv").config();
const express = require("express");
const fileUpload = require("express-fileupload");
const app = express();

app.set("view engine", "ejs");

const db = require("./connection")

// middleware

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

// routes
const downloadRoutes = require("./routes/download");
const paymentRoutes = require("./routes/payment");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

// DEBUG (important)
// console.log("userRoutes:", typeof userRoutes);
// console.log("adminRoutes:", typeof adminRoutes);
app.use("/download", downloadRoutes);
app.use("/payment", paymentRoutes);
app.use("/", userRoutes);
app.use("/admin", adminRoutes);

process.on("uncaughtException", err => {
  console.error("Uncaught:", err);
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
