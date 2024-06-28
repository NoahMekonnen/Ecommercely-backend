const db = require('../db');
const {BadRequestError, NotFoundError} = require('../expressError');


class Cart{

    
/** Create a cart in the databse
 * 
 * input: customerId, productId, quantitySold
 * 
 * returns {id, cart_bought_timestamp, address}
 * Note: the id refers to the id in the carts table
 */

    static async create({customerId, address}){
        const existingCart = await db.query(`SELECT COUNT(*) FROM carts
                                            WHERE customer_id=$1
                                            AND bought=false`,
                                        [customerId])

        if (existingCart.rows[0].count >=1) throw new BadRequestError(`Customer #${customerId} already has a cart`);

        const cartRes = await db.query(`INSERT INTO carts
                                        (customer_id, address)
                                        VALUES ($1, $2)
                                        RETURNING id,
                                        address,
                                        cart_bought_timestamp AS cartBoughtTimestamp`,
                                    [customerId, address]);
        const cart = cartRes.rows[0];

        return cart;

    }

    /** Gets the current cart based on id
     * 
     * input: id
     *
     * return {id, customerId, cart_bought_timestamp, bought}
     */

    static async get(id){
        const result = await db.query(`SELECT id,
                                            customer_id AS "customerId",
                                            cart_bought_timestamp AS "cartBoughtTimestamp",
                                            bought
                                            FROM carts
                                            WHERE id=$1`,
                                        [id])

        const cart = result.rows[0];
        if(!cart) throw new NotFoundError(`No cart with id #${id}`)
        return cart
    }

    /** Updates the status of an interaction to having being bought in database
     * 
     * input: interactionId
     * 
     * return {productId, quantityChosen, cartId}
     */

    static async completeInteraction(interactionId){
        const result = await db.query(`UPDATE interactions
                                            SET bought=true
                                            WHERE id=$1
                                            RETURNING product_id AS "productId",
                                                        quantity_chosen AS "quantityChosen",
                                                        cart_id AS "cartId"`,
                                        [interactionId]);

        const interaction = result.rows[0];
        if(!interaction) throw new NotFoundError(`No interaction with id #${interactionId}`);
        return interaction;
    }

    /** Updates the status of a cart of having been bought in the database
     * 
     * input: id
     * 
     * returns {id, customerId, timestamp, bought}
     */
    
    static async buy(id){
        const result = await db.query(`UPDATE carts AS c
                                    SET bought=true
                                    WHERE c.id=$1
                                    RETURNING c.id,
                                            c.customer_id AS "customerId",
                                            c.cart_bought_timestamp AS cartBoughtTimestamp,
                                            c.bought`,
                                    [id]);
        
        const cart = result.rows[0];
        if(!cart) throw new NotFoundError(`Cart not found`);

        await db.query(`UPDATE interactions
                        SET bought=true
                        WHERE cart_id=$1
                        `,[cart.id]);
                        
        return cart;
    }

}

module.exports = Cart;