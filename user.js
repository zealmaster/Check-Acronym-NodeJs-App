import express from "express";
import * as bcrypt from "bcrypt";
import { db } from "./database.js";

export const user = express.Router();

// Signup page
user.get("/signup", (req, res) => {
  res.render("signup");
});

// Signup server side
user.post("/signup", async (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirm_password;
  if (confirmPassword != password) {
    res.render("signup", { message: "Passwords unmatched." });
  } else {
    db.query(
      `SELECT * FROM users WHERE email = "${email}"`,
      async (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
          res.render("signup", {
            message: `User with email ${result[0].email} exists.`,
          });
        } else {
          const passwordHash = await bcrypt.hash(password, 10);
          const sql = `INSERT INTO users (firstname, lastname, email, password) VALUES ("${firstname}", "${lastname}", "${email}", "${passwordHash}")`;
          db.query(sql, (err, result) => {
            if (err) throw err;
            res.redirect("login");
          });
        }
      }
    );
  }
});

// Login page
user.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

// Login server side
user.post("/login", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const sql = `SELECT * FROM users WHERE email = '${email}'`;
  db.query(sql, async (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      const user = result[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        req.session.userId = user.id;
        req.session.loggedin = true;
        req.session.email = email;
        res.redirect("/index");
      } else {
        res.render("login", { message: "Wrong Password." });
      }
    } else {
      res.render("login", { message: "Email does not exist." });
    }
  });
});
