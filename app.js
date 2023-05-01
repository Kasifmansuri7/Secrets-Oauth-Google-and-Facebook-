require("dotenv").config();
const express = require("express");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = new mongoose.model("user", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});

app
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post((req, res) => {
    const userName = req.body.username;
    const password = req.body.password;

    User.findOne({
      email: userName,
    }).then((rslt) => {
      if (rslt) {
        bcrypt.compare(password, rslt.password).then((result) => {
          if (result === true) {
            res.render("secrets");
          }
        });
      } else {
        console.log("Invalid credential!");
      }
    });
  });

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    bcrypt.hash(req.body.password, saltRounds,  (err, hash)=> {
      const newUser = new User({
        email: req.body.username,
        password: hash,
      });
      newUser.save().then((rslt) => {
        if (rslt) {
          res.render("secrets");
        } else if (!rslt) {
          console.log("There is an error with login!!");
        }
      });
    });
  });

app.listen(3000, () => {
  console.log("The server has started on port 3000.");
});
