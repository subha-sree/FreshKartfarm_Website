const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "subha@2005",
    database: "freshkartfarm"
});

db.connect((err) => {
    if (err)
        throw err;

    console.log("MySQL Connected");
});

module.exports = db;