const express = require("express");
const router = express.Router();
const db = require("../connection");
const path = require("path");
const fs = require("fs");


router.get("/", (req, res) => {
    res.render("user/home.ejs");
});

router.get("/computer", function(req,res){ 
    const sql = "SELECT * FROM subjects";
    db.query(sql, function(err, obj){
        if(err) throw err;
        res.render("user/notes",{sub:obj})
    });
});

router.get("/preview/:id", (req, res) => {
    const id = req.params.id;

    const sql = "SELECT pdf_path, subject_name, price FROM subjects WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.send("DB Error");
        if (result.length === 0) return res.send("PDF not found");

        res.render("user/preview", {
            subject: result[0].subject_name,
            price: result[0].price,
            sub_id: id
 

        });
    });
});

router.get("/preview-pdf/:id", (req, res) => {

    const sql = "SELECT pdf_path FROM subjects WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {

        if (err || result.length === 0) {
            return res.status(404).send("PDF not found");
        }

        const filePath = path.join(
            __dirname,
            "..",
            "private_pdfs",
            result[0].pdf_path
        );

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Accept-Ranges", "bytes");

        fs.createReadStream(filePath).pipe(res);
    });
});


module.exports = router;
