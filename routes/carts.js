const express = require('express');

const Cart = require('../models/cart');
const Interaction = require('../models/interaction');
const jsonschema = require('jsonschema');
const cartNewSchema = require('../schemas/cartNewSchema');
const InteractionNewSchema = require('../schemas/interactionNewSchema');
const { BadRequestError } = require('../expressError');
const {ensureLoggedIn, ensureSeller, ensureOwnerOfCart, ensureCorrectSellerOrAdmin, ensureSellerOrAdmin, ensureCorrectUserOrAdmin, ensureOwnerOfCartOrAdmin} = require('../middleware/auth');
const db = require('../db');
const stripe = require("stripe")("sk_test_51PLY26KdeqAv3N7XdWwkEqaV9bt85QVwj52cCJP62qflrnKwIEbFULlapZlIp13OLNPuN0ZrPAI6rXjYkI4zDeaz001jAwf7TG");

const router = express.Router();


/** POST / {customerId, address} =>
 * {id, timestamp, address}
 * 
 * Makes a cart
 * 
 * Authorization required: logged in, seller
 */

router.post('/', ensureLoggedIn, async function(req, res, next){
    try{
        const cart = await Cart.create(req.body)
        return res.json({cart})
    } catch(err){
        return next(err)
    }
});


/** PATCH /id  => {id, customerId, timestamp, bought}
 * 
 * Changes status of cart to bought
 * 
 * Authorization: logged in, same seller/admin
 */

router.patch('/:id', ensureLoggedIn, ensureOwnerOfCartOrAdmin, async function(req, res, next){
    try{
        const cart = await Cart.buy(req.params.id);
        return res.json({cart});
    } catch(err){
        return next(err);
    }
});


/** POST /create-checkout-session {products} => {id}
 * 
 * Makes a checkout session and redirects to one of the redirect urls upon completion
 * 
 * Authorization: logged in
 */

router.post('/create-checkout-session', ensureLoggedIn, async function(req, res, next){
    try{
    const {products} = req.body;
    const lineItems = products.map(product =>({
        price_data:{
            currency:"usd",
            product_data:{
                name: product.name,
                images:[product.imageUrl]
            },
            unit_amount: product.price * 100
        },
        quantity: product.quantityChosen
    }))

    const session = await stripe.checkout.sessions.create({
        payment_method_types:["card"],
        line_items: lineItems,
        mode: "payment",
        success_url:"http://ecommercely-frontend.onrender.com/success",
        cancel_url:"http://ecommercely-frontend.onrender.com/cancel"
    })

    return res.status(201).json({id:session.id})
} catch(err){
    return next(err)
}
});


module.exports = router;