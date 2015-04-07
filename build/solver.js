(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"./src/solver.js":[function(require,module,exports){
(function (global, factory) {

    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory(global);
    } else {
        factory(global);
    }

}(typeof window !== 'undefined' ? window : this, function (global) {

    var shuntingYard = require('./lib/shuntingYard');
    var executor = require('./lib/executor');

    var solver = {
        'solve': function (equation, opt_marksValue) {
            equation = solver.compile(equation);
            return equation.solve(opt_marksValue);
        },
        'compile': function (equation) {
            return shuntingYard(equation);
        }
    };
    global.solver = solver;

    return solver;
}));


},{"./lib/executor":"/home/zhouminming01/person/solver/src/lib/executor.js","./lib/shuntingYard":"/home/zhouminming01/person/solver/src/lib/shuntingYard.js"}],"/home/zhouminming01/person/solver/src/lib/executor.js":[function(require,module,exports){
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

},{"./util":"/home/zhouminming01/person/solver/src/lib/util.js"}],"/home/zhouminming01/person/solver/src/lib/shuntingYard.js":[function(require,module,exports){
var util = require('./util');
var executor = require('./executor');

var SY = function (equation) {
    this.output = [];
    this.marks = [];
    this.ops = [];
    this.curNumber = '';
    this.curMark = '';
    this.curIsMinus = false;
    this.original = equation;
    /**
     * next input may be negative mark
     * @type {boolean}
     */
    this.nimbnm = true;
    this.parse(equation);
};

SY.prototype.parseNumber = function (input) {
    var isNumber = util.isNumber(input);
    if (isNumber) {
        this.curNumber += input;
        if (this.curIsMinus) {
            this.curNumber = '-' + this.curNumber;
            this.curIsMinus = false;
        }
        this.nimbnm = false;
    }
    else {
        this.saveNumber();
    }

    return isNumber;
};

SY.prototype.saveNumber = function () {
    if (this.curNumber) {
        this.output.push(parseFloat(this.curNumber, 10));
        this.curNumber = '';
    }
};

SY.prototype.parseMark = function (input) {
    var isMark = util.isMark(input);
    if (isMark) {
        this.curMark += input;
        if (this.curIsMinus) {
            this.curMark = '-' + this.curMark;
            this.curIsMinus = false;
        }
        this.nimbnm = false;
    }
    else {
        this.saveMark();
    }

    return isMark;
};

SY.prototype.saveMark = function () {
    if (this.curMark) {
        var negative = this.curMark.charAt(0) === '-';
        var mark = negative ? this.curMark.replace(/\-/g, '') : this.curMark;
        this.output.push({
            negative: negative,
            mark: mark
        });
        this.marks.push(mark);
        this.curMark = '';
    }
};

SY.prototype.parseOp = function (input) {
    var priority = util.getOpPriority(input);
    if (priority) {
        if (this.nimbnm) {
            // 1 + +2
            // 1 + -2
            // 1 - *2   error
            switch (input) {
                case '-':
                    this.curIsMinus = true;
                    break;
                case '+':
                    break;
                default:
                    throw new Error('Unexpected token ' + input);
            }
            return priority;
        }

        // is op
        var lastOp;
        var lastPriority;
        while (lastOp = this.ops.pop()) {
            if (lastOp === '(') {
                this.ops.push(lastOp);
                break;
            }

            lastPriority = util.getOpPriority(lastOp);
            // consider all operations are left binding
            if (priority <= lastPriority) {
                this.output.push(lastOp);
            }
            else {
                this.ops.push(lastOp);
                break;
            }
        }

        this.ops.push(input);
        this.nimbnm = true;
    }

    return !!priority;
};


SY.prototype.saveOp = function () {
    var lastOp;
    while (lastOp = this.ops.pop()) {
        this.output.push(lastOp);
    }
};

SY.prototype.parseRBrackets = function (input) {
    var isRBrackets = input === ')';
    if (isRBrackets) {
        var lastOp;
        var hasMatchBrackets = false;
        while (lastOp = this.ops.pop()) {
            if (lastOp === '(') {
                hasMatchBrackets = true;
                break;
            }
            this.output.push(lastOp);
        }

        if (!hasMatchBrackets) {
            throw new Error('No matched "(".');
        }
        this.nimbnm = false;
    }

    return isRBrackets;
};

SY.prototype.parse = function (eq) {
    var input;

    for (var i = 0, l = eq.length; i < l; i++) {
        input = eq[i];
        if (input === ' ') {
            continue;
        }

        if (this.parseNumber(input)) {
            continue;
        }

        if (this.parseMark(input)) {
            continue;
        }

        if (input === '(') {
            this.ops.push(input);
            this.nimbnm = true;
            continue;
        }

        if (this.parseRBrackets(input)) {
            continue;
        }

        if (this.parseOp(input)) {
            continue;
        }

        throw new Error('Unknown operators: "' + input + '".');
    }

    this.saveNumber();
    this.saveMark();
    this.saveOp();
};

SY.prototype.getMarks = function () {
    return this.marks;
};

SY.prototype.solve = function (opt_marksValue) {
    var marksValue = opt_marksValue || {};
    return executor.solve(this, opt_marksValue);
};

SY.prototype.toString = function () {
    var outputs = this.output;
    var o;
    var result = [];
    for (var i = 0, l = outputs.length; i < l; i++) {
        o = outputs[i];
        result.push(o.mark ? ((o.negative ? '-' : '') + o.mark) : o);
    }
    return result.join(' ');
};



module.exports = function (equation) {
    return new SY(equation);
};

},{"./executor":"/home/zhouminming01/person/solver/src/lib/executor.js","./util":"/home/zhouminming01/person/solver/src/lib/util.js"}],"/home/zhouminming01/person/solver/src/lib/util.js":[function(require,module,exports){
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

},{}]},{},["./src/solver.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9zb2x2ZXIuanMiLCIvaG9tZS96aG91bWlubWluZzAxL3BlcnNvbi9zb2x2ZXIvc3JjL2xpYi9leGVjdXRvci5qcyIsIi9ob21lL3pob3VtaW5taW5nMDEvcGVyc29uL3NvbHZlci9zcmMvbGliL3NodW50aW5nWWFyZC5qcyIsIi9ob21lL3pob3VtaW5taW5nMDEvcGVyc29uL3NvbHZlci9zcmMvbGliL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoZ2xvYmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KGdsb2JhbCk7XG4gICAgfVxuXG59KHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdGhpcywgZnVuY3Rpb24gKGdsb2JhbCkge1xuXG4gICAgdmFyIHNodW50aW5nWWFyZCA9IHJlcXVpcmUoJy4vbGliL3NodW50aW5nWWFyZCcpO1xuICAgIHZhciBleGVjdXRvciA9IHJlcXVpcmUoJy4vbGliL2V4ZWN1dG9yJyk7XG5cbiAgICB2YXIgc29sdmVyID0ge1xuICAgICAgICAnc29sdmUnOiBmdW5jdGlvbiAoZXF1YXRpb24sIG9wdF9tYXJrc1ZhbHVlKSB7XG4gICAgICAgICAgICBlcXVhdGlvbiA9IHNvbHZlci5jb21waWxlKGVxdWF0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBlcXVhdGlvbi5zb2x2ZShvcHRfbWFya3NWYWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgICdjb21waWxlJzogZnVuY3Rpb24gKGVxdWF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gc2h1bnRpbmdZYXJkKGVxdWF0aW9uKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgZ2xvYmFsLnNvbHZlciA9IHNvbHZlcjtcblxuICAgIHJldHVybiBzb2x2ZXI7XG59KSk7XG5cbiIsInZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG52YXIgb3B0c0V4ZWMgPSB7XG4gICAgJysnOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB4ID0geCB8fCAwO1xuICAgICAgICByZXR1cm4geCArIHk7XG4gICAgfSxcbiAgICAnLSc6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHggPSB4IHx8IDA7XG4gICAgICAgIHJldHVybiB4IC0geTtcbiAgICB9LFxuICAgICcqJzogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5cXCd0IHNvbHZlIFwiJyArIHggKyAnKicgKyB5ICsgJ1wiLicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4ICogeTtcbiAgICB9LFxuICAgICcvJzogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5cXCd0IHNvbHZlIFwiJyArIHggKyAnLycgKyB5ICsgJ1wiLicpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh5ID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhblxcJ3QgZGl2aWRlIGJ5IHplcm8uJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHggLyB5O1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdzb2x2ZSc6IGZ1bmN0aW9uIChlcXVhdGlvbiwgb3B0X21hcmtzVmFsdWUpIHtcbiAgICAgICAgdmFyIG1hcmtzVmFsdWUgPSBvcHRfbWFya3NWYWx1ZSB8fCB7fTtcbiAgICAgICAgdmFyIG1hcmtWYWx1ZTtcbiAgICAgICAgdmFyIG91dHB1dHMgPSBlcXVhdGlvbi5vdXRwdXQ7XG4gICAgICAgIHZhciBvdXRwdXQ7XG4gICAgICAgIHZhciBzdGFjayA9IFtdO1xuICAgICAgICB2YXIgc2Vjb25kVmFsdWU7XG4gICAgICAgIHZhciBmaXJzdFZhbHVlO1xuICAgICAgICB2YXIgY29tcHV0ZWRWYWx1ZTtcbiAgICAgICAgdmFyIG9wdEV4ZWM7XG4gICAgICAgIHZhciBjYW50U29sdmVFcnJvciA9ICdDYW5cXCd0IHNvbHZlIFwiJyArIGVxdWF0aW9uLm9yaWdpbmFsICsgJ1wiLic7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb3V0cHV0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dHNbaV07XG4gICAgICAgICAgICBpZiAodXRpbC5nZXRPcFByaW9yaXR5KG91dHB1dCkpIHtcbiAgICAgICAgICAgICAgICAvLyBpcyBvcGVyYXRvclxuICAgICAgICAgICAgICAgIHNlY29uZFZhbHVlID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzZWNvbmRWYWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlyc3RWYWx1ZSA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBvcHRFeGVjID0gb3B0c0V4ZWNbb3V0cHV0XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmaXJzdFZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gMSArIDJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWUgPSBvcHRFeGVjKGZpcnN0VmFsdWUsIHNlY29uZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0xXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFZhbHVlID0gb3B0RXhlYyhudWxsLCBzZWNvbmRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3RWYWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gMSArIC0yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goY29tcHV0ZWRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoY2FudFNvbHZlRXJyb3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG91dHB1dCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAvLyBpcyBudW1iZXJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKG91dHB1dCk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvdXRwdXQubWFyayAmJiAobWFya1ZhbHVlID0gbWFya3NWYWx1ZVtvdXRwdXQubWFya10pKSB7XG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaChvdXRwdXQubmVnYXRpdmUgPyAoLTEgKiBtYXJrVmFsdWUpIDogbWFya1ZhbHVlKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNYXJrIFwiJyArIG91dHB1dCArICdcIlxcJ3MgdmFsdWUgbm90IGZvdW5kLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGNhbnRTb2x2ZUVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdGFja1swXTtcbiAgICB9XG59O1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBleGVjdXRvciA9IHJlcXVpcmUoJy4vZXhlY3V0b3InKTtcblxudmFyIFNZID0gZnVuY3Rpb24gKGVxdWF0aW9uKSB7XG4gICAgdGhpcy5vdXRwdXQgPSBbXTtcbiAgICB0aGlzLm1hcmtzID0gW107XG4gICAgdGhpcy5vcHMgPSBbXTtcbiAgICB0aGlzLmN1ck51bWJlciA9ICcnO1xuICAgIHRoaXMuY3VyTWFyayA9ICcnO1xuICAgIHRoaXMuY3VySXNNaW51cyA9IGZhbHNlO1xuICAgIHRoaXMub3JpZ2luYWwgPSBlcXVhdGlvbjtcbiAgICAvKipcbiAgICAgKiBuZXh0IGlucHV0IG1heSBiZSBuZWdhdGl2ZSBtYXJrXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgdGhpcy5uaW1ibm0gPSB0cnVlO1xuICAgIHRoaXMucGFyc2UoZXF1YXRpb24pO1xufTtcblxuU1kucHJvdG90eXBlLnBhcnNlTnVtYmVyID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgdmFyIGlzTnVtYmVyID0gdXRpbC5pc051bWJlcihpbnB1dCk7XG4gICAgaWYgKGlzTnVtYmVyKSB7XG4gICAgICAgIHRoaXMuY3VyTnVtYmVyICs9IGlucHV0O1xuICAgICAgICBpZiAodGhpcy5jdXJJc01pbnVzKSB7XG4gICAgICAgICAgICB0aGlzLmN1ck51bWJlciA9ICctJyArIHRoaXMuY3VyTnVtYmVyO1xuICAgICAgICAgICAgdGhpcy5jdXJJc01pbnVzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5uaW1ibm0gPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMuc2F2ZU51bWJlcigpO1xuICAgIH1cblxuICAgIHJldHVybiBpc051bWJlcjtcbn07XG5cblNZLnByb3RvdHlwZS5zYXZlTnVtYmVyID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmN1ck51bWJlcikge1xuICAgICAgICB0aGlzLm91dHB1dC5wdXNoKHBhcnNlRmxvYXQodGhpcy5jdXJOdW1iZXIsIDEwKSk7XG4gICAgICAgIHRoaXMuY3VyTnVtYmVyID0gJyc7XG4gICAgfVxufTtcblxuU1kucHJvdG90eXBlLnBhcnNlTWFyayA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgIHZhciBpc01hcmsgPSB1dGlsLmlzTWFyayhpbnB1dCk7XG4gICAgaWYgKGlzTWFyaykge1xuICAgICAgICB0aGlzLmN1ck1hcmsgKz0gaW5wdXQ7XG4gICAgICAgIGlmICh0aGlzLmN1cklzTWludXMpIHtcbiAgICAgICAgICAgIHRoaXMuY3VyTWFyayA9ICctJyArIHRoaXMuY3VyTWFyaztcbiAgICAgICAgICAgIHRoaXMuY3VySXNNaW51cyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubmltYm5tID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnNhdmVNYXJrKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzTWFyaztcbn07XG5cblNZLnByb3RvdHlwZS5zYXZlTWFyayA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5jdXJNYXJrKSB7XG4gICAgICAgIHZhciBuZWdhdGl2ZSA9IHRoaXMuY3VyTWFyay5jaGFyQXQoMCkgPT09ICctJztcbiAgICAgICAgdmFyIG1hcmsgPSBuZWdhdGl2ZSA/IHRoaXMuY3VyTWFyay5yZXBsYWNlKC9cXC0vZywgJycpIDogdGhpcy5jdXJNYXJrO1xuICAgICAgICB0aGlzLm91dHB1dC5wdXNoKHtcbiAgICAgICAgICAgIG5lZ2F0aXZlOiBuZWdhdGl2ZSxcbiAgICAgICAgICAgIG1hcms6IG1hcmtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubWFya3MucHVzaChtYXJrKTtcbiAgICAgICAgdGhpcy5jdXJNYXJrID0gJyc7XG4gICAgfVxufTtcblxuU1kucHJvdG90eXBlLnBhcnNlT3AgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgcHJpb3JpdHkgPSB1dGlsLmdldE9wUHJpb3JpdHkoaW5wdXQpO1xuICAgIGlmIChwcmlvcml0eSkge1xuICAgICAgICBpZiAodGhpcy5uaW1ibm0pIHtcbiAgICAgICAgICAgIC8vIDEgKyArMlxuICAgICAgICAgICAgLy8gMSArIC0yXG4gICAgICAgICAgICAvLyAxIC0gKjIgICBlcnJvclxuICAgICAgICAgICAgc3dpdGNoIChpbnB1dCkge1xuICAgICAgICAgICAgICAgIGNhc2UgJy0nOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cklzTWludXMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICcrJzpcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHRva2VuICcgKyBpbnB1dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJpb3JpdHk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpcyBvcFxuICAgICAgICB2YXIgbGFzdE9wO1xuICAgICAgICB2YXIgbGFzdFByaW9yaXR5O1xuICAgICAgICB3aGlsZSAobGFzdE9wID0gdGhpcy5vcHMucG9wKCkpIHtcbiAgICAgICAgICAgIGlmIChsYXN0T3AgPT09ICcoJykge1xuICAgICAgICAgICAgICAgIHRoaXMub3BzLnB1c2gobGFzdE9wKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGFzdFByaW9yaXR5ID0gdXRpbC5nZXRPcFByaW9yaXR5KGxhc3RPcCk7XG4gICAgICAgICAgICAvLyBjb25zaWRlciBhbGwgb3BlcmF0aW9ucyBhcmUgbGVmdCBiaW5kaW5nXG4gICAgICAgICAgICBpZiAocHJpb3JpdHkgPD0gbGFzdFByaW9yaXR5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vdXRwdXQucHVzaChsYXN0T3ApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHMucHVzaChsYXN0T3ApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vcHMucHVzaChpbnB1dCk7XG4gICAgICAgIHRoaXMubmltYm5tID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gISFwcmlvcml0eTtcbn07XG5cblxuU1kucHJvdG90eXBlLnNhdmVPcCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbGFzdE9wO1xuICAgIHdoaWxlIChsYXN0T3AgPSB0aGlzLm9wcy5wb3AoKSkge1xuICAgICAgICB0aGlzLm91dHB1dC5wdXNoKGxhc3RPcCk7XG4gICAgfVxufTtcblxuU1kucHJvdG90eXBlLnBhcnNlUkJyYWNrZXRzID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgdmFyIGlzUkJyYWNrZXRzID0gaW5wdXQgPT09ICcpJztcbiAgICBpZiAoaXNSQnJhY2tldHMpIHtcbiAgICAgICAgdmFyIGxhc3RPcDtcbiAgICAgICAgdmFyIGhhc01hdGNoQnJhY2tldHMgPSBmYWxzZTtcbiAgICAgICAgd2hpbGUgKGxhc3RPcCA9IHRoaXMub3BzLnBvcCgpKSB7XG4gICAgICAgICAgICBpZiAobGFzdE9wID09PSAnKCcpIHtcbiAgICAgICAgICAgICAgICBoYXNNYXRjaEJyYWNrZXRzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMub3V0cHV0LnB1c2gobGFzdE9wKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaGFzTWF0Y2hCcmFja2V0cykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBtYXRjaGVkIFwiKFwiLicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubmltYm5tID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzUkJyYWNrZXRzO1xufTtcblxuU1kucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKGVxKSB7XG4gICAgdmFyIGlucHV0O1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBlcS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaW5wdXQgPSBlcVtpXTtcbiAgICAgICAgaWYgKGlucHV0ID09PSAnICcpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucGFyc2VOdW1iZXIoaW5wdXQpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnBhcnNlTWFyayhpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlucHV0ID09PSAnKCcpIHtcbiAgICAgICAgICAgIHRoaXMub3BzLnB1c2goaW5wdXQpO1xuICAgICAgICAgICAgdGhpcy5uaW1ibm0gPSB0cnVlO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wYXJzZVJCcmFja2V0cyhpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucGFyc2VPcChpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIG9wZXJhdG9yczogXCInICsgaW5wdXQgKyAnXCIuJyk7XG4gICAgfVxuXG4gICAgdGhpcy5zYXZlTnVtYmVyKCk7XG4gICAgdGhpcy5zYXZlTWFyaygpO1xuICAgIHRoaXMuc2F2ZU9wKCk7XG59O1xuXG5TWS5wcm90b3R5cGUuZ2V0TWFya3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMubWFya3M7XG59O1xuXG5TWS5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbiAob3B0X21hcmtzVmFsdWUpIHtcbiAgICB2YXIgbWFya3NWYWx1ZSA9IG9wdF9tYXJrc1ZhbHVlIHx8IHt9O1xuICAgIHJldHVybiBleGVjdXRvci5zb2x2ZSh0aGlzLCBvcHRfbWFya3NWYWx1ZSk7XG59O1xuXG5TWS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG91dHB1dHMgPSB0aGlzLm91dHB1dDtcbiAgICB2YXIgbztcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBvdXRwdXRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBvID0gb3V0cHV0c1tpXTtcbiAgICAgICAgcmVzdWx0LnB1c2goby5tYXJrID8gKChvLm5lZ2F0aXZlID8gJy0nIDogJycpICsgby5tYXJrKSA6IG8pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LmpvaW4oJyAnKTtcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlcXVhdGlvbikge1xuICAgIHJldHVybiBuZXcgU1koZXF1YXRpb24pO1xufTtcbiIsInZhciBPUFMgPSB7XG4gICAgJysnOiAxLFxuICAgICcqJzogMixcbiAgICAnLSc6IDEsXG4gICAgJy8nOiAyXG59O1xudmFyIG51bWJlclJlZyA9IC9bMC05XFwuXS87XG52YXIgbWFya1JlZyA9IC9bYS16QS1aXS87XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldE9wUHJpb3JpdHk6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gT1BTW2lucHV0XTtcbiAgICB9LFxuICAgIGlzTnVtYmVyOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG51bWJlclJlZy50ZXN0KGlucHV0KTtcbiAgICB9LFxuICAgIGlzTWFyazogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBtYXJrUmVnLnRlc3QoaW5wdXQpO1xuICAgIH1cbn07XG4iXX0=
