const { getUserByEmail } = require('./helper_function.js');
const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; //default
const bcrypt = require("bcryptjs");
app.set("view engine", "ejs");

const generateRandomString = function() {
  const uniqueId = Math.random().toString(36).substr(2, 6);
  return uniqueId;
};

app.use(express.urlencoded({ extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://ww.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
  },
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

const urlsForUser = (id) => {
  const urls = {};
  for (let key in urlDatabase) {
    const url = urlDatabase[key];
    if (url.userID === id) {
      urls[key] = url;
    }
  }
  return urls;
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
  const userID = req.cookies["user_id"];
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
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } else {
    const templateVars = { user: user };
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  let userID = req.cookies["user_id"];
  if (!userID) {
    return res.status(403).send("Not logged in...");
  }
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: userID
  };
  res.redirect(`/urls/${id}`);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.cookies["user_id"];
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

app.post("/urls/:id/delete", (req, res) => {
  const userID = req.cookies["user_id"];
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
  const userID = req.cookies["user_id"];
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

app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"];
  if (!userID) {
    return res.render("registration", { user: undefined });
  }
  const user = users[userID];
  if (!user) {
    res.clearCookie("user_id");
    return res.render("registration", { user: undefined });
  }
  return res.redirect("/urls");
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
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPass = req.body.password;
  for (let key in users) {
    let user = users[key];
    if (userEmail === user.email && bcrypt.compareSync(userPass, user.password)) {
      res.cookie("user_id", user.id);
      res.redirect("/urls");
      return;
    }
  }
  return res.status(403).send("Email or Password is incorrect");
});

app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
  if (!userID) {
    return res.render("login");
  }
  const user = users[userID];
  if (!user) {
    res.clearCookie("user_id");
    return res.render("login");
  }
  return res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});