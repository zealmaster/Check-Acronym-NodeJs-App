import express from "express";
import * as bcrypt from "bcrypt";
import { queryDb } from "./database.js";
import { isAuthenticated } from "./index.js";
import methodOverride from 'method-override';

export const user = express.Router();
user.use(methodOverride('_method'));

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
  try {
    if (confirmPassword != password) {
      res.render("signup", { message: "Passwords unmatched." });
    } else {
      const emailExist = await queryDb(
        `SELECT * FROM users WHERE email = "${email}"`
      );
      console.log(emailExist);
      if (emailExist.length > 0) {
        res.render("signup", {
          message: `User with email ${emailExist[0].email} exists.`,
        });
      } else {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await queryDb(
          `INSERT INTO users (firstname, lastname, email, password) VALUES ("${firstname}", "${lastname}", "${email}", "${passwordHash}")`
        );
        if (user) res.redirect("login");
      }
    }
  } catch (error) {
    console.log(error);
  }
});

user.put("/edit-profile", isAuthenticated, async (req, res) => {
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const password = req.body.password;
  try {
    const userExist = await queryDb(
      `SELECT * FROM users WHERE id = "${req.session.userId}"`
    );
    if (userExist.length > 0) {
      let user;
      if ((password === "")) {
        user = await queryDb(
          `INSERT INTO users (firstname, lastname) VALUES ("${firstname}", "${lastname}")`
        );
        if (user) {
          res.redirect("login");
        }
      } else {
        const passwordHash = await bcrypt.hash(password, 10);
        user = await queryDb(
          `INSERT INTO users (firstname, lastname, password) VALUES ("${firstname}", "${lastname}", "${passwordHash}")`
        );
        if (user) {
          req.session.destroy();
          res.redirect("login");
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
});

// Login page
user.get("/login", (req, res) => {
  if (req.session.userId) {
    res.redirect("/index");
  } else {
    res.render("login", { title: "Login" });
  }
});

// Login server side
user.post("/login", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const result = await queryDb(
      `SELECT * FROM users WHERE email = '${email}'`
    );
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
  } catch (error) {
    console.log(error);
  }
});

user.get("/profile", async (req, res) => {
  const loggedin = req.session.userId;
  const user = await queryDb(`SELECT * FROM users WHERE id = ${loggedin}`);
  const userAcronyms = await queryDb(
    `SELECT * FROM akronyms WHERE author_id = ${loggedin}`
  );
  const userComment = await queryDb(
    `SELECT *  FROM comments WHERE author_id = ${loggedin}`
  );
  const totalAcronyms = userAcronyms.length;
  const totalComments = userComment.length;
  res.render("profile", {
    loggedin,
    user,
    userAcronyms,
    userComment,
    totalAcronyms,
    totalComments,
  });
});
