"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Product = require("../models/product");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    tokens,
    testProducts
} = require("./_testCommon");
const { SECRET_KEY } = require("../config.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const product1 = {
    name: "test",
    description: "test",
    quantity: 1,
    price: 1,
    imageUrl: 'test.png',
    expectedShippingTime: 1
}

/***********************************************POST /products */

describe("POST /products", function () {
    test("works for seller", async function () {

        const decoded = jwt.verify(tokens[2], SECRET_KEY)

        const resp = await request(app)
            .post('/products')
            .send({
                ...product1,
                sellerId: decoded.id
            }).set("authorization", `Bearer ${tokens[2]}`);
        const product = resp.body.product;

        expect(resp.statusCode).toEqual(201);
        expect(product.name).toEqual("test");

    })

    test("doesn't work if not seller", async function(){
        
        const decoded = jwt.verify(tokens[0], SECRET_KEY);

        const resp = await request(app)
                            .post('/products')
                            .send({
                                ...product1,
                                sellerId: decoded.id
                            })
                            .set("authorization", `Bearer ${tokens[0]}`);
        const product = resp.body.product;

        expect(resp.statusCode).toEqual(401);
        expect(product).toEqual(undefined);
    })

    test("doesn't work if not logged in", async function(){
        const decoded = jwt.verify(tokens[0], SECRET_KEY);

        const resp = await request(app)
                            .post('/products')
                            .send({
                                ...product1,
                                sellerId: decoded.id
                            });
        const product = resp.body.product;

        expect(resp.statusCode).toEqual(401);
        expect(product).toEqual(undefined);
    })
})


/***********************************************GET /products */

describe("GET /products", function(){
    test("works. no filter", async function(){
        const resp = await request(app)
                            .get('/products');
        const products = resp.body.products;

        expect(resp.statusCode).toEqual(200);
        expect(products.length).toEqual(5);
        expect(products[0].name).toEqual("brown scapular");
        expect(products[1].name).toEqual("miraculous medal");
        expect(products[2].name).toEqual("green scapular");
        expect(products[3].name).toEqual("bible");
        expect(products[4].name).toEqual("great gatsby")
    })

    test("works. with filter", async function(){
        const resp = await request(app)
                            .get('/products')
                            .query({ str: 'scapular'});
        const products = resp.body.products;

        expect(resp.statusCode).toEqual(200);        expect(products.length).toEqual(2);
        expect(products[0].name).toEqual("brown scapular");
        expect(products[1].name).toEqual("green scapular");    
    })
})

/***********************************************GET /products/:id */

describe("GET /products/:id", function(){
    test("works", async function(){
        const resp = await request(app)
                            .get(`/products/${testProducts[0].id}`);
        const product = resp.body.product;

        expect(resp.statusCode).toEqual(200);
        expect(product.name).toEqual("brown scapular");
    })
})

/***********************************************PATCH /products/:id */

describe("PATCH /products/:id", function(){
    test("works for seller of product", async function(){
        const resp = await request(app)
                            .patch(`/products/${testProducts[0].id}`)
                            .send({
                                name: "new brown scapular"
                            })
                            .set("authorization", `Bearer ${tokens[2]}`);

        const product = resp.body.product;

        expect(resp.statusCode).toEqual(200);
        expect(product.name).toEqual("new brown scapular");
    })

    test("doesn't work for anon", async function(){
        const resp = await request(app)
                            .patch(`/products/${testProducts[0].id}`)
                            .send({
                                name: "new brown scapular"
                            })
        
        expect(resp.statusCode).toEqual(401);
    })
})

/***********************************************DELETE /products/:id */

describe("DELETE /products/:id", function(){
    test("works for seller of product", async function(){
        const resp = await request(app)
                            .delete(`/products/${testProducts[0].id}`)
                            .set("authorization", `Bearer ${tokens[2]}`);

        expect(resp.statusCode).toEqual(200);
        expect(parseInt(resp.body.deleted)).toEqual(testProducts[0].id);
    })

    test("doesn't work for anon", async function(){
        const resp = await request(app)
                            .delete(`/products/${testProducts[0].id}`)
        
        expect(resp.statusCode).toEqual(401);
    })
})