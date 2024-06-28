"use strict";

const request = require("supertest");

const db = require("../db.js");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    tokens,
    testProducts,
    testCarts,
    testInteractions
} = require("./_testCommon");
const Cart = require("../models/cart.js");
const { SECRET_KEY } = require("../config.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/***********************************************POST /carts */

describe("POST /carts", function () {
    test("works", async function () {
        const decoded = jwt.verify(tokens[0], SECRET_KEY);

        const resp = await request(app)
            .post(`/carts`)
            .send({
                customerId: decoded.id,
                address: 'test1'
            })
            .set("authorization", `Bearer ${tokens[0]}`);
        const cart = resp.body.cart;

        expect(resp.statusCode).toEqual(200);
        expect(cart.address).toEqual('test1');
    })

    test("doesn't work if not logged in", async function () {
        const decoded = jwt.verify(tokens[0], SECRET_KEY);

        const resp = await request(app)
            .post(`/carts`)
            .send({
                customerId: decoded.id,
                address: 'test1'
            });

        expect(resp.statusCode).toEqual(401);
    })
})

/***********************************************PATCH /carts/:id */

describe("PATCH /carts/:id", function () {
    test("works for owner of cart", async function () {
        const initial = await Cart.get(testCarts[2].id);

        expect(initial.bought).toEqual(false);

        const resp = await request(app)
            .patch(`/carts/${testCarts[0].id}`)
            .set("authorization", `Bearer ${tokens[0]}`);
        const cart = resp.body.cart;

        expect(resp.statusCode).toEqual(200);
        expect(cart.bought).toEqual(true);
    })

    test("doesn't work for other non-admin users", async function () {
        const resp = await request(app)
            .patch(`/carts/${testCarts[0].id}`)
            .set("authorization", `Bearer ${tokens[1]}`);

        expect(resp.statusCode).toEqual(401);
    })
})


