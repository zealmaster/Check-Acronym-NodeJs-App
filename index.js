import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import mysql2 from 'mysql2/promise';
import { initializeDatabase } from './database.js';
import handlebars from 'express-handlebars'
import MySQLStore from 'express-mysql-session';
const app = express();
import * as dotenv from 'dotenv';
dotenv.config()
import {user} from './user.js'
import { acronym } from './akronym.js';
import { queryDb } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Initialize database
initializeDatabase().catch((err) => console.error(err));

// session and session storage
const options = {
    host: process.env.MYSQSL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
}
const connection = mysql2.createPool(options);

var sessionStore = new MySQLStore({}, connection);
sessionStore.close();

app.use(session({
    name: 'SESSION_ID',
    secret: process.env.SESSION_SECRET, 
    store: sessionStore,
    cookie: {
        maxAge: 30 * 85400000, // 30 * (24*60*60*1000) = 30 * 86400000 => session is stored 30 days
    },
    resave: false,
    saveUninitialized: false
}));

// Middlewares
app.use(express.json());
app.use(flash());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static('public'));

//Include urlencoded middleware
app.use(express.urlencoded({extended: true}));

// view engine configuration
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

// Custom Middlewares
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
    res.clearCookie()
    res.redirect('/')
});


// Authenticated Index route
app.get('/index', isAuthenticated, async (req, res) => {
    const result = await queryDb(`SELECT * FROM akronyms`);
    res.render('index', {layout:'main',
        title: "Akronym.com",
        searchResult:  result,
        loggedin: req.session.userId
    });
});

// Home route
app.get('/', async (req, res) => {
    const result = await queryDb(`SELECT * FROM akronyms`);
    if (req.session.userId) res.redirect('/index');
    res.render('index', {layout:'main',
        title: "Akronym.com",
        searchResult:  result
    });
});  

app.get('/about', (req, res) => {
    res.render('about', {title: "About us page"});
});

app.listen(3000, () => {console.log('Server started at port', 3000);});