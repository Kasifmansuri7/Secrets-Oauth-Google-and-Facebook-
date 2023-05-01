require("dotenv").config();
const express = require("express");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(encrypt, {
  secret: process.env.MY_SECRET,
  encryptedFields: ["password"],
}); //User encrypt plugin before creating mongoose model.
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
        if (rslt.password === password) {
          res.render("secrets");
        }
      }
    });
  });

app
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    const newUser = new User({
      email: req.body.username,
      password: req.body.password,
    });
    newUser.save().then((rslt) => {
      if (rslt) {
        res.render("secrets");
      } else if (!rslt) {
        console.log("There is an error with login!!");
      }
    });
  });

app.listen(3000, () => {
  console.log("The server has started on port 3000.");
});
