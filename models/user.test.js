"use strict";

const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testCartIds,
    testProductIds,
    testInteractionIds
} = require("./_testCommon");

const Cart = require("./cart.js");
const Interaction = require("./interaction.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/***********************************************Register */

const user1 = {
    username: 'user1',
    password: 'password1',
    isSeller: false,
    address: 'kingdom'
}

const user2 = {
    username: 'user2',
    password: 'password1',
    isSeller: false,
    address: 'kingdom'
}

describe("register", function () {
    test("works", async function () {
        const user = await User.register(user1);

        expect(user.username).toEqual('user1');
        expect(user.isSeller).toEqual(false);
        expect(user.address).toEqual('kingdom');

        const found = await db.query(`SELECT * FROM users WHERE username = 'user1'`);

        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].is_seller).toEqual(user1.isSeller);
        expect(found.rows[0].address).toEqual(user1.address);
        expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
    })

    test("no users with same username", async function(){
        const user2 = {
            username:'test2',
            password: '2'
        }
        try{
            await User.register(user1)
            await User.register(user1)
        } catch(err){
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    })

})

/***********************************************Authenticate */

describe("authenticate", function(){
    test("works", async function(){
        await User.register(user1);
        const user = await User.authenticate(user1.username, user1.password);
        
        expect(user.username).toEqual('user1');
        expect(user.isSeller).toEqual(false);
        expect(user.isAdmin).toEqual(false);

        const found = await db.query(`SELECT * FROM users WHERE username = 'user1'`);

        expect(found.rows.length).toEqual(1);
        expect(found.rows[0].is_seller).toEqual(user1.isSeller);
        expect(found.rows[0].address).toEqual(user1.address);
        expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
    })

    test("user doesn't exist", async function(){
        await User.register(user1);
        try{
            await User.authenticate('fake',user1.password);
        } catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })

    test("password is wrong", async function(){
        await User.register(user1)
        try{
            await User.authenticate(user1.username, 'fake')
        } catch(err){
            expect(err instanceof UnauthorizedError).toBeTruthy();
        }
    })
})

/***********************************************GetAll */

describe("getAll", function(){
    test("works", async function(){
        const users = await User.getAll();

        expect(users.length).toEqual(4);
        expect(users[0].username).toEqual('c1');
        expect(users[1].username).toEqual('c2');
        expect(users[2].username).toEqual('s1');
        expect(users[3].username).toEqual('s2');

    })

})

/***********************************************Get */

describe("get", function(){
    test("works", async function(){
        const user = await User.get('c1');

        expect(user.username).toEqual('c1');
        expect(user.isAdmin).toEqual(false);
        expect(user.isSeller).toEqual(false);
    })

    test("user doesn't exist", async function(){
        try{
            await User.get('fake')
        } catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
})

/***********************************************GetById */

describe("getbyId", function(){
    test("works", async function(){
        const user = await User.register(user1);
        const finalUser = await User.getById(user.id);

        expect(finalUser.username).toEqual('user1');
        expect(finalUser.isAdmin).toEqual(false);
        expect(finalUser.isSeller).toEqual(false);

    })

    test("user doesn't exist", async function(){
        try{
            await User.getById(-1);
        } catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
})

/***********************************************GetAvailableSellerProducts */

describe("getAvailableSellerProducts", function(){
    test("works", async function(){
        const products = await User.getAvailableSellerProducts('s1');

        expect(products.length).toEqual(4);
        expect(products[0].name).toEqual('p1');
        expect(products[1].name).toEqual('p2');
        expect(products[2].name).toEqual('p3');
        expect(products[3].name).toEqual('p4');
    })

    test("user doesn't exist", async function(){
        try{
            await User.getAvailableSellerProducts('fake');
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
})

/***********************************************GetCartProducts */

describe("getCartProducts", function(){
    test("works", async function(){
        const cartProducts = await User.getCartProducts('c1');

        expect(cartProducts.length).toEqual(1);
        expect(cartProducts[0].cartId).toEqual(testCartIds[0]);
        expect(cartProducts[0].productId).toEqual(testProductIds[0]);
        expect(cartProducts[0].quantityChosen).toEqual(1);
    })

    test("user doesn't exist", async function(){
        try{
            await User.getCartProducts('fake');
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
})

/***********************************************GetPastCustomerInteractions */

describe("getPastCustomerInteractions", function(){
    test("works", async function(){
        const initial = await User.getPastCustomerInteractions('c2');

        expect(initial.length).toEqual(0);

        await Cart.buy(testCartIds[1]);
        const final = await User.getPastCustomerInteractions('c2');

        expect(final.length).toEqual(1);
    });

    test("user doesn't exist", async function(){
        try{
            await User.getPastCustomerInteractions('fake');
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
})

/***********************************************GetPastSellerInteractions */

describe("getPastSellerTransactions", function(){
    test("works", async function(){
        const initial = await User.getPastSellerInteractions('s1');

        expect(initial.length).toEqual(0);

        await Cart.completeInteraction(testInteractionIds[0]);
        await Cart.completeInteraction(testInteractionIds[1]);

        const final = await User.getPastSellerInteractions('s1');

        expect(final[0].name).toEqual('p1');
        expect(final[1].name).toEqual('p2');
    })

    test("user doesn't exist", async function(){
        try{
            await User.getPastSellerInteractions('fake');
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
})

/***********************************************GetApprovedInteractions */

describe("getApprovedInteractions", function(){
    test("works", async function(){
        const initial = await User.getApprovedInteractions('s1');

        expect(initial.length).toEqual(0);

        await Cart.completeInteraction(testInteractionIds[0]);
        await Interaction.update(testInteractionIds[0]);
        const final = await User.getApprovedInteractions('s1');

        expect(final.length).toEqual(1);
    })

    test("user doesn't exist", async function(){
        try{
            await User.getApprovedInteractions('fake');
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
})

/***********************************************Update */

describe("update", function(){
    test("works", async function(){
        const initial = await db.query(`SELECT * FROM users WHERE username='c1'`);
        
        expect(initial.rows[0].username).toEqual('c1');
        expect(initial.rows[0].age).toEqual(null);

        await User.update('c1',{
            username: 'newC1',
            age: 33
        })

        const final = await db.query(`SELECT * FROM users WHERE id=${initial.rows[0].id}`);

        expect(final.rows[0].username).toEqual('newC1');
        expect(final.rows[0].age).toEqual(33);
    })

    test("user doesn't exist", async function(){
        try{
            await User.update('fake', {})
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
});

/***********************************************Delete */

describe("delete", function(){
    test("works", async function(){
        const initial = await User.get('c1');

        expect(initial.username).toEqual('c1');

        await User.delete('c1')

        try{
            await User.get('c1');
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })

    test("user doesn't exist", async function(){
        try{
            await User.delete('fake');
        } catch(err){
            expect(err instanceof NotFoundError);
        }
    })
});