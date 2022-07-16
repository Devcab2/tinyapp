const { getUserByEmail } = require('./helper_function.js');
const express = require("express");
const cookieParser = require('cookie-parser');
const res = require('express/lib/response');
const app = express();
const PORT = 8080; //default
app.set("view engine", "ejs");

const generateRandomString = function() {
  const uniqueId = Math.random().toString(36).substr(2, 6);
  return uniqueId;
};

app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://ww.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = { user, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = req.body.user;
  res.render("urls_new", user);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: req.body.user,
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.newLongURL;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const user = req.body.user;
  res.render("registration", { user, urls: urlDatabase });
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const foundUser = getUserByEmail(email, users);

  if (email === "" || password === "") {
    return res.status(400).send("error: 400 Bad Request ");
  }
  if (foundUser) {
    return res.status(400).send("error: 400 A user with that email already exists");
  }
  
  let user = {
    id: generateRandomString(),
    email: req.body.email,
    password: req.body.password
  };
  
  users[user.id] = user;
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPass = req.body.password;
  for (let key in users) {
    let user = users[key];
    if (userEmail === user.email && userPass === user.password) {
      res.cookie("user_id", user.id);
      res.redirect("/urls");
      return;
    }
  }
  res.status(403).send("Email or Password is incorrect");

});

app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  }
  res.render("login");
});


app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});