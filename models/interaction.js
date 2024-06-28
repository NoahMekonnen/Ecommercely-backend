const db = require('../db');
const { sqlForPartialUpdate } = require('../helpers/sql');
const Cart = require('./cart');
const {BadRequestError, NotFoundError} = require('../expressError');




class Interaction {


     /** Add an an interaction to the interactions table 
     * 
     * input: productId, quantityChosen, cartId
     * 
     * return {id, productId, quantityChosen, cartId}
     */

     static async create({productId, quantityChosen, cartId}){
        const checkCart = await db.query(`SELECT * FROM carts
                                            WHERE id=$1`,
                                            [cartId]);

        if(!checkCart.rows[0]) throw new NotFoundError(`No cart with id #${cartId}`);

        const InteractionRes = await db.query(`INSERT INTO interactions
                                                (product_id, quantity_chosen, cart_id)
                                                            VALUES ($1, $2, $3)
                                                            RETURNING id,
                                                            product_id AS "productId",
                                                            quantity_chosen AS "quantityChosen",
                                                            cart_id AS "cartId"`,
                                                            [productId, quantityChosen, cartId]);
        const interaction = InteractionRes.rows[0];

        return interaction;
    }

    /** Gets an interaction from the database
     * 
     * input: id
     * 
     * return {id, productId, quantityChosen, cartId}
     */

    static async get(id){
        const result = await db.query(`SELECT id,
                                        product_id AS "productId",
                                        quantity_chosen AS "quantityChosen",
                                        cart_id AS "cartId"
                                        FROM interactions
                                        WHERE id=$1`,
                                    [id]);

        const interaction = result.rows[0];
        if(!interaction) throw new NotFoundError("Interaction not found");

        return interaction;
    }

    /** Update an interaction in the database
     * 
     * input: id
     * 
     * return {id, productId, quantityChosen, cartId, bought}
     */

    static async update(id){
        const result = await db.query(`UPDATE interactions
                                        SET seller_approval=true
                                        WHERE id=$1
                                        RETURNING id,
                                                product_id AS "productId",
                                                quantity_chosen AS "quantityChosen",
                                                cart_id AS "cartId",
                                                bought`,
                                    [id]);

        const interaction = result.rows[0];
        if(!interaction) throw new NotFoundError("Interaction not found");

        return interaction;
    }

      /** Remove an interaction from the database and thus from the cart it belongs to
     * 
     * input: interactionId
     */

    static async delete(interactionId){
        const existingCheck = await db.query(`SELECT * FROM interactions
                                                WHERE id=$1`,
                                            [interactionId]);

        if(!existingCheck.rows[0]) throw new NotFoundError(`Interaction with id #${id} not found`);

        await db.query(`DELETE FROM interactions
                        WHERE id=$1`,
                    [interactionId]);
    }

}

module.exports = Interaction;