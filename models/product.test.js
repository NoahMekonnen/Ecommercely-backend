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
    commonAfterAll
} = require("./_testCommon");
const { BCRYPT_WORK_FACTOR } = require("../config.js");
const bcrypt = require('bcrypt')

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const product1 = {
    name: 'product1',
    description: 'product1',
    price: 5,
    quantity: 5,
    category: 'marian',
    imageUrl: 'a.png',
    expectedShippingTime: 4
}

/***********************************************Create */

describe("create", function () {
    test("works", async function () {
        const s1 = await User.get('s1')
        const p1 = await Product.create({
            ...product1,
            sellerId: s1.id
        })

        expect(p1.name).toEqual('product1');
        expect(p1.description).toEqual('product1');
        expect(p1.price).toEqual(5);
        expect(p1.quantity).toEqual(5);
        expect(p1.category).toEqual('marian');
        expect(p1.imageUrl).toEqual('a.png');
        expect(p1.sellerId).toEqual(s1.id)
    })

    test("duplicate product", async function () {
        const duplicate = {
            name: 'product1',
            description: 'product1',
            price: 5,
            quantity: 5,
            category: 'marian',
            imageUrl: 'a.png',
            expectedShippingTime: 4
        }

        try {
            const s1 = await User.get('s1')
            await Product.create({
                ...product1,
                sellerId: s1.id
            });
            await Product.create({
                ...duplicate,
                sellerId: s1.id
            });
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    })
});

/***********************************************GetAll */

describe("getAll", function(){
    test("works with no filter", async function(){
        const products = await Product.getAll();

        expect(products.length).toEqual(6);
        expect(products[0].name).toEqual('p1');
        expect(products[1].name).toEqual('p2');
        expect(products[2].name).toEqual('p3');
        expect(products[3].name).toEqual('p4');
        expect(products[4].name).toEqual('p5');
        expect(products[5].name).toEqual('p6');
    });

    test("works with a filter", async function(){
        const products = await Product.getAll({ str:'1'});

        expect(products.length).toEqual(1);
        expect(products[0].name).toEqual('p1');
    })
});

/***********************************************Get */

describe("get", function(){
    test("works", async function(){
        const res = await db.query(`SELECT * FROM products WHERE name='p2'`)
        const id = res.rows[0].id
        const product = await Product.get(id);

        expect(product.name).toEqual('p2');
        expect(product.description).toEqual('2');
        expect(product.price).toEqual(2.5);
    })

    test("product doesn't exist", async function(){
        try{
            await Product.get(-1);
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    });
})

/***********************************************Update */

describe("update", function(){
    test("works", async function(){
        const res = await db.query(`SELECT id FROM products WHERE name='p1'`);
        const id = res.rows[0].id;
        const product = await Product.update(id, {
            name: 'newP1'
        });

        expect(product.name).toEqual('newP1');
    });

    test("product doesn't exist", async function(){
        try{
            await Product.update(-1, {})
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
})

/***********************************************Delete */

describe("delete", function(){
    test("works", async function(){
        const products = await Product.getAll();

        expect(products.length).toEqual(6);

        const res = await db.query(`SELECT id FROM products WHERE name='p1'`);
        const id = res.rows[0].id;
        await Product.delete(id);

        const finalProducts = await Product.getAll();
        const final = await db.query(`SELECT * FROM products WHERE name='p1'`);

        expect(finalProducts.length).toEqual(5);
        expect(final.rows.length).toEqual(0);
    });

    test("product doesn't exist", async function(){
        try{    
            await Product.delete(-1);
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    });
})