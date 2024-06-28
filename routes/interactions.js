"use strict";


const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, UnauthorizedError } = require("../expressError");
const Interaction = require('../models/interaction');
const interactionNewSchema = require('../schemas/interactionNewSchema.json');
const { ensureLoggedIn, ensureSeller, ensureOwnerOfCartOrAdmin, ensureOwnerOfInteractionOrAdmin, ensureCorrectSellerOrAdmin } = require('../middleware/auth');
const Product = require("../models/product");
const User = require("../models/user");


const router = new express.Router();


/** POST / {productId, quantityChosen, cartId} =>
 * {id, productId, quantityChosen, cartId}
 * 
 * Adds an item to an existing user's cart
 * 
 * Authorization: logged in
 */

router.post('/', ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, interactionNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const interaction = await Interaction.create(req.body);
        return res.status(201).json({ interaction });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /:id  => {id, productId, quantityChosen, cartId, bought}
 * 
 * Interaction in database gets seller approval
 * 
 * Authorization: logged in, owner of product/ admin 
 */

router.patch('/:id', ensureLoggedIn, async function(req, res, next){
    try{
        const oldInteraction = await Interaction.get(req.params.id);
        const product = await Product.get(oldInteraction.productId);
        const seller = await User.getById(product.sellerId)
        if((res.locals.user.username != seller.username) && !res.locals.user.isAdmin) throw new UnauthorizedError("Unauthorized");
        const interaction = await Interaction.update(req.params.id);
        return res.json({interaction})
    } catch(err){
        return next(err);
    }
})

/** DELETE /id  => {deleted: id} 
 * 
 * Delete an interaction from a cart
 * 
 * Authorization: logged in, owner of cart/admin
 */

router.delete('/:id', ensureLoggedIn, ensureOwnerOfInteractionOrAdmin, async function(req, res, next){
    try{
        await Interaction.delete(req.params.id);
        return res.json({deleted: id});
    } catch(err){
        return next(err);
    }
})


module.exports = router;