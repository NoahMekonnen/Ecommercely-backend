const db = require('../db')
const { NotFoundError, BadRequestError } = require('../expressError')
const { sqlForPartialUpdate } = require('../helpers/sql')


class Product {
    /** Create a product from given data in the database
     * 
     * input: {name, description, price, imageUrl, quantity, category, sellerId, expectedShippingTime}
     * 
     * returns {name, description, price, quantity, category, imageUrl, sellerId}
     * 
     * Throws BadRequestError if there already exists a product with that seller and product name
     */
    static async create({ name, description, price, quantity, category, imageUrl, sellerId, expectedShippingTime }) {
        const duplicateCheck = await db.query(`SELECT id
                                        FROM products 
                                        WHERE name= $1
                                        AND seller_id= $2
                                        AND quantity > 0`,
            [name, sellerId])
        if (duplicateCheck.rows[0]) {
            throw new BadRequestError(`Duplicate product #${duplicateCheck.rows[0].id}`)
        } else if(price <=0){
            throw new BadRequestError(`Price must be >=0`)
        } else if(quantity <=0){
            throw new BadRequestError(`Quantity must be >=0`)
        } else if(expectedShippingTime <=0){
            throw new BadRequestError(`That shipping time is unheard of`)
        } else if(imageUrl == ''){
            throw new BadRequestError(`Missing Image url`)
        }

        const result = await db.query(`INSERT INTO products
                                    (name, description, price,
                                    quantity, category, image_url, seller_id,
                                    expected_shipping_time_in_days)
                                    VALUES($1,$2,$3,$4,$5,$6,$7,$8)
                                    RETURNING id,
                                            name,
                                            description,
                                            price,
                                            quantity,
                                            category,
                                            image_url as "imageUrl",
                                            seller_id as "sellerId"
                                    `, [name, description, price, quantity, category, imageUrl, sellerId, expectedShippingTime]);
        const product = result.rows[0];
        return product;
    }

    /** Get products from the database matching given searchFilters object.
     * If object is empty then return all products from the database
     * 
     * input: {fld1, fld2, ...}
     * possible fields : category, str
     * 
     * return [{id, name, description, price, quantity, category, hasDiscount, discountRate, imageUrl, sellerId, expectedShippingTime,
     * numOfRatings, averageRating}, ...]
     */

    static async getAll(searchFilters = {}) {
        const unFilteredQuery = `SELECT id,
                                        name,
                                        description,
                                        price,
                                        quantity,
                                        category,
                                        has_discount AS "hasDiscount",
                                        discount_rate AS "discountRate",
                                        image_url AS "imageUrl",
                                        seller_id AS "sellerId",
                                        average_rating AS "averageRating",
                                        num_of_ratings AS "numOfRatings",
                                        expected_shipping_time_in_days
                                        AS "expectedShippingTime"
                                        FROM products`

        let result;

        let filteredQuery = `SELECT id,
                            name,
                            description,
                            price,
                            quantity,
                            category,
                            has_discount AS "hasDiscount",
                            discount_rate AS "discountRate",
                            image_url AS "imageUrl",
                            seller_id AS "sellerId",
                            average_rating AS "averageRating",
                            num_of_ratings AS "numOfRatings",
                            expected_shipping_time_in_days
                            AS "expectedShippingTime"
                            FROM products
                            WHERE `

        const values = []
        const { category, str } = searchFilters

        if (category) {
            filteredQuery += 'category iLike $1';
            values.push('%'+ category + '%');
            if (str) {
                filteredQuery += ` OR name iLIKE $2`;
                values.push('%' + str + '%');
            }
            result = await db.query(filteredQuery, values);
        }
        else if(str) {
            filteredQuery += `name iLIKE $1`;
            values.push('%' + str + '%');
            result = await db.query(filteredQuery, values);
        }

        if (!result) {
            result = await db.query(unFilteredQuery);
        }

        const products = result.rows;

        return products;
    }


    /** Get a particular product from the database
     * 
     * input: id
     * 
     * returns {id, name, description, price, quantity, category, imageUrl, sellerId, numOfRatings, averageRating}
     * 
     * Throws NotFoundError if product not found
     */

    static async get(id) {
        const result = await db.query(`SELECT id,
                                                name,
                                                description,
                                                price,
                                                quantity,
                                                category,
                                                image_url as "imageUrl",
                                                seller_id AS "sellerId",
                                                average_rating AS "averageRating",
                                                num_of_ratings AS "numOfRatings"
                                                FROM products 
                                                WHERE id=$1`,
            [id])

        const product = result.rows[0]
        if (!product) throw new NotFoundError(`No product with id #${id}`)
        return product
    }

    /** Update a product given the data in the database
     * 
     * input: id, {name, description, price, quantity, category, imageUrl, hasDiscount, discountRate }
     *
     * returns {name, description, price, quantity, category, imageUrl, sellerId }
     * 
     * Throws NotFoundError if product not found
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data,
            {
                imageUrl: 'image_url',
                hasDiscount: "has_discount",
                discountRate: "discount_rate"
            }
        );

        const setIdidx = `$${values.length + 1}`;
        const result = await db.query(`UPDATE products
                                       SET ${setCols}
                                       WHERE id=${setIdidx} 
                                       RETURNING id, 
                                                name,
                                                description,
                                                price,
                                                quantity,
                                                category,
                                                image_url as "imageUrl",
                                                seller_id as "sellerId",
                                                has_discount as "hasDiscount",
                                                discount_rate as "discountRate"`,
            [...values, id]);

        const product = result.rows[0];
        if (!product) throw new NotFoundError(`No product with id #${id}`);
        return product;
    }

    /** Delete a particular product from the database
     * 
     * input: id
     * 
     * Throws NotFoundError if product not found
     */

    static async delete(id) {
        const result = await db.query(`DELETE FROM products
                                        WHERE id=$1
                                        RETURNING id`,
            [id])

        const product = result.rows[0]
        if (!product) throw new NotFoundError(`No product with id #${id}`)

    }
}


module.exports = Product;