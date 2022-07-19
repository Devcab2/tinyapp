const {urlDatabase,} = require('./objects.js');

/* finds user id
*  compares email to users object
*  if the email exists, returns x user
*  else null
*/

const getUserByEmail = (email, users) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

/*  6 digit random Alphanumeric number generator
    returns our new uniqueId
*/

const generateRandomString = function() {
  const uniqueId = Math.random().toString(36).substr(2, 6);
  return uniqueId;
};

/* Get all urls for user
*  @params id: string
*  @returns urldatabase[]
*/
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