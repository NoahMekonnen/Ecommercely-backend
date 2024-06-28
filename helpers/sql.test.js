const {sqlForPartialUpdate} = require('./sql');
const db = require('../db');
const { BadRequestError } = require('../expressError');

async function commonAfterAll() {
    await db.end();
}

afterAll(commonAfterAll);

describe("sqlForPartialUpdate", function(){
    test("works", async function(){
        const jsToSql = {
            firstName: 'first_name',
            lastName: 'last_name'
        }
        const data = {
            firstName: 'blessed virgin',
            lastName: 'mary',
            son: 'jesus'
        }

        const {setCols, values} = sqlForPartialUpdate(data, jsToSql);

        expect(setCols).toEqual(`"first_name"=$1,"last_name"=$2,"son"=$3`);
        expect(values).toEqual(['blessed virgin', 'mary', 'jesus']);
    })

    test("No data", function(){
        const jsToSql = {
            firstName: 'first_name',
            lastName: 'last_name'
        }

        try{
            sqlForPartialUpdate({}, jsToSql);
        } catch(err){
            expect(err instanceof BadRequestError);
        }
    })
})