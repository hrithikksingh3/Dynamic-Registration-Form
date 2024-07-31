//Main final code
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const session = require("express-session");
const path = require("path");

//intialize express application
const app = express();
dotenv.config();

const port = process.env.PORT || 3000;

const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;

mongoose.connect(`mongodb+srv://${username}:${password}@cluster0.b4gw0zf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log("Connected to the database");
});

// Registration schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
});

// Model of user schema
const User = mongoose.model("User", userSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// Serve static pages
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/pages/index.html");
});

app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/pages/login.html");
});

// Registration endpoint
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

         // Check if a user with the given email already exists
         const existingUser = await User.findOne({ email });
        
         if (existingUser) {
             // Email already exists
             return res.render("error", {
                 errorTitle: "Registration Failed",
                 errorMessage: "An account with this email already exists. Please use a different email or log in."
             });
         }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        console.log("New user registered:", { name, email });
        res.redirect("/success");
    } catch (error) {
        console.log("Registration error:", error);
        res.redirect("/error");
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt:", { email });

        const user = await User.findOne({ email });
        console.log("User found:", user);

        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            console.log("Password valid:", isPasswordValid);

            if (isPasswordValid) {
                req.session.user = user; 
                res.redirect("/dashboard"); 
            } else {
                res.render("error", { 
                    errorTitle: "Login Failed", 
                    errorMessage: "Invalid email or password. Please try again." 
                });
            }
        } else {
            res.render("error", { 
                errorTitle: "Login Failed", 
                errorMessage: "Invalid email or password. Please try again." 
            });
        }
    } catch (error) {
        console.log("Login error:", error);
        res.render("error", { 
            errorTitle: "Login Error", 
            errorMessage: "An unexpected error occurred. Please try again later." 
        });
    }
});

// Protected route example (e.g., dashboard)
app.get("/dashboard", (req, res) => {
    if (req.session.user) {
        res.render("dashboard", { user: req.session.user });
    } else {
        res.redirect("/login");
    }
});

// Logout endpoint
app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log("Logout error:", err);
        } else {
            res.redirect("/login");
        }
    });
});

// Success and error pages
app.get("/success", (req, res) => {
    res.sendFile(__dirname + "/pages/success.html");
});

app.get("/error", (req, res) => {
    res.sendFile(__dirname + "/pages/error.html");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

//upto mark (till static dashboard.)