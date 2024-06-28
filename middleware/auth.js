"use strict";


const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const Product = require("../models/product");
const User = require("../models/user");
const Cart = require("../models/cart");
const Interaction = require("../models/interaction");

/** Middleware that authenticates user
 * 
 * If a token is given verify it 
 * 
 * Error will be thrown if token is not valid 
*/
function authenticateJWT(req, res, next){
    try{
        const authHeader = req.headers && req.headers.authorization;
        if(authHeader){
            const token = authHeader.replace(/^[Bb]earer /, "").trim();
            res.locals.user = jwt.verify(token, SECRET_KEY);
        }
        return next();
    } catch(err){
        return next(err);
    }
}

/** Middleware that checks if a user is logged in 
 * 
 * Throws UnauthorizedError otherwise
 */
function ensureLoggedIn(req, res, next){
    try{
        if(!res.locals.user) throw new UnauthorizedError();
        return next();
    } catch(err){
        return next(err);
    }
}


/** Middleware that checks if a user is an admin
 * 
 * Throws UnauthorizedError otherwise
 */
function ensureAdmin(req, res, next){
    try{
        if(!res.locals.user.isAdmin) throw new UnauthorizedError();
        return next();
    } catch(err){
        return next(err);
    }
}

/** Middleware that checks if a user is a seller
 * 
 * Throws UnauthorizedError otherwise
 */
function ensureSeller(req, res, next){
    try{
        if(!res.locals.user.isSeller) throw new UnauthorizedError('You must be a seller');
        return next();
    } catch(err){
        return next(err);
    }
}

/** Middleware that checks if a user is a seller or an admin
 * 
 * Throws UnauthorizedError otherwise
 */
function ensureSellerOrAdmin(req, res, next){
    try{
        if(!res.locals.user.isSeller && !res.locals.user.isAdmin) throw new UnauthorizedError("Unauthorized");
        return next();
    } catch(err){
        return next(err);
    }
}

/** Middleware that checks if the logged in user is the right user or if he is an admin
 * 
 * Throws UnauthorizedError otherwise
 */
function ensureCorrectUserOrAdmin(req, res, next){
    try{
        if(!res.locals.user.isAdmin && res.locals.user.username != req.params.username) throw new UnauthorizedError("Unauthorized");
        return next();
    } catch(err){
        return next(err);
    }
}

/** Middleware that ensures that the logged in seller is the correct seller
 * 
 * Throws UnauthorizedError otherwise
 */
async function ensureCorrectSellerOrAdmin(req, res, next){
    try{
        const product = await Product.get(req.params.id)
        const seller = await User.getById(product.sellerId)
        if((res.locals.user.username != seller.username) && !res.locals.user.isAdmin) throw new UnauthorizedError("Unauthorized");
        return next();
    } catch(err){
        return next(err);
    }
}

/** Middleware that ensures that the the logged in user is the owner of the cart
 * 
 * Throws UnauthorizedError otherwise
 */
async function ensureOwnerOfCartOrAdmin(req, res, next){
    try{
        const cart = await Cart.get(req.params.id);
        if(cart.customerId != res.locals.user.id && !res.locals.user.isAdmin) throw new UnauthorizedError("Unauthorized");
        return next();
    } catch(err){
        return next(err);
    }
}

/** Middleware that ensures that the the logged in user is the owner of the interaction
 * 
 * Throws UnauthorizedError otherwise
 */
async function ensureOwnerOfInteractionOrAdmin(req, res, next){
    try{
        const interaction = await Interaction.get(req.params.id);
        const cart = await Cart.get(interaction.cartId);
        if(cart.customerId != res.locals.user.id && !res.locals.user.isAdmin) throw new UnauthorizedError("Unauthorized");
        return next();
    } catch(err){
        return next(err);
    }
}


module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    ensureAdmin,
    ensureSeller,
    ensureSellerOrAdmin,
    ensureCorrectUserOrAdmin,
    ensureCorrectSellerOrAdmin,
    ensureOwnerOfCartOrAdmin,
    ensureOwnerOfInteractionOrAdmin
};

