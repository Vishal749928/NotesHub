const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "noteshub"
});

db.connect((err) => {
    if (err) {
        console.error("❌ MySQL connection failed:", err.message);
    } else {
        console.log("✅ MySQL connected to noteshub database");
    }
});

module.exports = db;
