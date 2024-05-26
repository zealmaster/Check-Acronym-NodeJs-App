import express from "express";
import { db } from "./database.js";
import * as dotenv from "dotenv";
dotenv.config();

export const acronym = express.Router();

acronym.all((req, res, next) => {
  if (req.session.userId) next();
  else res.redirect("/user/login");
});

// Search route
acronym.post("/search", (req, res) => {
  var search = req.body.search;
  var sql = `SELECT * FROM akronym WHERE acronym = '${search}'`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("search", {
      title: "Search results",
      searchResult: result,
    });
  });
});

// Create Acronym route
acronym.get("/create",  (req, res) => {
  var sql = "SELECT subject_area from akronym";
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("create", {
      title: "Create Acronym",
      searchResult: result,
      loggedin: req.session.userId,
    });
  });
});

acronym.post("/create", (req, res) => {
  var subject = req.body.subject;
  var acronym = req.body.acronym.toUpperCase();
  var meaning = req.body.meaning;
  var definition = req.body.definition;
  var other = req.body.other;
  if (other == null) {
    var sql = `INSERT INTO akronym (acronym, subject_area, meaning, definition) VALUES 
    ('${acronym}', '${subject}', '${meaning}', '${definition}');`;
  } else {
    var sql = `INSERT INTO akronym (acronym, subject_area, meaning, definition) VALUES 
    ('${acronym}', '${other}', '${meaning}', '${definition}');`;
  }
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.render("create", {
      layout: "main",
      msg: "Your acronym was submitted!",
    });
  });
});

// Display acronym
acronym.get("/acronym/:id", (req, res) => {
  const acronymId = req.params.id;
  var sql = `SELECT * FROM akronym WHERE id = ${acronymId}`;
  db.query(sql, (err, result) => {
    console.log(result);
    if (err) throw err;
    res.render("display-acronym", {
      title: result.acronym,
      acronym: result,
    });
  });
});
