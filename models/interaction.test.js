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
    testCartIds,
    testProductIds,
    testInteractionIds
} = require("./_testCommon");
const { BCRYPT_WORK_FACTOR } = require("../config.js");
const bcrypt = require('bcrypt');
const Interaction = require("./interaction.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const interaction1 = {
    quantityChosen: 10
}

/***********************************************Create */

describe("create", function(){
    test("works", async function(){
        const interaction = await Interaction.create({
            ...interaction1, 
            productId: testProductIds[5], 
            cartId: testCartIds[2]});

        expect(interaction.productId).toEqual(testProductIds[5]);
        expect(interaction.cartId).toEqual(testCartIds[2]);
        expect(interaction.quantityChosen).toEqual(10);
    });

    test("cart not found", async function(){
        try{
            await Interaction.create({
                ...interaction1, 
                productId: testProductIds[5], 
                cartId: -1
            })
        } catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
});

/***********************************************Get */

describe("get", function(){
    test("works", async function(){
        const interaction = await Interaction.get(testInteractionIds[0]);

        expect(interaction.id).toEqual(testInteractionIds[0]);
        expect(interaction.cartId).toEqual(testCartIds[0]);
        expect(interaction.productId).toEqual(testProductIds[0]);
        expect(interaction.quantityChosen).toEqual(1);
    })

    test("interaction doesn't exist", async function(){
        try{
            await Interaction.get(-1);
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
})

/***********************************************Update */

describe("update", function(){
    test("works", async function(){
        const initial = await db.query(`SELECT * FROM interactions WHERE id=${testInteractionIds[0]}`);

        expect(initial.rows[0].seller_approval).toEqual(false);

        await Interaction.update(testInteractionIds[0]);
        const final = await db.query(`SELECT * FROM interactions WHERE id=${testInteractionIds[0]}`);

        expect(final.rows[0].seller_approval).toEqual(true);
    })

    test("interaction doesn't exist", async function(){
        try{
            await Interaction.update(-1);
        } catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
})

/***********************************************Delete */

describe("delete", function(){
    test("works", async function(){
        const interaction = await Interaction.get(testInteractionIds[0]);

        expect(interaction.cartId).toEqual(testCartIds[0]);

        await Interaction.delete(testInteractionIds[0]);
        try{
            await Interaction.get(testInteractionIds[0]);
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })

    test("interaction doesn't exist", async function(){
        try{
            await Interaction.delete(-1);
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
})
