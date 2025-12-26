const express = require("express");
const router = express.Router();
const db = require("../connection");
const path = require("path");
const fs = require("fs");

/* ===============================
   SHOW DOWNLOAD SUCCESS PAGE
================================ */
router.get("/secure-download", (req, res) => {

    const { token } = req.query;
    if (!token) return res.send("Invalid link");

    db.query(
        "SELECT used FROM download_tokens WHERE token = ?",
        [token],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.send("DB error");
            }

            // ❌ Token not found or already expired
            if (result.length === 0 || result[0].used === 1) {
                return res.send("❌ This download link is no longer valid");
            }

            // ✅ Token valid → allow page
            res.render("user/download-success", { token });
        }
    );
});


/* ===============================
   ACTUAL FILE DOWNLOAD
================================ */
router.get("/file", (req, res) => {

    const { token } = req.query;
    if (!token) return res.send("Invalid request");

    const sql = `
        SELECT dt.used, s.pdf_path
        FROM download_tokens dt
        JOIN subjects s ON s.id = dt.sub_id
        WHERE dt.token = ?
    `;

    db.query(sql, [token], (err, result) => {

        if (err) return res.send("DB error");
        if (result.length === 0) return res.send("Invalid token");

        const { used } = result[0];

        // ❌ Already completed
        if (used === 2) {
            return res.send("Download already completed");
        }

        const filePath = require("path").join(
            __dirname,
            "..",
            "private_pdfs",
            result[0].pdf_path
        );

        if (!require("fs").existsSync(filePath)) {
            return res.send("File not found");
        }

        // 1️⃣ Mark as downloading
        db.query(
            "UPDATE download_tokens SET used = 1 WHERE token = ?",
            [token]
        );

        const stream = require("fs").createReadStream(filePath);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=document.pdf"
        );

        stream.pipe(res);

        // 2️⃣ When download completes → lock token
        stream.on("end", () => {
            db.query(
                "UPDATE download_tokens SET used = 2 WHERE token = ?",
                [token]
            );
        });

        // 3️⃣ If connection breaks → allow retry
        res.on("close", () => {
            if (!res.writableEnded) {
                db.query(
                    "UPDATE download_tokens SET used = 0 WHERE token = ?",
                    [token]
                );
            }
        });
    });
});



module.exports = router;
