const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const db = require("../connection");



let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log("✅ Razorpay initialized");
} else {
  console.warn("⚠️ Razorpay keys not found, payment routes disabled");
}




/* ================= CREATE ORDER ================= */
router.post("/create-order", async (req, res) => {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects paise
        currency: "INR"
    });

    res.json({
        key: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount
    });
});

/* ================= VERIFY PAYMENT ================= */
router.post("/verify-payment", (req, res) => {

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        buyerName,
        buyerMobile,
        subject,   // subject name (string)
        amount,
        sub_id     // ✅ SUBJECT ID (IMPORTANT)
    } = req.body;

    /* 1️⃣ Verify Razorpay signature */
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        console.log("❌ Razorpay signature mismatch");
        return res.json({ success: false });
    }

    /* 2️⃣ Generate secure download token */
    const token = crypto.randomBytes(32).toString("hex");

    /* 3️⃣ Insert into download_tokens (FINAL DESIGN) */
    db.query(
        `INSERT INTO download_tokens (token, sub_id)
         VALUES (?, ?)`,
        [token, sub_id],
        (err) => {

            if (err) {
                console.error("❌ TOKEN INSERT ERROR:", err);
                return res.json({ success: false });
            }

            /* 4️⃣ Insert payment record (CORRECT COLUMN NAME) */
            db.query(
                `INSERT INTO payments
                (buyer_name, buyer_mobile, subject_name, amount,
                 razorpay_order_id, razorpay_payment_id, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS')`,
                [
                    buyerName,
                    buyerMobile,
                    subject,
                    amount,
                    razorpay_order_id,
                    razorpay_payment_id
                ],
                (payErr) => {
                    if (payErr) {
                        console.error("❌ PAYMENT INSERT ERROR:", payErr);
                        // payment is successful, still allow download
                    }

                    /* 5️⃣ Send token to frontend */
                    res.json({ success: true, token });
                }
            );
        }
    );
});

module.exports = router;
