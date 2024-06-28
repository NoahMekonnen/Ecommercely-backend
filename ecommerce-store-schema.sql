CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    is_seller BOOLEAN NOT NULL,
    age INTEGER,
    address VARCHAR(250)
);

CREATE TABLE products(
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(5000) NOT NULL,
    price FLOAT(25) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    category VARCHAR(50),
    image_url VARCHAR(100000),
    has_discount BOOLEAN DEFAULT false,
    discount_rate INTEGER DEFAULT 0,
    average_rating FLOAT(25) NOT NULL DEFAULT 0,
    num_of_ratings INTEGER NOT NULL DEFAULT 0,
    seller_id INTEGER NOT NULL REFERENCES users ON DELETE CASCADE,
    expected_shipping_time_in_days INTEGER NOT NULL
);

CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES users ON DELETE CASCADE NOT NULL,
    cart_made_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bought BOOLEAN NOT NULL DEFAULT false,
    cart_bought_timestamp TIMESTAMP,
    address VARCHAR(150) NOT NULL
);

CREATE TABLE interactions(
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products ON DELETE CASCADE NOT NULL,
    quantity_chosen INTEGER NOT NULL,
    cart_id INTEGER REFERENCES carts ON DELETE CASCADE NOT NULL,
    bought BOOLEAN NOT NULL DEFAULT false,
    seller_approval BOOLEAN NOT NULL DEFAULT false
);