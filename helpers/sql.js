const { BadRequestError } = require("../expressError");

/** Converts given javascript keys and values into useful sql info
 * 
 * input: 
 * datatoUpdate- object containing the data that will be used to update the columns
 * jsToSql- object containing the conversion from camel case to snake case for each variable that is written in camel case
 * 
 * returns object containing:
 * - part of sql query where you set values for each column
 * - values that will be set in each column
 */
function sqlForPartialUpdate(datatoUpdate, jsToSql){
    const keys = Object.keys(datatoUpdate);
    if(keys.length === 0) throw new BadRequestError("No data");

    const cols = keys.map((colName,idx) =>
        `"${jsToSql[colName]|| colName}"=$${idx+1}`
    );

    return {
        setCols: cols.join(','),
        values: Object.values(datatoUpdate)
    };
}

module.exports = {sqlForPartialUpdate};