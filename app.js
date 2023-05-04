require("dotenv").config();
const express = require("express");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.MY_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("user", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});
//Google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ username: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

//Facebook strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "/oauth2/redirect/facebook",
      state: true,
    },
    function verify(accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ facebookid: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

//*********ROUTES******** */
app.get("/", (req, res) => {
  res.render("home");
});

//Sign In With Google
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  }
);

// // Sign In With Facebook
app.get(
  "/oauth2/redirect/facebook",
  passport.authenticate("facebook", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

//Login Route
app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, (err) => {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    });
  });

//Logout Route
app.get("/logout", (req, res) => {
  req.logout((err) => {
    console.log(err);
  });
  res.redirect("/");
});

//Secrets Route
app.route("/secrets").get((req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

//Register Route
app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    User.register(
      { username: req.body.username },
      req.body.password,
      (err, user) => {
        if (err) {
          console.log(err);
          res.redirect("/register");
        } else {
          passport.authenticate("local")(req, res, () => {
            res.redirect("/secrets");
          });
        }
      }
    );
  });

app.listen(3000, () => {
  console.log("The server has started on port 3000.");
});
