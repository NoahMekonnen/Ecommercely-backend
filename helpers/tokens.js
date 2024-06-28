const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../config');
const User = require("../models/user");

/** Creates a token based on info about the user and given secret key
 * 
 * input: user
 * 
 * returns jwt token
 */
function createToken(user){
    let payload ={
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin || false,
        isSeller: user.isSeller || false
    };

    return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };