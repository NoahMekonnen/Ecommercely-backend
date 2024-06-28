"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Product = require("../models/product");
const Interaction = require("../models/interaction");
const Cart = require("../models/cart");
const { createToken } = require("../helpers/tokens");
const { decode } = require("jsonwebtoken");
const { SECRET_KEY } = require("../config.js");

const testProducts = [];
const tokens = [];
const testCarts = [];
const testInteractions = [];

async function commonBeforeAll() {

  await db.query("DELETE FROM users");

  // test users
  const c1 = await User.register({
    username: "c1",
    password: '1',
    isSeller: false
  });
  const c2 = await User.register({
    username: "c2",
    password: "2",
    isSeller: false,
  });
  const s1 = await User.register({
    username: "s1",
    password: "1",
    isSeller: true
  });
  const s2 = await User.register({
    username: "s2",
    password: "2",
    isSeller: true
  });

  tokens.push(createToken(c1));
  tokens.push(createToken(c2));
  tokens.push(createToken(s1));
  tokens.push(createToken(s2));

  // test products
  testProducts.push(await Product.create({
    name: "brown scapular",
    description: "",
    quantity: 5,
    price: 3,
    imageUrl: 'a.png',
    expectedShippingTime: 4,
    sellerId: decode(tokens[2]).id
  }))

  testProducts.push(await Product.create({
    name: "miraculous medal",
    description: "wear with confidence",
    quantity: 5,
    price: 3,
    imageUrl: 'a.png',
    expectedShippingTime: 4,
    sellerId: decode(tokens[2]).id
  }))

  testProducts.push(await Product.create({
    name: "green scapular",
    description: "wear with confidence",
    quantity: 5,
    price: 3,
    imageUrl: 'a.png',
    expectedShippingTime: 4,
    sellerId: decode(tokens[3]).id
  }))

  testProducts.push(await Product.create({
    name: "bible",
    description: "read often",
    quantity: 5,
    price: 3,
    imageUrl: 'a.png',
    expectedShippingTime: 4,
    sellerId: decode(tokens[3]).id
  }))

  testProducts.push(await Product.create({
    name: "great gatsby",
    description: "read often",
    quantity: 5,
    price: 3,
    imageUrl: 'a.png',
    expectedShippingTime: 4,
    sellerId: decode(tokens[3]).id
  }))

  //test carts
  testCarts.push(await Cart.create({
    customerId: decode(tokens[0]).id,
    address: 'cart 1'
  }))

  testCarts.push(await Cart.create({
    customerId: decode(tokens[1]).id,
    address: 'cart 2'
  }))

  testCarts.push(await Cart.create({
    customerId: decode(tokens[2]).id,
    address: 'cart 3'
  }))

  // test interactions
  testInteractions.push(await Interaction.create({
    productId: testProducts[0].id,
    quantityChosen: 1,
    cartId: testCarts[0].id
  }))

  testInteractions.push(await Interaction.create({
    productId: testProducts[1].id,
    quantityChosen: 1,
    cartId: testCarts[0].id
  }))

  testInteractions.push(await Interaction.create({
    productId: testProducts[2].id,
    quantityChosen: 1,
    cartId: testCarts[1].id
  }))

  testInteractions.push(await Interaction.create({
    productId: testProducts[3].id,
    quantityChosen: 1,
    cartId: testCarts[1].id
  }))

  // buy test carts
  await Cart.buy(testCarts[0].id);
  await Cart.buy(testCarts[1].id);

  // approve interactions
  await Interaction.update(testInteractions[3].id);
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
  tokens,
  testProducts, 
  testCarts,
  testInteractions
};
