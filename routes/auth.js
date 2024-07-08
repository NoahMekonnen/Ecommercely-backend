

const { BadRequestError } = require('../expressError');
const { createToken } = require('../helpers/tokens');
const User = require('../models/user');
const express = require("express");
const router = new express.Router();
const jsonschema = require('jsonschema');
const userAuthSchema = require('../schemas/userAuthSchema.json');
const userNewSchema = require('../schemas/userNewSchema.json');
const {SECRET_KEY} = require('../config');

/** POST /token  {username, password} => {token}
 * 
 * Returns JWT token which can be used for other requests
 * 
 * Authorization required: None
 */
router.post('/login', async function(req, res, next){
    try{
        const validator = jsonschema.validate(req.body, userAuthSchema);
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const {username, password} = req.body;
        const user = await User.authenticate(username, password);
        const token = createToken(user);
        res.json({token});
    } catch(err){
        return next(err);
    }
});

/** POST /register {username, password, isSeller, address} => {token}
 * 
 * optional input: address
 * 
 * Authorization required: None
 */
router.post('/register', async function(req, res, next){
    try{
        const validator = jsonschema.validate(req.body, userNewSchema);
        if(!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const user = await User.register(req.body);
        const token = createToken(user);
        res.status(201).json({token});
    } catch(err){
        return next(err);
    }
});



module.exports = router;
