import express from "express";
import { db } from "./database.js";
import * as dotenv from "dotenv";
dotenv.config();

export const acronym = express.Router();

acronym.all((req, res, next) => {
  if (req.session.userId) next();
  else res.redirect("/user/login");
});

// Create Acronym route
acronym.get("/create", (req, res) => {
  var sql = "SELECT subject_area from akronyms";
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
  const subject = req.body.subject_area;
  const acronym = req.body.acronym.toUpperCase();
  const meaning = req.body.meaning;
  const definition = req.body.definition;
  const other = req.body.other;
  db.query(
    `SELECT * FROM akronyms WHERE acronym = "${acronym}" AND subject_area = "${subject}"`,
    (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
        res.render("create", {
          message: "Acronym already added.",
          loggedin: req.session.userId,
        });
      } else {
        if (other == null) {
          var sql = `INSERT INTO akronyms (acronym, subject_area, author_id, meaning, definition) VALUES 
        ('${acronym}', '${subject}', ${req.session.userId},'${meaning}', '${definition}');`;
        } else {
          var sql = `INSERT INTO akronyms (acronym, subject_area, author_id, meaning, definition) VALUES 
        ('${acronym}', '${other}', ${req.session.userId}, '${meaning}', '${definition}');`;
        }
        db.query(sql, (err, result) => {
          if (err) throw err;
          res.redirect("index");
        });
      }
    }
  );
});

acronym.post("/comment/:acronym", (req, res) => {
  const comment = req.body.comment;
  const acronym_id = req.params.acronym;
  const author_id = req.session.userId;

  const sql = `INSERT INTO comments (acronym_id, author_id, comment) VALUES 
        ('${acronym_id}', '${author_id}', '${comment}');`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.redirect(`/acronym/${acronym_id}`);
  });
});

// Display acronym
acronym.get("/acronym/:id", async (req, res) => {
  const acronymId = req.params.id;

  const queryDb = (sql) => {
    return new Promise((resolve, reject) => {
      db.query(sql, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
 
  try {
    const acronyms = await queryDb(`SELECT * FROM akronyms JOIN users ON users.id = akronyms.author_id WHERE akronyms.id = ${acronymId}`);
    const comments = await queryDb(`SELECT * FROM comments JOIN users ON users.id = comments.author_id WHERE acronym_id = ${acronymId} `);
    res.render("display-acronym", {
      title: acronyms[0]?.acronym,
      result: acronyms,
      comments: comments,
      loggedin: req.session.userId,
    });
  } catch (err) {
    console.error(err);
  }
});

// Search route
acronym.post("/search", (req, res) => {
  const search = req.body.search;
  const loggedin = req.session.userId;
  const sql = `SELECT * FROM akronyms WHERE acronym = '${search}'`;
  db.query(sql, (err, result) => {
    if (err) throw err;
    if (loggedin) {
      res.render("search", {
        title: "Search results",
        searchResult: result,
        loggedin,
      });
    } else {
      res.render("search", {
        title: "Search results",
        searchResult: result,
      });
    }
  });
});
