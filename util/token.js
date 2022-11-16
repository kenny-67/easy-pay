const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "somesecret";
const tokenService = {
  encryptPassword: (password) =>
    new Promise((resolve, reject) => {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          reject(err);
          return false;
        }
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            reject(err);
            return false;
          }
          resolve(hash);
          return true;
        });
      });
    }),
  comparePassword: (password, hash) =>
    new Promise(async (resolve, reject) => {
      try {
        const isMatch = await bcrypt.compare(password, hash);
        resolve(isMatch);
        return true;
      } catch (err) {
        reject(err);
        return false;
      }
    }),

  getToken: (payload) => {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: 604800, // 1 Week
    });
    return token;
  },

  getPayload: (token) => {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return { loggedIn: true, payload };
    } catch (err) {
      // Add Err Message
      return { loggedIn: false };
    }
  },
};

module.exports = tokenService;
