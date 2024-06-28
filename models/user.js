const db = require('../db')
const bcrypt = require('bcrypt')
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../expressError')
const { sqlForPartialUpdate } = require('../helpers/sql')

const { BCRYPT_WORK_FACTOR } = require("../config.js");




class User {
    /** Create an admin user in the database
     * 
     * input: {username, password, isSeller, address}, isCurrUserAdmin
     * 
     * returns {username, isAdmin, isSeller, address},
     */

    static async createAdmin({ username, password, isSeller, address }) {
        if (isCurrUserAdmin) {
            const duplicateCheck = await db.query(`SELECT * FROM users
                                                WHERE username=$1`,
                [username]);

            if (duplicateCheck.rows[0]) throw new BadRequestError(`User with username ${username} already exists`);

            const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

            const result = await db.query(`INSERT INTO users
                                        (username, password, is_admin, is_seller, address)
                                        ($1, $2, $3, $4, $5)
                                        RETURNING username,
                                                    is_admin AS "isAdmin"
                                                    is_seller AS "isSeller",
                                                    address`,
                [username, hashedPassword, true, isSeller, address]
            );

            const user = result.rows[0];
            return user;
        }
        throw new UnauthorizedError(`Only admins can make admin users`);
    }

    /** Create a non-admin user
     * 
     * input: {username, password, isSeller, address}
     * 
     * returns {username, isSeller, address}
     */

    static async register({ username, password, isSeller, address }) {

        const duplicateCheck = await db.query(`SELECT * FROM users
                                                WHERE username=$1`,
            [username]);
        if (duplicateCheck.rows[0]) throw new BadRequestError(`User with username ${username} already exists`);

        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

        const result = await db.query(`INSERT INTO users
                                        (username, password, is_seller, address)
                                        VALUES ($1, $2, $3, $4)
                                        RETURNING id,
                                                    username,
                                                    is_seller AS "isSeller",
                                                    is_admin AS "isAdmin",
                                                    address`,
            [username, hashedPassword, isSeller, address]);

        const user = result.rows[0];
        return user;
    }

    /** Check if a user exists based on the given username and password
     * 
     * input: username, password
     * 
     * returns {username, password, isAdmin, isSeller, age, address}
     * 
     * Throws NotFoundError if user with the given username is not found
     * Throws UnauthorizedError if username is in database but given password isn't valid
     */

    static async authenticate(username, password) {

        const result = await db.query(`SELECT id,
                                                username,
                                                password,
                                                is_admin AS "isAdmin",
                                                is_seller AS "isSeller"
                                        FROM users
                                        WHERE username=$1`,
            [username]);
        const user = result.rows[0];
        if (!user) throw new NotFoundError(`No user with username ${username}`);

        const correctPassword = await bcrypt.compare(password, user.password);


        if (correctPassword) {
            delete user.password;
            return user;
        }

        throw new UnauthorizedError(`Invalid password`)
    }

    /** Gets all the users in the database 
     * 
     * returns [{username, password, isAdmin, isSeller, age, address}, ...]
     */

    static async getAll() {
        const result = await db.query(`SELECT id,
                                            username,
                                            password,
                                            is_admin AS "isAdmin",
                                            is_seller AS "isSeller",
                                            age,
                                            address
                                        FROM users`);

        const users = result.rows;
        return users;
    }

    /** Gets a user from the database based on a given username
     * 
     * input: username
     * 
     * returns {id, username, isAdmin, isSeller, age, address}
     * 
     * Throws NotFoundError if user with given username not found
     */

    static async get(username) {
        const result = await db.query(`SELECT id,
                                                username,
                                                is_admin AS "isAdmin",
                                                is_seller AS "isSeller",
                                                age, 
                                                address
                                            FROM users
                                        WHERE username=$1`,
            [username]);

        const user = result.rows[0];
        if (!user) throw new NotFoundError(`No user with username ${username}`);
        return user;
    }

    /** Gets a user from the database based on a given id
     * 
     * input: id
     * 
     * returns {username, password, isAdmin, isSeller, age, address}
     * 
     * Throws NotFoundError if user with given id not found
     */

    static async getById(id) {
        const result = await db.query(`SELECT username,
                                        is_admin AS "isAdmin",
                                        is_seller AS "isSeller",
                                        age, 
                                        address FROM users
                                        WHERE id=$1`,
            [id]);

        const user = result.rows[0];
        if (!user) throw new NotFoundError(`No user with id #${id}`);
        return user;
    }

    /** Get products of a user
     * 
     * input: username
     * 
     * return [{id, name, description, hasDiscount, discountRate, sellerId, category, imageUrl, averageRating, numOfRatings}, ...]
     */

    static async getAvailableSellerProducts(username) {
        const checkUser = await db.query(`SELECT * FROM users
                                            WHERE username=$1`,
            [username]);

        if (!checkUser.rows[0]) throw new NotFoundError("User not found");

        const result = await db.query(`SELECT products.id,
                                                name,
                                                price,
                                                quantity,
                                                description,
                                                has_discount AS "hasDiscount",
                                                discount_rate AS "discountRate",
                                                seller_id AS "sellerId",
                                                category,
                                                image_url AS "imageUrl",
                                                average_rating AS "averageRating",
                                                num_of_ratings AS "numOfRatings"
                                                FROM products INNER JOIN users
                                                ON products.seller_id=users.id
                                                WHERE users.username=$1 AND quantity>0`,
            [username]);

        const products = result.rows;

        return products;
    }

    /** Get items(interactions technically) in a user's active cart from the database
     * 
     * input: username
     * 
     * return [{id, productId, quantityChosen, cartId}, ...]
     */

    static async getCartProducts(username) {
        const checkUser = await db.query(`SELECT * FROM users
            WHERE username=$1`,
            [username]);

        if (!checkUser.rows[0]) throw new NotFoundError("User not found");

        const result = await db.query(`SELECT interactions.id,
                                            product_id AS "productId",
                                            quantity_chosen AS "quantityChosen",
                                            cart_id AS "cartId"
                                            FROM users INNER JOIN carts
                                            ON users.id=carts.customer_id
                                            INNER JOIN interactions
                                            ON interactions.cart_id=carts.id
                                            WHERE users.username=$1 
                                            AND carts.bought=false`,
            [username]);

        const cartProducts = result.rows;

        return cartProducts;

    }

    /** Get past interactions of a customer in the database
     * 
     * input: username
     * 
     * return [{id, productId, quantityChosen, cartId, expectedShippingTime}, ...]
     */

    static async getPastCustomerInteractions(username) {
        const checkUser = await db.query(`SELECT * FROM users
                                            WHERE username=$1`,
                                        [username]);

        if(!checkUser.rows[0]) throw new NotFoundError("User not found");
        
        const result = await db.query(`SELECT interactions.id,
                                            product_id AS "productId",
                                            quantity_chosen AS "quantityChosen",
                                            cart_id AS "cartId",
                                            price,
                                            name,
                                            image_url AS "imageUrl",
                                            expected_shipping_time_in_days
                                            AS "expectedShippingTime"
                                            FROM interactions INNER JOIN carts
                                            ON interactions.cart_id=carts.id
                                            INNER JOIN users
                                            ON carts.customer_id=users.id
                                            INNER JOIN products
                                            ON products.id=interactions.product_id
                                            WHERE users.username=$1
                                            AND interactions.bought=true
                                            ORDER BY carts.cart_bought_timestamp
                                            DESC`,
            [username]);

        const interactions = result.rows;

        return interactions;
    }

    /** Get all past interactions of a seller
     * 
     * input: id
     * 
     * return [{id, productId, name, price, imageUrl, description, quantityChosen, cartId, address}, ...]
     */

    static async getPastSellerInteractions(username) {
        const checkUser = await db.query(`SELECT * FROM users
                                            WHERE username=$1`,
                                            [username]);
        
        if(!checkUser.rows[0]) throw new NotFoundError("User not found");

        const result = await db.query(`SELECT interactions.id,
                                                product_id AS "productId",
                                                name,
                                                price,
                                                image_url AS "imageUrl",
                                                description,
                                                quantity_chosen AS "quantityChosen",
                                                carts.address,
                                                cart_id AS "cartId"
                                                FROM interactions INNER JOIN products
                                                ON interactions.product_id=products.id
                                                INNER JOIN carts
                                                ON carts.id=interactions.cart_id
                                                INNER JOIN users
                                                ON products.seller_id = users.id
                                                WHERE users.username=$1 AND interactions.bought=true
                                                AND interactions.seller_approval=false
                                                ORDER BY carts.cart_bought_timestamp
                                                DESC`,
            [username]);

        const interactions = result.rows;
            
        return interactions;

    }

    /** Get finalized seller approved interactions of a seller
     * 
     * input: username
     * 
     * return [{id, productId, name, price, imageUrl, description, quantityChosen, cartId, address}, ...]
     */

    static async getApprovedInteractions(username) {
        const checkUser = await db.query(`SELECT * FROM users
                                            WHERE username=$1`,
                                        [username]);
        
        if(!checkUser.rows[0]) throw new NotFoundError("User not found");

        const result = await db.query(`SELECT interactions.id,
                                                product_id AS "productId",
                                                name,
                                                price,
                                                image_url AS "imageUrl",
                                                description,
                                                quantity_chosen AS "quantityChosen",
                                                carts.address,
                                                cart_id AS "cartId"
                                                FROM interactions INNER JOIN products
                                                ON interactions.product_id=products.id
                                                INNER JOIN users
                                                ON products.seller_id = users.id
                                                INNER JOIN carts
                                                ON carts.id=interactions.cart_id
                                                WHERE users.username=$1 AND interactions.bought=true
                                                AND interactions.seller_approval=true
                                                ORDER BY carts.cart_bought_timestamp
                                                DESC`,
            [username]);

        const interactions = result.rows;

        return interactions;

    }

    /** Update user in the database based on given data
     * 
     * required input: username,{fld1, fld2, ...}
     * possible fields: newUsername, password, isSeller, age, address
     * 
     * returns {username, password, isAdmin, isSeller, age, address}
     * 
     * Throws NotFoundError if user with given username not found
     */

    static async update(username, data) {

        const { setCols, values } = sqlForPartialUpdate(data,
            {
                isSeller: "is_seller"
            });

        const setUsernameIdx = `$${values.length + 1}`
        const result = await db.query(`UPDATE users
                                    SET ${setCols}
                                    WHERE username=${setUsernameIdx}
                                    RETURNING username,
                                                is_seller AS "isSeller",
                                                age,
                                                address`,
            [...values, username]);

        const user = result.rows[0];
        if (!user) throw new NotFoundError(`No user with username ${username}`);
        return user;
    }

    /** Deletes user from database based on given username
     * 
     * input: username
     */

    static async delete(username) {
        const result = await db.query(`DELETE FROM users
                                        WHERE username=$1
                                        RETURNING username
                                        `, [username]);
        const user = result.rows[0];
        if (!user) throw new NotFoundError(`No user with username ${username}`);
    }
}


module.exports = User;