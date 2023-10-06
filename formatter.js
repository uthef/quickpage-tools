/**
 * 
 * @param {number} millis 
 * @returns {string}
 */
function formatMillis(millis) {
    return (millis / 1000).toFixed(2);   
}

module.exports = { formatMillis }