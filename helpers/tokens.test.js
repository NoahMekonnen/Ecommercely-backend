const {createToken} = require("./tokens");
const { jwtDecode } = require('jwt-decode');
const db = require('../db');

const user = {
    id: 1,
    username: 'a'
}

async function commonAfterAll() {
    await db.end();
}

afterAll(commonAfterAll);

describe("createToken", function(){
    test("works", function(){
        const token = createToken(user);
        const decoded = jwtDecode(token);

        expect(decoded.id).toEqual(1);
        expect(decoded.username).toEqual('a');
        expect(decoded.isSeller).toEqual(false);
        expect(decoded.isAdmin).toEqual(false);
    })
})