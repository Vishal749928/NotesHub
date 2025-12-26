const express = require("express");
const router = express.Router();
const db = require("../connection");
const path = require("path");
const crypto = require("crypto");

router.get("/",function(req,res){
    res.render("admin/dashboard")
})

router.get("/computer",function(req,res){
     db.query("SELECT * FROM subjects ORDER BY id DESC", (err, result) => {
        if (err) return res.send("DB error");
    res.render("admin/computer", { subjects: result })
})

});


// router.post("/add-subject", (req, res) => {

//     const { subject_name, subtitle, semester, price } = req.body;

//     // 🔒 Validate PDF
//     if (!req.files || !req.files.pdf) {
//         return res.send("PDF is required");
//     }

//     const pdf = req.files.pdf;

//     if (pdf.mimetype !== "application/pdf") {
//         return res.send("Only PDF files allowed");
//     }

//     // 📝 Create unique filename
//     const fileName = Date.now() + "_" + req.body.subtitle;

//     // 📁 Upload location
    
//     const uploadPath = path.join(__dirname,  "../private_pdfs", fileName);

//     // ⬆️ Move PDF
//     pdf.mv(uploadPath, (err) => {
//         if (err) {
//             console.error(err);
//             return res.send("PDF upload failed");
//         }

//         // 💾 Save data in database
//         const sql = `
//             INSERT INTO subjects
//             (subject_name, subtitle, semester, price, pdf_path)
//             VALUES (?, ?, ?, ?, ?)
//         `;

//         db.query(
//             sql,
//             [
//                 subject_name,
//                 subtitle,
//                 semester,
//                 price,
//                 fileName
//             ],
//             (err) => {
//                 if (err) {
//                     console.error(err);
//                     return res.send("Database insert failed");
//                 }

//                 // ✅ SUCCESS
//                 res.redirect("/admin/computer");
//             }
//         );
//     });
// });


router.post("/add-subject", (req, res) => {

    const { subject_name, subtitle, semester, price } = req.body;

    if (!req.files || !req.files.pdf) {
        return res.send("PDF required");
    }

    const pdf = req.files.pdf;

    // ✅ MIME check
    if (pdf.mimetype !== "application/pdf") {
        return res.send("Only PDF allowed");
    }

    // ✅ FORCE .pdf filename
    const fileName = crypto.randomBytes(16).toString("hex") + ".pdf";

    const uploadPath = path.join(
        __dirname,
        "..",
        "private_pdfs",
        fileName
    );

    pdf.mv(uploadPath, (err) => {
        if (err) return res.send("Upload failed");

        // ✅ Save filename WITH .pdf
        db.query(
            `INSERT INTO subjects
             (subject_name, subtitle, semester, price, pdf_path)
             VALUES (?, ?, ?, ?, ?)`,
            [subject_name, subtitle, semester, price, fileName],
            () => res.redirect("/computer")
        );
    });
});


module.exports = router;
