"use strict";


const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const userNewSchema = require('../schemas/userNewSchema.json');
const userUpdateSchema = require('../schemas/userUpdateSchema.json');
const {ensureLoggedIn, ensureAdmin, ensureCorrectUserOrAdmin, ensureSeller} = require('../middleware/auth');


const router = new express.Router();


/** {username, password, isSeller, address} => {username, isSeller, address} 
 * 
 * Makes an admin user
 * 
 * Authorization required: admin
*/
router.post('/', ensureAdmin, async function(req, res, next){
    try{
        const validator = jsonschema.validate(req.body, userNewSchema);
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const user = await User.createAdmin(req.body);
        return res.status(201).json({user});

    } catch(err){
        return next(err);
    }
});

/** GET / => 
 *   {users:[{username, isAdmin, isSeller, age, address}, ...]}
 * 
 * Gets all users in the database
 * 
 * Authorization required: None
 */

router.get('/', async function(req, res, next){
    try{
        const users = await User.getAll();
        return res.json({users});
    } catch(err){
        return next(err);
    }
});


/** GET /:username =>
 *   {user: {username, isAdmin, isSeller, age, address}}
 * 
 * Gets a user from the database
 * 
 * Authorization required: None
 */

router.get('/:username', async function(req, res, next){
    try{
        const username = req.params.username;
        const user = await User.get(username);
        return res.json({user});
    } catch(err){
        return next(err);
    }
});

/** GET /:username/products => 
 * 
 * Get available products of a seller
 * 
 * Authorization: logged in, same seller/admin
 */

router.get('/:username/products', ensureLoggedIn, ensureSeller, ensureCorrectUserOrAdmin, async function(req, res, next){
    try{
        const products = await User.getAvailableSellerProducts(req.params.username);
        return res.json({products});
    } catch(err){
        return next(err);
    }
})

/** GET /:username/carts
 * 
 * Get products in a customer's current cart
 * 
 * Authorization: logged in, same user/admin
 */

router.get('/:username/carts/', ensureLoggedIn, ensureCorrectUserOrAdmin, async function(req, res, next){
    try{
        const cartProducts = await User.getCartProducts(req.params.username);
        return res.json({cartProducts});
    } catch(err){
        return next(err);
    }
});

/** GET /:username/interactions/customer => [{id, productId, quantityChosen, cartId, expectedShippingTime}, ...]
 * 
 * Gets past interactions of a customer
 * 
 * Authorization: logged in, same user/admin
 */

router.get('/:username/interactions/customer', ensureLoggedIn, ensureCorrectUserOrAdmin, async function(req, res, next){
    try{
        const interactions = await User.getPastCustomerInteractions(req.params.username);
        return res.json({interactions});
    } catch(err){
        return next(err);
    }
})

/** GET /:username/interactions/seller  => [{id, productId, name, price, imageUrl, description, quantityChosen, cartId, address}, ...]
 * 
 * Gets past interactions of a seller
 * 
 * Authorization: logged in
 */

router.get('/:username/interactions/seller', ensureLoggedIn, ensureCorrectUserOrAdmin, async function(req, res, next){
    try{
        const interactions = await User.getPastSellerInteractions(req.params.username);
        return res.json({interactions});
    } catch(err){
        return next(err);
    }
})

/** GET /:username/interactions/seller/approved  => [{id, productId, name, price, imageUrl, description, quantityChosen, cartId, address}, ...]
 * 
 * Gets the approved interactions of a seller
 * 
 * Authorization: logged in
 */

router.get('/:username/interactions/seller/approved', ensureLoggedIn, ensureCorrectUserOrAdmin, async function(req, res, next){
    try{
        const interactions = await User.getApprovedInteractions(req.params.username);
        return res.json({interactions});
    } catch(err){
        next(err);
    }
})


/** PATCH /username  {fld1, fld2, ...} => {user}
 *  
 * Updates a user's info
 * fields can be username, password, isSeller, age, address
 * 
 * Authorization required: same user or admin
 */

router.patch('/:username', ensureLoggedIn, ensureCorrectUserOrAdmin, async function(req, res, next){
    try{
        const username = req.params.username;
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const user = await User.update(username, req.body);
        return res.json({user});
    } catch(err){
        return next(err);
    }
});


/** DELETE /username => {deleted: username}
 * 
 * Delete a user from database
 * 
 * Authorization required: same user or admin
 */

router.delete('/:username', ensureLoggedIn, ensureCorrectUserOrAdmin, async function(req, res, next){
    try{
        const username = req.params.username;
        await User.delete(username);
        return res.json({deleted: username});
    } catch(err){
        return next(err);
    }
});


module.exports = router;