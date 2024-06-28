"use strict";

const jsonschema = require('jsonschema');
const express = require('express');
const Product = require('../models/product');
const {BadRequestError} = require('../expressError');
const productNewSchema = require('../schemas/productNewSchema.json');
const productUpdateSchema = require('../schemas/productUpdateSchema.json');
const { ensureLoggedIn, ensureSeller, ensureSellerOrAdmin, ensureCorrectSellerOrAdmin } = require('../middleware/auth');


const router = new express.Router();


/** POST /  { name, description, price, imageUrl, quantity, category, sellerId } =>
 *   { name, description, price, imageUrl, quantity, category, sellerId}
 * 
 * Makes a product
 * 
 * Authorization required: seller
 */

router.post('/', ensureLoggedIn, ensureSeller, async function(req, res, next){
    try{
        const validator = jsonschema.validate(req.body, productNewSchema);
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const product = await Product.create(req.body);
        return res.status(201).json({product});
    } catch(err){
        return next(err);
    }
});


/** GET / => [{id, name, description, price, imageUrl, quantity, category, sellerId, expectedShippingTime, numOfRatings,
 * averageRating }, ...]
 * 
 * Get all products from the database
 * 
 * Authorization required: None
 */

router.get('/', async function(req, res, next){
    try{
        const products = await Product.getAll(req.query); 
        return res.json({products});
    } catch(err){
        return next(err);
    }
});

/** GET /:id => {id, name, description, price, imageUrl, quantity, category, sellerId, numOfRatings, averageRating}
 * 
 * Gets a product from the databse
 * 
 * Authorization required: None
 */

router.get('/:id', async function(req, res, next){
    try{
        const id = req.params.id;
        const product = await Product.get(id);
        return res.json({product});
    } catch(err){
        return next(err);
    }
});


/** PATCH /:id  {fld1, fld2, ... } =>
 *   {product}
 * 
 * Updates product info
 * fields can be name, description, price, imageUrl, quantity, or category
 * 
 * Authorization required: logged in
 */

router.patch('/:id', ensureLoggedIn, async function(req, res, next){
    try{
        const validator = jsonschema.validate(req.body, productUpdateSchema);
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const id = req.params.id;
        const product = await Product.update(id, req.body);
        return res.json({product});
    } catch(err){
        return next(err);
    }
});


/** DELETE /id => { deleted: id }
 * 
 * Deletes product from database
 * 
 * Authorization required: seller of product or admin
 */

router.delete('/:id', ensureLoggedIn, ensureSellerOrAdmin, ensureCorrectSellerOrAdmin, async function(req, res, next){
    try{
        const id = req.params.id;
        await Product.delete(id);
        return res.json({deleted: id});
    } catch(err){
        return next(err);
    }
});


module.exports = router;