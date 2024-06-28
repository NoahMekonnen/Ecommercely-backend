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
const { decode } = require("jsonwebtoken");
const { SECRET_KEY } = require("../config.js");
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../expressError.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/***********************************************POST /auth/register */

describe("POST /auth/register", function () {
    test("works", async function () {
        const resp = await request(app)
            .post('/auth/register')
            .send({
                username: "test1",
                password: "1",
                isSeller: false
            })
        const user = jwt.verify(resp.body.token, SECRET_KEY);

        expect(resp.statusCode).toEqual(201);
        expect(user.username).toEqual("test1");
        expect(user.isSeller).toEqual(false);
        expect(user.isAdmin).toEqual(false);
    })

    test("invalid data", async function () {
        await request(app)
            .post('/auth/register')
            .send({
                username: "test2",
                password: [0, 2],
                isSeller: false
            });
        const res = await db.query(`SELECT * FROM users WHERE username='test2'`);

        expect(res.rows.length).toEqual(0);


    })
})

/***********************************************POST /auth/login */

describe("POST /auth/login", function () {
    test("works", async function () {
        await User.register({
            username: "test1",
            password: "1",
            isSeller: true
        });

        const resp = await request(app)
            .post('/auth/login')
            .send({
                username: "test1",
                password: "1"
            });
        const user = jwt.verify(resp.body.token, SECRET_KEY);

        expect(resp.statusCode).toEqual(200);
        expect(user.username).toEqual("test1");
        expect(user.isSeller).toEqual(true);

    })

    test("Invalid data", async function(){
        const res = await request(app)
            .post('/auth/login')
            .send({
                username: 'c1',
                password: []
                });
        
        expect(res.token).not.toEqual(tokens[0])

    })
})