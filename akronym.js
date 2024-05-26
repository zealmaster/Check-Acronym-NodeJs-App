import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import mysql2 from 'mysql2/promise';
import { db } from './database.js';
import handlebars from 'express-handlebars'
import MySQLStore from 'express-mysql-session';
const app = express();
import * as dotenv from 'dotenv';
dotenv.config()
import {user} from './user.js'

//Create custom helper
const hbs = handlebars.create({
defaultLayout: 'main',
helpers: {
calculation: function(value){
    return value + 7;
},

list: function(value, options){
    return"<h2>" + options.fn({test: value}) + "</h2>";
}
}
});

var options = {
    host: process.env.MYSQSL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
}
var connection = mysql2.createPool(options);

// session and session storage
var sessionStore = new MySQLStore({}, connection);
sessionStore.close();

app.use(session({
    name: 'SESSION_ID', // cookie name stored in the web browser
    secret: process.env.SESSION_SECRET,   //helps to protect session
    store: sessionStore,
    cookie: {
        maxAge: 30 * 85400000, // 30 * (24*60*60*1000) = 30 * 86400000 => session is stored 30 days
    },
    resave: false,
    saveUninitialized: false
}));

app.use(express.json());
app.use(flash());

//Include urlencoded middleware
app.use(express.urlencoded({extended: true}));
app.engine('handlebars', hbs.engine);

// app.engine('handlebars', handlebars.engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('views', './views');

// Middleware 
function isAuthenticated(req, res, next){
    if(req.session.userId) next()
    else res.redirect('/user/login')
}

// User Routes
app.use('/user', user)

// Logout route
app.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if(err) throw err;
    })
    res.redirect('/')
});


// Authenticated Index route
app.get('/index', isAuthenticated, (req, res) => {

    var sql = `SELECT subject_area FROM akronym`;
    db.query(sql, (err, result) => {
    if (err) throw err;
    res.render('index', {layout:'main',
        title: "Akronym.com",
        searchResult:  result,
        loggedin: req.session.userId
    });
});
});

// Home route
app.get('/', (req, res) => {
    const sql = `SELECT subject_area FROM akronym`;
    if (req.session.userId) res.redirect('/index');
    db.query(sql, (err, result) => {
    if (err) throw err;
    res.render('index', {layout:'main',
        title: "Akronym.com",
        searchResult:  result
    });
});
});    


// Search route
app.post('/search', (req, res) => {
    var search = req.body.search;
var sql = `SELECT * FROM akronym WHERE acronym = '${search}'`;
db.query(sql, (err, result) => {
    if (err) throw err;
    res.render('search', {
        title: "Search results",
        searchResult:  result
    });
});
});
app.get('/about', (req, res) => {
    res.render('about', {title: "About us page"});
});

// Create Acronym route
app.get('/create', isAuthenticated, (req, res) => {
        var sql = 'SELECT subject_area from akronym';
    db.query(sql, (err, result) => {
        if (err) throw err; 
    res.render('create', {
        title: "Create Acronym",
        searchResult: result,
        loggedin: req.session.userId
    });
    });
});

app.post('/create', isAuthenticated, (req, res) => {
    var subject = req.body.subject;
    var acronym =  req.body.acronym.toUpperCase();
    var meaning =  req.body.meaning;
    var definition =  req.body.definition;
    var other = req.body.other
    if (other==null) {
    var sql = `INSERT INTO akronym (acronym, subject_area, meaning, definition) VALUES 
    ('${acronym}', '${subject}', '${meaning}', '${definition}');`
    }
    else{
        var sql = `INSERT INTO akronym (acronym, subject_area, meaning, definition) VALUES 
    ('${acronym}', '${other}', '${meaning}', '${definition}');`
    }
    db.query(sql, (err, result) =>{
        if (err) throw err;
        res.render('create', {layout: 'main',
            msg: 'Your acronym was submitted!'
        })
    });
});

// Show Profile
app.get('/profile', isAuthenticated, (req, res) => {
    var sql = `SELECT * FROM users WHERE id = ${req.session.userId}`;
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.render('profile', {
            title: 'Profile page',
            user: result
        })
    });
})

// Display acronym
app.get('/acronym/:id', (req, res) => {
    const acronymId = req.params.id;
    var sql = `SELECT * FROM akronym WHERE id = ${acronymId}`
    db.query(sql, (err, result) => {
        console.log(result)
        if (err) throw err;
        res.render('display-acronym', {
            title: result.acronym, acronym: result
        });
    })
});

app.listen(3000, () => {console.log('Server started at port', 3000);});