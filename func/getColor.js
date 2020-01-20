module.exports = getColor;

const textColorList = require('./../data/colorList.js');
function getColor(inp = ''){
    inp = inp.replace(/\s/g, '');

    // Check if the provided color is a key in the colorList.js
    if (inp.toLowerCase() in textColorList) {
        return textColorList[inp];
    }

    // Check if the provided color is already supplied as a hex color.
    if (/^#[0-9a-fA-F]{6}$/.test(inp)) { // string already as six characters
        return inp.toLowerCase();
    }
    if (/^#[0-9a-fA-F]{3}$/.test(inp)) { // 3 character hex - change to six
        out = '#';
        for (i=1; i <=3; i++){
            out += inp[i] + inp[i];
        }
        return out.toLowerCase();
    }

    // Check if the provided color is supplied as RGB. eg.(255,50,0)
    if (/^\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/.test(inp)) {
        let values = inp.replace(/[\(\)]/g, '').split(',');
        for (i=0;i<3;i++) {
            values[i] = Number(values[i]);
        }
        let valid = true;
        values.forEach(val => {
            if (!valid || val > 255 || val < 0) {
                valid = false;
            }
        });
        if (valid) {
            let out = '#';
            values.forEach(val => {
                let hex = val.toString(16);
                out += hex.length < 2 ? '0'+hex : hex;
            });
            return out;
        }
    }
    return false;
}


/* test cases - leave these commented out or you will be confused */
function test_getColor(){
    console.assert(getColor('khaki') == '#f0e68c', 'getColor assertion failure: color lib');
    console.assert(getColor('kek') == false, 'getColor assertion failure: invalid lib entry');
    
    console.assert(getColor('#123AbC') == '#123abc', 'getColor assertion failure: hex echo');
    console.assert(getColor('#7dF') == '#77ddff', 'getColor assertion failure: hex repeat');
    console.assert(getColor('123abc') == false, 'getColor assertion failure: not marked as hex');
    console.assert(getColor('#abfh12') == false, 'getColor assertion failure: invalid hex characters');
    
    console.assert(getColor('(255,0,0)') == '#ff0000', 'getColor assertion failure: rgb conversion');
    console.assert(getColor('    (125,  0 ,   80)') == '#7d0050', 'getColor assertion failure: rgb conversion & whitespace trim');
    console.assert(getColor('(,20,0)') == false, 'getColor assertion failure: invalid rgb formatting');
}

test_getColor();

