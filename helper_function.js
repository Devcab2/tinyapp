const {urlDatabase,} = require('./objects.js');

const getUserByEmail = (email, users) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

const generateRandomString = function() {
  const uniqueId = Math.random().toString(36).substr(2, 6);
  return uniqueId;
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

module.exports = { getUserByEmail, generateRandomString, urlsForUser };