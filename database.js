import express  from 'express';
import  mysql2 from 'mysql2';
import * as dotenv from 'dotenv';
dotenv.config()


export const db = mysql2.createConnection({
    host: process.env.MYSQSL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
});
db.connect((err)=> {
if (err) throw err;
console.log("Connected!")
});
