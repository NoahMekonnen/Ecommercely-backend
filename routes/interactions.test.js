"use strict";

const request = require("supertest");

const db = require("../db.js");
const User = require("../models/user.js");
const jwt = require("jsonwebtoken");
const app = require("../app.js");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    tokens,
    testProducts,
    testCarts,
    testInteractions
} = require("./_testCommon.js");
const Cart = require("../models/cart.js");
const { SECRET_KEY } = require("../config.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/***********************************************POST /interactions */

describe("POST /interactions", function(){
    test("works if logged in", async function(){
        const resp = await request(app)
                            .post(`/interactions`)
                            .send({
                                productId: testProducts[4].id,
                                quantityChosen: 5,
                                cartId: testCarts[2].id
                            })
                            .set("authorization", `Bearer ${tokens[2]}`);
        const interaction = resp.body.interaction;

        expect(resp.statusCode).toEqual(201);
        expect(interaction.quantityChosen).toEqual(5);
        expect(interaction.productId).toEqual(testProducts[4].id);
        expect(interaction.cartId).toEqual(testCarts[2].id);
    })

    test("doesn't work if not logged in", async function(){
        const resp = await request(app)
                            .post(`/interactions`)
                            .send({
                                productId: testProducts[4].id,
                                quantityChosen: 5,
                                cartId: testCarts[2].id
                            })

        expect(resp.statusCode).toEqual(401);
    })
})

/***********************************************DELETE /interactions/:id */

describe("DELETE /interactions/:id", function(){
    test("works for owner of interaction", async function(){
        const resp = await request(app)
                            .delete(`/interactions/${testInteractions[0].id}`)
                            .set("authorization", `Bearer ${tokens[0]}`);

        expect(resp.statusCode).toEqual(200);
        expect(parseInt(resp.body.deleted)).toEqual(testInteractions[0].id);
    })
})