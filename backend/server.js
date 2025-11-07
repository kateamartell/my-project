import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const users = [];
const comments = [];

users.push({ username: "demo_user", password: "password123" });
users.push({ username: "test_user", password: "test123" });

// Middleware
app.engine("hbs", engine({ extname: ".hbs", defaultLayout: "main"}));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'public')));

app.use(session({
    secret: "insecuresecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

function requireLogin(req, res, next){
    if (!req.session.isLoggedIn){
        return res.redirect("/login");
    }
    next();
}

app.get("/", (req, res) => {
    let user = {
        name: "Guest",
        isLoggedIn: false,
        loginTime: null,
        visitCount: 0
    };
    
    if (req.session.isLoggedIn) {
        user = {
            name: req.session.username,
            isLoggedIn: true,
            loginTime: req.session.loginTime,
            visitCount: req.session.visitCount || 0
        };
        
        req.session.visitCount = (req.session.visitCount || 0) + 1;
    }
    
    res.render("home", { user: user });
});

app.get("/register", (req,res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const {username, password} = req.body;

    if (users.find(u => u.username === username)){
        return res.render("register", {error: "Username already taken"});
    }
    users.push({username, password});
    
    req.session.isLoggedIn = true;
    req.session.username = username;
    req.session.loginTime = new Date().toISOString();
    req.session.visitCount = 0;
    
    res.redirect("/");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    const {username, password} = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (!user){
        return res.render("login", {error: "Invalid Login"});
    }
    
    req.session.isLoggedIn = true;
    req.session.username = username;
    req.session.loginTime = new Date().toISOString();
    req.session.visitCount = 0;
    
    res.redirect("/");
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.get("/comments", (req, res) => {
    let user = {
        name: "Guest",
        isLoggedIn: false
    };
    
    if (req.session.isLoggedIn) {
        user = {
            name: req.session.username,
            isLoggedIn: true,
            loginTime: req.session.loginTime,
            visitCount: req.session.visitCount || 0
        };
    }
    
    res.render("comments", { user: user, comments: comments });
});

app.get("/comment/new", requireLogin, (req, res) => {
    const user = {
        name: req.session.username,
        isLoggedIn: true,
        loginTime: req.session.loginTime,
        visitCount: req.session.visitCount || 0
    };
    
    res.render("newComment", { user: user });
});

app.post("/comment", requireLogin, (req, res) => {
    const {text} = req.body;
    comments.push({
        author: req.session.username,
        text,
        createdAt: new Date()
    });
    res.redirect("/comments");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});