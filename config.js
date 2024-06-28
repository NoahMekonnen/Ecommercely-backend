
const SECRET_KEY = process.env.SECRET_KEY || 'super-secret';

const PORT = process.env.PORT || 3001;

function getDatabaseUri(){
    return (process.env.NODE_ENV === 'test')
    ? "postgresql://noah:Godalone1.@localhost:5432/ecommerce_store_test"
    : process.env.DATABASE_URL || "postgresql://noah:Godalone1.@localhost:5432/ecommerce_store";
};

const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === 'test' ? 1 : 12


module.exports = {
    SECRET_KEY,
    PORT,
    getDatabaseUri,
    BCRYPT_WORK_FACTOR
};