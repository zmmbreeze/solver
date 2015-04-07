var util = require('./util');
var optsExec = {
    '+': function (x, y) {
        x = x || 0;
        return x + y;
    },
    '-': function (x, y) {
        x = x || 0;
        return x - y;
    },
    '*': function (x, y) {
        if (x == null) {
            throw new Error('Can\'t solve "' + x + '*' + y + '".');
        }
        return x * y;
    },
    '/': function (x, y) {
        if (x == null) {
            throw new Error('Can\'t solve "' + x + '/' + y + '".');
        }
        if (y === 0) {
            throw new Error('Can\'t divide by zero.');
        }
        return x / y;
    }
};

module.exports = {
    'solve': function (equation, opt_marksValue) {
        var marksValue = opt_marksValue || {};
        var markValue;
        var outputs = equation.output;
        var output;
        var stack = [];
        var secondValue;
        var firstValue;
        var computedValue;
        var optExec;
        var cantSolveError = 'Can\'t solve "' + equation.original + '".';
        for (var i = 0, l = outputs.length; i < l; i++) {
            output = outputs[i];
            if (util.getOpPriority(output)) {
                // is operator
                secondValue = stack.pop();
                if (typeof secondValue === 'number') {
                    firstValue = stack.pop();
                    optExec = optsExec[output];
                    if (typeof firstValue === 'number') {
                        // 1 + 2
                        computedValue = optExec(firstValue, secondValue);
                    }
                    else {
                        // -1
                        computedValue = optExec(null, secondValue);
                        if (firstValue != null) {
                            // 1 + -2
                            stack.push();
                        }
                    }
                    stack.push(computedValue);
                    continue;
                }
                throw new Error(cantSolveError);
            }

            if (typeof output === 'number') {
                // is number
                stack.push(output);
                continue;
            }

            if (output.mark && (markValue = marksValue[output.mark])) {
                stack.push(output.negative ? (-1 * markValue) : markValue);
                continue;
            }

            throw new Error('Mark "' + output + '"\'s value not found.');
        }

        if (stack.length !== 1) {
            throw new Error(cantSolveError);
        }

        return stack[0];
    }
};
