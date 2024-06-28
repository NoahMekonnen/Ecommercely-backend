const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

const testProductIds = [];
const testInteractionIds = [];
const testCartIds = [];

async function commonBeforeAll() {

    await db.query("DELETE FROM users");

    await db.query("DELETE FROM products")

    await db.query(`
    INSERT INTO users(username, password, is_admin, is_seller)
    VALUES ('c1', 'c1', false, false),
           ('c2', 'c2', false, false),
           ('s1', 's1', false, true),
           ('s2', 's2', false, true)`);

    const res1 = await db.query(`SELECT id FROM users WHERE username='s1'`);
    const res12 = await db.query(`SELECT id FROM users WHERE username='s2'`);
    const s1 = res1.rows[0];
    const s2 = res12.rows[0];

    const products = await db.query(`
    INSERT INTO products (name, description, price, quantity, category, image_url, seller_id, expected_shipping_time_in_days )
    VALUES ('p1', 1, 1.50, 3, 'marian', 'a.png', ${s1.id}, 1),
           ('p2', 2, 2.50, 3, 'marian', 'a.png', ${s1.id}, 2),
           ('p3', 3, 3.50, 3, 'marian', 'a.png', ${s1.id}, 3),
           ('p4', 4, 4.50, 3, 'marian', 'a.png', ${s1.id}, 4),
           ('p5', 5, 5.50, 3, 'marian', 'a.png', ${s2.id}, 5),
           ('p6', 6, 6.50, 3, 'marian', 'a.png', ${s2.id}, 6)
           RETURNING id
           `);

    testProductIds.splice(0, 0, ...products.rows.map(product => product.id));

    const res2 = await db.query(`SELECT * FROM users WHERE username='c1'`);
    const res3 = await db.query(`SELECT * FROM users WHERE username='c2'`);
    const c1 = res2.rows[0];
    const c2 = res3.rows[0];

    const carts = await db.query(`
    INSERT INTO carts (customer_id, address)
    VALUES (${c1.id}, 'address1'),
            (${c2.id}, 'address2'),
            (${s1.id}, 'address3') 
            RETURNING id`);
    
    testCartIds.splice(0, 0, ...carts.rows.map(cart => cart.id));
    
    const interactions = await db.query(`
    INSERT INTO interactions (product_id, quantity_chosen, cart_id)
    VALUES (${testProductIds[0]}, 1, ${testCartIds[0]}),
            (${testProductIds[1]}, 2, ${testCartIds[1]})
            RETURNING id`);

    testInteractionIds.splice(0, 0, ...interactions.rows.map(interaction => interaction.id));
}

async function commonBeforeEach() {
    await db.query("BEGIN");
}

async function commonAfterEach() {
    await db.query("ROLLBACK");
}

async function commonAfterAll() {
    await db.end();
}


module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testCartIds,
    testProductIds,
    testInteractionIds
};