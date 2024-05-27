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
import { acronym } from './akronym.js';

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
app.use('/user', user);
// Acronym Routes
app.use(acronym);

// Logout route
app.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if(err) throw err;
    })
    res.redirect('/')
});


// Authenticated Index route
app.get('/index', isAuthenticated, (req, res) => {
    var sql = `SELECT * FROM akronyms`;
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
    const sql = `SELECT * FROM akronyms`;
    if (req.session.userId) res.redirect('/index');
    db.query(sql, (err, result) => {
    if (err) throw err;
    res.render('index', {layout:'main',
        title: "Akronym.com",
        searchResult:  result
    });
});
});    

app.get('/about', (req, res) => {
    res.render('about', {title: "About us page"});
});

app.listen(3000, () => {console.log('Server started at port', 3000);});