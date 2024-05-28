import express from "express";
import * as dotenv from "dotenv";
dotenv.config();
import { queryDb } from "./database.js";

export const acronym = express.Router();

function isAuthenticated (req, res, next){
  if (req.session.userId) next();
  else res.redirect("/user/login");
};

// Create Acronym route
acronym.get("/create", isAuthenticated, async (req, res) => {
  const result = await queryDb("SELECT subject_area from akronyms");
  res.render("create", {  
    title: "Create Acronym",
    searchResult: result,
    loggedin: req.session.userId,
  });
});

acronym.post("/create", isAuthenticated, async (req, res) => {
  try {
    const subject = req.body.subject_area;
    const acronym = req.body.acronym.toUpperCase();
    const meaning = req.body.meaning;
    const definition = req.body.definition;
    const other = req.body.other;

    const acronymExists = await queryDb(
      `SELECT * FROM akronyms WHERE acronym = "${acronym}" AND subject_area = "${subject}"`
    );
    if (acronymExists.length > 0) {
      res.render("create", {
        message: "Acronym already added.",
        loggedin: req.session.userId,
      });
    } else {
      if (other == null) {
        await queryDb(`INSERT INTO akronyms (acronym, subject_area, author_id, meaning, definition) VALUES 
            ('${acronym}', '${subject}', ${req.session.userId},'${meaning}', '${definition}')`);
      } else {
        await queryDb(`INSERT INTO akronyms (acronym, subject_area, author_id, meaning, definition) VALUES 
            ('${acronym}', '${other}', ${req.session.userId}, '${meaning}', '${definition}')`);
      }
      res.redirect("index");
    }
  } catch (error) {
    console.log(error);
  }
});

// Add comment to acronym post
acronym.post("/comment/:acronym", isAuthenticated, async (req, res) => {
  try {
    const comment = req.body.comment;
    const acronym_id = req.params.acronym;
    const author_id = req.session.userId;
    const addComment =
      await queryDb(`INSERT INTO comments (acronym_id, author_id, comment) VALUES 
    ('${acronym_id}', '${author_id}', '${comment}');`);
    if (addComment) res.redirect(`/acronym/${acronym_id}`);
  } catch (error) {
    console.log(error);
  }
});

// Display acronym
acronym.get("/acronym/:id", async (req, res) => {
  const acronymId = req.params.id;
  try {
    const acronyms = await queryDb(
      `SELECT * FROM akronyms JOIN users ON users.id = akronyms.author_id WHERE akronyms.id = ${acronymId}`
    );
    const comments = await queryDb(
      `SELECT * FROM comments JOIN users ON users.id = comments.author_id WHERE acronym_id = ${acronymId} `
    );
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
acronym.post("/search", async (req, res) => {
  const search = req.body.search;
  const loggedin = req.session.userId;
  const result = await queryDb(
    `SELECT * FROM akronyms WHERE acronym = '${search}'`
  );
  if (loggedin) {
    if (result.length > 0) {
      res.render("search", {
        title: "Search results",
        searchResult: result,
        loggedin,
      });
    } else {
      res.render("search", {
        message: `No result found for ${search}`,
        loggedin,
      });
    }
  } else {
    if (result.length > 0) {
      res.render("search", {
        title: "Search results",
        searchResult: result,
      });
    } else {
      res.render("search", { message: `No result for ${search} found` });
    }
  }
});
