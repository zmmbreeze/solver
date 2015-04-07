var util = require('./util');
var optsExec = {
    '+': function (x, y) {
        return x + y;
    },
    '-': function (x, y) {
        return x - y;
    },
    '*': function (x, y) {
        return x * y;
    },
    '/': function (x, y) {
        return x / y;
    }
};

module.exports = {
    'solve': function (equation, opt_marksValue) {
        var marksValue = opt_marksValue || {};
        var markValue;
        var outputs = equation.output;
        var output;
        var stack;
        for (var i = 0, l = outputs.length; i < l; i++) {
            output = outputs[i];
            if (util.getOpPriority(output)) {
                // is operator
                var secondValue = stack.pop();
                var firstValue = stack.pop();
                stack.push(optsExec[output](firstValue, secondValue));
                continue;
            }

            if (typeof output === 'number') {
                // is number
                stack.push(output);
                continue;
            }

            if (markValue = marksValue[output]) {
                stack.push(markValue);
                continue;
            }

            throw new Error('Mark "' + output + '"\'s value not found.');
        }

        if (stack.length !== 1) {
            throw new Error('Can\'t solve "' +  + '".');
        }

        return stack[0];
    }
};
