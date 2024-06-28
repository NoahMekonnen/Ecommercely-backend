"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  tokens,
  testProducts
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/***********************************************GET /users */

describe("GET /users", function(){
    test("works", async function(){
        const resp = await request(app)
                    .get('/users');
        const users = resp.body.users;
        
        expect(resp.statusCode).toEqual(200);
        expect(users.length).toEqual(4);
        expect(users[0].username).toEqual('c1');
        expect(users[1].username).toEqual('c2');
        expect(users[2].username).toEqual('s1');
        expect(users[3].username).toEqual('s2');


    })
})

/***********************************************GET /users/:username */

describe("GET /users/:username", function(){
    test("works", async function(){
        const resp = await request(app)
                        .get('/users/c1');
        const user = resp.body.user;

        expect(user.username).toEqual('c1');
        expect(user.isAdmin).toEqual(false);
        expect(user.isSeller).toEqual(false);
        expect(user.age).toEqual(null);
    })
})

/***********************************************GET /users/:username/products */

describe("GET /users/:username/products", function(){
    test("works for seller of products", async function(){
        const resp = await request(app)
                        .get('/users/s1/products')
                        .set("authorization", `Bearer ${tokens[2]}`);
        const products = resp.body.products;

        expect(resp.status).toEqual(200);
        expect(products.length).toEqual(2);
        expect(products[0].name).toEqual("brown scapular");
        expect(products[1].name).toEqual("miraculous medal");

    })

    test("doesn't work for anon", async function(){
        const resp = await request(app)
                        .get('/users/s1/products');

        expect(resp.statusCode).toEqual(401)
    })
})

/***********************************************GET /users/:username/interactions/customer */

describe("GET /users/:username/interactions/customer", function(){
    test("works for person with past interactions", async function(){
        const resp = await request(app)
                            .get(`/users/c1/interactions/customer`)
                            .set("authorization", `Bearer ${tokens[0]}`);
        const interactions = resp.body.interactions;

        expect(resp.statusCode).toEqual(200);
        expect(interactions.length).toEqual(2);
        expect(interactions[0].name).toEqual('brown scapular');
        expect(interactions[1].name).toEqual('miraculous medal');
    })

    test("doesn't work for other non-admin users", async function(){
        const resp = await request(app)
                            .get(`/users/c1/interactions/customer`)
                            .set("authorization", `Bearer ${tokens[1]}`);

        expect(resp.statusCode).toEqual(401);
    })
});

/***********************************************GET /users/:username/interactions/seller */

describe("GET /users/:username/interactions/seller", function(){
    test("works for seller of products", async function(){
        const resp = await request(app)
                            .get(`/users/s1/interactions/seller`)
                            .set("authorization", `Bearer ${tokens[2]}`);
        const interactions = resp.body.interactions;

        expect(resp.statusCode).toEqual(200);
        expect(interactions.length).toEqual(2);
        expect(interactions[0].name).toEqual('brown scapular');
        expect(interactions[1].name).toEqual('miraculous medal');

    })

    test("doesn't work for other non-admin users", async function(){
        const resp = await request(app)
                            .get(`/users/s1/interactions/seller`)
                            .set("authorization", `Bearer ${tokens[0]}`);

        expect(resp.statusCode).toEqual(401);
    })
})

/***********************************************GET /users/:username/interactions/seller/approved */

describe("GET /users/:username/interactions/seller/approved", function(){
    test("works for seller of products", async function(){
        const resp = await request(app)
                            .get(`/users/s2/interactions/seller/approved`)
                            .set("authorization", `Bearer ${tokens[3]}`);
        const interactions = resp.body.interactions;

        expect(interactions.length).toEqual(1);
        expect(interactions[0].name).toEqual("bible");

    })

    test("doesn't work for other non-admin users", async function(){
        const resp = await request(app)
                            .get(`/users/s2/interactions/seller/approved`)
                            .set("authorization", `Bearer ${tokens[2]}`);

        expect(resp.statusCode).toEqual(401);
    })
})

/***********************************************PATCH /users/:username */

describe("PATCH /users/:username", function(){
    test("works for same user with valid password", async function(){
        const resp = await request(app)
                            .patch(`/users/c1`)
                            .send({
                                age: 60,
                                username: "newC1",
                                password: '1'
                            })
                            .set("authorization", `Bearer ${tokens[0]}`);
        const user = resp.body.user;

        expect(resp.statusCode).toEqual(200);
        expect(user.age).toEqual(60);
        expect(user.username).toEqual("newC1");
    })

    test("doesn't work for other non-admin users", async function(){
        const resp = await request(app)
                            .patch(`/users/c1`)
                            .send({
                                age: 60,
                                username: "newC1",
                                password: '1'
                            })
                            .set("authorization", `Bearer ${tokens[1]}`);
        const user = resp.body.user;

        expect(resp.statusCode).toEqual(401);
    })
})

/***********************************************DELETE /users/:username */

describe("DELETE /users/:username", function(){
    test("works for same user", async function(){
        const resp = await request(app)
                            .delete(`/users/c1`)
                            .set("authorization", `Bearer ${tokens[0]}`);
        const username = resp.body.deleted;

        expect(resp.statusCode).toEqual(200);
        expect(username).toEqual('c1')
    })

    test("doesn't work for other non-admin users", async function(){
        const resp = await request(app)
                            .delete(`/users/c1`)
                            .set("authorization", `Bearer ${tokens[1]}`);

        expect(resp.statusCode).toEqual(401);
    })
})