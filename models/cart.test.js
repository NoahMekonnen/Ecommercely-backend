"use strict";

const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
const Product = require("./product.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testInteractionIds,
    testCartIds,
    testProductIds
} = require("./_testCommon");
const { BCRYPT_WORK_FACTOR } = require("../config.js");
const bcrypt = require('bcrypt');
const Cart = require("./cart.js");
const Interaction = require("./interaction.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const cart1 = {
    address: "test1"
}

/***********************************************Create */

describe("create", function(){
    test("works", async function(){
        const s2 = await User.get('s2');
        const cart = await Cart.create({
            ...cart1,
            customerId: s2.id
        });

        const checkCart = await db.query(`SELECT * FROM carts WHERE customer_id=${s2.id}`);

        expect(checkCart.rows[0].id).toEqual(cart.id);
    });

    test("make more than one cart", async function(){
        const c1 = await User.get('c1');
        try{
            await Cart.create({
                ...cart1,
                customerId: c1.id
            });
        } catch(err){
            expect(err instanceof BadRequestError);
        }
    })
});

/***********************************************Get */

describe("get", function(){
    test("works", async function(){
        const c1 = await User.get('c1');
        const res = await db.query(`SELECT * FROM carts WHERE customer_id=${c1.id}`);
        const id = res.rows[0].id;
        const cart = await Cart.get(id);

        expect(cart.id).toEqual(id);
        expect(cart.bought).toEqual(false);
    });
    test("cart doesn't exist", async function(){
        try{
            await Cart.get(-1);
        } catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
})

/***********************************************CompleteInteraction */

describe("completeInteraction", function(){
    test("works", async function(){
        const initial = await db.query(`SELECT * FROM interactions WHERE id=${testInteractionIds[0]}`);

        expect(initial.rows[0].bought).toEqual(false);

        await Cart.completeInteraction(testInteractionIds[0]);
        const final = await db.query(`SELECT * FROM interactions WHERE id=${testInteractionIds[0]}`);

        expect(final.rows[0].bought).toEqual(true);
    })
    
    test("interaction not found", async function(){
        try{
            await Cart.completeInteraction(-1);
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
})

/***********************************************Buy */

describe("buy", function(){
    test("works", async function(){
        const initial = await db.query(`SELECT * FROM carts WHERE id=${testCartIds[0]}`);

        expect(initial.rows[0].bought).toEqual(false);

        await Cart.buy(testCartIds[0]);
        const final = await db.query(`SELECT * FROM carts WHERE id=${testCartIds[0]}`);

        expect(final.rows[0].bought).toEqual(true);
    })

    test("cart doesn't exist", async function(){
        try{    
            await Cart.buy(-1);
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
})