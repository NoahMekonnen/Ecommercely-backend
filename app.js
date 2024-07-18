const express = require('express');
const cors = require('cors');
require("dotenv").config()
const {NotFoundError} = require('./expressError');

const { authenticateJWT } = require('./middleware/auth');

const app = express();
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/carts');
const userRoutes = require('./routes/users');
const interactionRoutes = require('./routes/interactions');

app.use(cors({origin: ['https://ecommercely-frontend.onrender.com', 'http://localhost:3000'], credentials: true}));
app.options('*', cors())
app.use(express.json());
app.use(authenticateJWT);


app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/carts", cartRoutes);
app.use("/users", userRoutes);
app.use("/interactions", interactionRoutes);

/** This will match all other routes */
app.use(function(req, res, next){
    return next(new NotFoundError("That route doesnt exist"));
});

/** Generic Error Handler */
app.use(function(err, req, res, next){
    if(process.env.NODE_ENV !== "test") console.log(err.stack);
    
    const status = err.status || 500;
    const msg = err.message;
    
    return res.status(status).json({
        error: { msg, status }
    });
});



module.exports = app;
