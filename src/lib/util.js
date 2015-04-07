var OPS = {
    '+': 1,
    '*': 2,
    '-': 1,
    '/': 2
};
var numberReg = /[0-9\.]/;
var markReg = /[a-zA-Z]/;

module.exports = {
    getOpPriority: function (input) {
        return OPS[input];
    },
    isNumber: function (input) {
        return numberReg.test(input);
    },
    isMark: function (input) {
        return markReg.test(input);
    }
};
