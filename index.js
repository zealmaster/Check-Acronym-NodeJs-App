import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import mysql2 from 'mysql2/promise';
import { initializeDatabase } from './database.js';
import handlebars from 'express-handlebars'
import MySQLStore from 'express-mysql-session';
import * as dotenv from 'dotenv';
import {user} from './user.js'
import { acronym } from './akronym.js';
import { queryDb } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import Dayjs  from 'dayjs';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

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
export function isAuthenticated(req, res, next) {
    try {
        if(req.session.userId) {
            next()
        } else res.redirect('/user/login')
    
    } catch (error) {
        console.log(error)
    }
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
    res.clearCookie('SESSION_ID');
    res.redirect('/')
});


// Authenticated Index route
app.get('/index', isAuthenticated, async (req, res) => {
    const result = await queryDb(`SELECT * FROM akronyms ORDER BY acronym ASC`);
    res.render('index', {layout:'main',
        title: "Akronym.com",
        searchResult:  result,
        loggedin: req.session.userId
    });
});

// Home route
app.get('/', async (req, res) => {
    const result = await queryDb(`SELECT * FROM akronyms ORDER BY acronym ASC`);
    if (req.session.userId) res.redirect('/index');
    res.render('index', {layout:'main',
        title: "Akronym.com",
        searchResult:  result
    });
});  

app.get('/about', (req, res) => {
    res.render('about', {title: "About us page", loggedin: req.session.userId});
});

// View a user profile
app.get('/profile/:user', isAuthenticated, async (req, res) => {
    const userId = req.params.user;
    const user = await queryDb(`SELECT * FROM users WHERE id = ${userId}`);
    let _user;
    for (const value of user) {
        _user = value;
    }
    _user.created_at = new Dayjs(_user.created_at).format('D MMMM, YYYY');
    const acronyms = await queryDb(`SELECT * FROM akronyms WHERE author_id = ${userId} ORDER BY acronym ASC`);
    const acronymCount = acronyms.length;
    res.render('view-profile', {_user, acronyms, loggedin: req.session.userId, acronymCount});
})

app.listen(port, () => {console.log('Server started at port', port);});