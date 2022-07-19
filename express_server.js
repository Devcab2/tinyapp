const { getUserByEmail, generateRandomString, urlsForUser } = require('./helper_function.js');
const { urlDatabase, users } = require('./objects.js');
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080; //default

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["my-secret-key"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


//Routes...
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(400).send("must log in first");
  }
  const user = users[userID];
  if (!user) {

    return res.status(400).send("Invalid user");
  }
  const urls = urlsForUser(user.id);
  const templateVars = { user: user, urls: urls };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = req.body.user;
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = { user: user };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(403).send("Not logged in");
  }
  const urlID = req.params.id;
  const url = urlDatabase[urlID];
  if (!url) {
    return res.status(403).send("URL does not exist");
  }
  if (url.userID !== userID) {
    return res.status(403).send("Not your URL");
  }
  const templateVars = {
    user: req.body.user,
    id: req.params.id,
    longURL: url.longURL
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  let url = urlDatabase[req.params.id];
  if (!url) {
    return res.status(403).send("URL does not exist");
  }
  res.redirect(url.longURL);
});

app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.render("registration", { user: undefined });
  }
  const user = users[userID];
  if (!user) {
    req.session["user_id"] = undefined;
    return res.render("registration", { user: undefined });
  }
  return res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.render("login");
  }
  const user = users[userID];
  if (!user) {
    req.session["user_id"] = undefined;
    return res.render("login");
  }
  return res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  let userID = req.session.user_id;
  if (!userID) {
    return res.status(403).send("Not logged in...");
  }
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: userID
  };
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(403).send("Not logged in");
  }
  const urlID = req.params.id;
  const url = urlDatabase[urlID];
  if (!url) {
    return res.status(403).send("URL does not exist");
  }
  if (url.userID !== userID) {
    return res.status(403).send("Not your URL");
  }
  delete urlDatabase[urlID];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(403).send("Not logged in");
  }
  const urlID = req.params.id;
  const url = urlDatabase[urlID];
  if (!url) {
    return res.status(403).send("URL does not exist");
  }
  if (url.userID !== userID) {
    return res.status(403).send("Not your URL");
  }
  url.longURL = req.body.newLongURL;
  res.redirect("/urls");
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
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  let user = {
    id: generateRandomString(),
    email: req.body.email,
    password: hashedPassword
  };
  
  users[user.id] = user;
  req.session["user_id"] = user.id;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPass = req.body.password;
  for (let key in users) {
    let user = users[key];
    if (userEmail === user.email && bcrypt.compareSync(userPass, user.password)) {
      req.session["user_id"] = user.id;
      res.redirect("/urls");
      return;
    }
  }
  return res.status(403).send("Email or Password is incorrect");
});

app.post("/logout", (req, res) => {
  req.session["user_id"] = undefined;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening port ${PORT}!`);
});

module.exports = {urlDatabase,};
