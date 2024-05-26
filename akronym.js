const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
var db = require('./database');
var mysql2 = require('mysql2/promise');
var MySQLStore = require('express-mysql-session');
const app = express();
const dotenv = require('dotenv');
dotenv.config()

// set up express-handlebars
const handlebars = require('express-handlebars');

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

// Database connection
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
    secret: 'secret',   //helps to protect session
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


// Login route
app.get('/login', (req, res) => {
    res.render('login',{title: "Login"});
})

app.post('/login', (req, res) => {
    // if (req.session.loggedin){
    //    return res.redirect('/index')
    // }else{
var email = req.body.email;
var password = req.body.password;
    //}
var sql = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
db.query(sql, (err, result) => {
    if (err) throw err;
    if (result.length > 0){
        const user = result[0];
        req.session.userId = user.id;
        req.session.loggedin = true;
        req.session.email = email;
        res.render('index', {result: result, loggedin: req.session.userId});
    } 
});  
});

// Middleware 
function isAuthenticated(req, res, next){
    if(req.session.userId) next()
    else res.redirect('/login')
}

// Logout route
app.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if(err) throw err;
    })
    
    res.redirect('/')
});


// Authenticated Index route
app.get('/index', isAuthenticated, (req, res) => {

    var sql = `SELECT subj FROM akronym`;
    db.query(sql, (err, result) => {
    if (err) throw err;
    res.render('index', {layout:'main',
        title: "Akronym.com",
        searchResult:  result
    });
});
});
// Home route
app.get('/', (req, res) => {
    var sql = `SELECT subj FROM akronym`;
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


//Sign up route
app.get('/signup', (req, res) => {
    res.render('signup')
});

app.post('/signup', (req, res) => {
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var password = req.body.password;
    // var f_name = `My name is ${firstname}`
    var sql = `INSERT INTO users (firstname, lastname, email, password) VALUES ("${firstname}", "${lastname}", "${email}", "${password}")`;
    db.query(sql, (err, result) => {
        if (err) throw err;
    });
    res.render('signup', {
        title: "Sign up",
    });
});


// Create Acronym route
app.get('/create', isAuthenticated, (req, res) => {
        var sql = 'SELECT subj from akronym';
    db.query(sql, (err, result) => {
        if (err) throw err; 
    res.render('create', {
        title: "Create Acronym",
        searchResult: result
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
    var sql = `INSERT INTO akronym (acronym, subj, meaning, definition) VALUES 
    ('${acronym}', '${subject}', '${meaning}', '${definition}');`
    }
    else{
        var sql = `INSERT INTO akronym (acronym, subj, meaning, definition) VALUES 
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