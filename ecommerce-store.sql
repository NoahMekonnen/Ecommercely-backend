DROP DATABASE IF EXISTS ecommerce_store;
CREATE DATABASE ecommerce_store;

\connect ecommerce_store

\i ecommerce-store-schema.sql
\i ecommerce-store-seed.sql
-- ALTER TABLE `products` ADD CONSTRAINT fk_l_id FOREIGN KEY (id_l) REFERENCES table_b(id_l)


DROP DATABASE ecommerce_store_test;
CREATE DATABASE ecommerce_store_test;

\connect ecommerce_store_test

\i ecommerce-store-schema.sql
-- \i ecommerce_store-seed.sql