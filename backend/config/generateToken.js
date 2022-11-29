const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, "secrate", {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
