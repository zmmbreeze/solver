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

    global.solver = {
        'solve': function (equation, opt_marksValue) {
            equation = solver.compile(equation);
            return equation.solve(opt_marksValue);
        },
        'compile': function (equation) {
            return shuntingYard(equation);
        }
    };

    return global.solver;
}));


},{"./lib/executor":"/Users/zmm/person/solver/src/lib/executor.js","./lib/shuntingYard":"/Users/zmm/person/solver/src/lib/shuntingYard.js"}],"/Users/zmm/person/solver/src/lib/executor.js":[function(require,module,exports){
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

},{"./util":"/Users/zmm/person/solver/src/lib/util.js"}],"/Users/zmm/person/solver/src/lib/shuntingYard.js":[function(require,module,exports){
var util = require('./util');
var executor = require('./executor');

var SY = function (equation) {
    this.output = [];
    this.marks = [];
    this.ops = [];
    this.curNumber = '';
    this.curMark = '';
    this.equation = equation;
    this.parse(equation);
};

SY.prototype.parseNumber = function (input) {
    var isNumber = util.isNumber(input);
    if (isNumber) {
        this.curNumber += input;
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
    }
    else {
        this.saveMark();
    }

    return isMark;
};

SY.prototype.saveMark = function () {
    if (this.curMark) {
        this.output.push(this.curMark);
        this.marks.push(this.curMark);
        this.curMark = '';
    }
};

SY.prototype.parseOp = function (input) {
    var priority = util.getOpPriority(input);
    if (priority) {
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
    return executor.solve(opt_marksValue);
};



module.exports = function (equation) {
    return new SY(equation);
};

},{"./executor":"/Users/zmm/person/solver/src/lib/executor.js","./util":"/Users/zmm/person/solver/src/lib/util.js"}],"/Users/zmm/person/solver/src/lib/util.js":[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9zb2x2ZXIuanMiLCIvVXNlcnMvem1tL3BlcnNvbi9zb2x2ZXIvc3JjL2xpYi9leGVjdXRvci5qcyIsIi9Vc2Vycy96bW0vcGVyc29uL3NvbHZlci9zcmMvbGliL3NodW50aW5nWWFyZC5qcyIsIi9Vc2Vycy96bW0vcGVyc29uL3NvbHZlci9zcmMvbGliL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoZ2xvYmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3J5KGdsb2JhbCk7XG4gICAgfVxuXG59KHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdGhpcywgZnVuY3Rpb24gKGdsb2JhbCkge1xuXG4gICAgdmFyIHNodW50aW5nWWFyZCA9IHJlcXVpcmUoJy4vbGliL3NodW50aW5nWWFyZCcpO1xuICAgIHZhciBleGVjdXRvciA9IHJlcXVpcmUoJy4vbGliL2V4ZWN1dG9yJyk7XG5cbiAgICBnbG9iYWwuc29sdmVyID0ge1xuICAgICAgICAnc29sdmUnOiBmdW5jdGlvbiAoZXF1YXRpb24sIG9wdF9tYXJrc1ZhbHVlKSB7XG4gICAgICAgICAgICBlcXVhdGlvbiA9IHNvbHZlci5jb21waWxlKGVxdWF0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBlcXVhdGlvbi5zb2x2ZShvcHRfbWFya3NWYWx1ZSk7XG4gICAgICAgIH0sXG4gICAgICAgICdjb21waWxlJzogZnVuY3Rpb24gKGVxdWF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gc2h1bnRpbmdZYXJkKGVxdWF0aW9uKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZ2xvYmFsLnNvbHZlcjtcbn0pKTtcblxuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBvcHRzRXhlYyA9IHtcbiAgICAnKyc6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHJldHVybiB4ICsgeTtcbiAgICB9LFxuICAgICctJzogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHggLSB5O1xuICAgIH0sXG4gICAgJyonOiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICByZXR1cm4geCAqIHk7XG4gICAgfSxcbiAgICAnLyc6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIHJldHVybiB4IC8geTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnc29sdmUnOiBmdW5jdGlvbiAoZXF1YXRpb24sIG9wdF9tYXJrc1ZhbHVlKSB7XG4gICAgICAgIHZhciBtYXJrc1ZhbHVlID0gb3B0X21hcmtzVmFsdWUgfHwge307XG4gICAgICAgIHZhciBtYXJrVmFsdWU7XG4gICAgICAgIHZhciBvdXRwdXRzID0gZXF1YXRpb24ub3V0cHV0O1xuICAgICAgICB2YXIgb3V0cHV0O1xuICAgICAgICB2YXIgc3RhY2s7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gb3V0cHV0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIG91dHB1dCA9IG91dHB1dHNbaV07XG4gICAgICAgICAgICBpZiAodXRpbC5nZXRPcFByaW9yaXR5KG91dHB1dCkpIHtcbiAgICAgICAgICAgICAgICAvLyBpcyBvcGVyYXRvclxuICAgICAgICAgICAgICAgIHZhciBzZWNvbmRWYWx1ZSA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgIHZhciBmaXJzdFZhbHVlID0gc3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaChvcHRzRXhlY1tvdXRwdXRdKGZpcnN0VmFsdWUsIHNlY29uZFZhbHVlKSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3V0cHV0ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIC8vIGlzIG51bWJlclxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2gob3V0cHV0KTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG1hcmtWYWx1ZSA9IG1hcmtzVmFsdWVbb3V0cHV0XSkge1xuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2gobWFya1ZhbHVlKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdNYXJrIFwiJyArIG91dHB1dCArICdcIlxcJ3MgdmFsdWUgbm90IGZvdW5kLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5cXCd0IHNvbHZlIFwiJyArICArICdcIi4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdGFja1swXTtcbiAgICB9XG59O1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwnKTtcbnZhciBleGVjdXRvciA9IHJlcXVpcmUoJy4vZXhlY3V0b3InKTtcblxudmFyIFNZID0gZnVuY3Rpb24gKGVxdWF0aW9uKSB7XG4gICAgdGhpcy5vdXRwdXQgPSBbXTtcbiAgICB0aGlzLm1hcmtzID0gW107XG4gICAgdGhpcy5vcHMgPSBbXTtcbiAgICB0aGlzLmN1ck51bWJlciA9ICcnO1xuICAgIHRoaXMuY3VyTWFyayA9ICcnO1xuICAgIHRoaXMuZXF1YXRpb24gPSBlcXVhdGlvbjtcbiAgICB0aGlzLnBhcnNlKGVxdWF0aW9uKTtcbn07XG5cblNZLnByb3RvdHlwZS5wYXJzZU51bWJlciA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgIHZhciBpc051bWJlciA9IHV0aWwuaXNOdW1iZXIoaW5wdXQpO1xuICAgIGlmIChpc051bWJlcikge1xuICAgICAgICB0aGlzLmN1ck51bWJlciArPSBpbnB1dDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMuc2F2ZU51bWJlcigpO1xuICAgIH1cblxuICAgIHJldHVybiBpc051bWJlcjtcbn07XG5cblNZLnByb3RvdHlwZS5zYXZlTnVtYmVyID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLmN1ck51bWJlcikge1xuICAgICAgICB0aGlzLm91dHB1dC5wdXNoKHBhcnNlRmxvYXQodGhpcy5jdXJOdW1iZXIsIDEwKSk7XG4gICAgICAgIHRoaXMuY3VyTnVtYmVyID0gJyc7XG4gICAgfVxufTtcblxuU1kucHJvdG90eXBlLnBhcnNlTWFyayA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgIHZhciBpc01hcmsgPSB1dGlsLmlzTWFyayhpbnB1dCk7XG4gICAgaWYgKGlzTWFyaykge1xuICAgICAgICB0aGlzLmN1ck1hcmsgKz0gaW5wdXQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnNhdmVNYXJrKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzTWFyaztcbn07XG5cblNZLnByb3RvdHlwZS5zYXZlTWFyayA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5jdXJNYXJrKSB7XG4gICAgICAgIHRoaXMub3V0cHV0LnB1c2godGhpcy5jdXJNYXJrKTtcbiAgICAgICAgdGhpcy5tYXJrcy5wdXNoKHRoaXMuY3VyTWFyayk7XG4gICAgICAgIHRoaXMuY3VyTWFyayA9ICcnO1xuICAgIH1cbn07XG5cblNZLnByb3RvdHlwZS5wYXJzZU9wID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgdmFyIHByaW9yaXR5ID0gdXRpbC5nZXRPcFByaW9yaXR5KGlucHV0KTtcbiAgICBpZiAocHJpb3JpdHkpIHtcbiAgICAgICAgLy8gaXMgb3BcbiAgICAgICAgdmFyIGxhc3RPcDtcbiAgICAgICAgdmFyIGxhc3RQcmlvcml0eTtcbiAgICAgICAgd2hpbGUgKGxhc3RPcCA9IHRoaXMub3BzLnBvcCgpKSB7XG4gICAgICAgICAgICBpZiAobGFzdE9wID09PSAnKCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wcy5wdXNoKGxhc3RPcCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxhc3RQcmlvcml0eSA9IHV0aWwuZ2V0T3BQcmlvcml0eShsYXN0T3ApO1xuICAgICAgICAgICAgLy8gY29uc2lkZXIgYWxsIG9wZXJhdGlvbnMgYXJlIGxlZnQgYmluZGluZ1xuICAgICAgICAgICAgaWYgKHByaW9yaXR5IDw9IGxhc3RQcmlvcml0eSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3V0cHV0LnB1c2gobGFzdE9wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMub3BzLnB1c2gobGFzdE9wKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMub3BzLnB1c2goaW5wdXQpO1xuICAgIH1cblxuICAgIHJldHVybiAhIXByaW9yaXR5O1xufTtcblxuXG5TWS5wcm90b3R5cGUuc2F2ZU9wID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXN0T3A7XG4gICAgd2hpbGUgKGxhc3RPcCA9IHRoaXMub3BzLnBvcCgpKSB7XG4gICAgICAgIHRoaXMub3V0cHV0LnB1c2gobGFzdE9wKTtcbiAgICB9XG59O1xuXG5TWS5wcm90b3R5cGUucGFyc2VSQnJhY2tldHMgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgaXNSQnJhY2tldHMgPSBpbnB1dCA9PT0gJyknO1xuICAgIGlmIChpc1JCcmFja2V0cykge1xuICAgICAgICB2YXIgbGFzdE9wO1xuICAgICAgICB2YXIgaGFzTWF0Y2hCcmFja2V0cyA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAobGFzdE9wID0gdGhpcy5vcHMucG9wKCkpIHtcbiAgICAgICAgICAgIGlmIChsYXN0T3AgPT09ICcoJykge1xuICAgICAgICAgICAgICAgIGhhc01hdGNoQnJhY2tldHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5vdXRwdXQucHVzaChsYXN0T3ApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFoYXNNYXRjaEJyYWNrZXRzKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIG1hdGNoZWQgXCIoXCIuJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaXNSQnJhY2tldHM7XG59O1xuXG5TWS5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbiAoZXEpIHtcbiAgICB2YXIgaW5wdXQ7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGVxLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBpbnB1dCA9IGVxW2ldO1xuICAgICAgICBpZiAoaW5wdXQgPT09ICcgJykge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wYXJzZU51bWJlcihpbnB1dCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucGFyc2VNYXJrKGlucHV0KSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5wdXQgPT09ICcoJykge1xuICAgICAgICAgICAgdGhpcy5vcHMucHVzaChpbnB1dCk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnBhcnNlUkJyYWNrZXRzKGlucHV0KSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wYXJzZU9wKGlucHV0KSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gb3BlcmF0b3JzOiBcIicgKyBpbnB1dCArICdcIi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLnNhdmVOdW1iZXIoKTtcbiAgICB0aGlzLnNhdmVNYXJrKCk7XG4gICAgdGhpcy5zYXZlT3AoKTtcbn07XG5cblNZLnByb3RvdHlwZS5nZXRNYXJrcyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5tYXJrcztcbn07XG5cblNZLnByb3RvdHlwZS5zb2x2ZSA9IGZ1bmN0aW9uIChvcHRfbWFya3NWYWx1ZSkge1xuICAgIHZhciBtYXJrc1ZhbHVlID0gb3B0X21hcmtzVmFsdWUgfHwge307XG4gICAgcmV0dXJuIGV4ZWN1dG9yLnNvbHZlKG9wdF9tYXJrc1ZhbHVlKTtcbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlcXVhdGlvbikge1xuICAgIHJldHVybiBuZXcgU1koZXF1YXRpb24pO1xufTtcbiIsInZhciBPUFMgPSB7XG4gICAgJysnOiAxLFxuICAgICcqJzogMixcbiAgICAnLSc6IDEsXG4gICAgJy8nOiAyXG59O1xudmFyIG51bWJlclJlZyA9IC9bMC05XFwuXS87XG52YXIgbWFya1JlZyA9IC9bYS16QS1aXS87XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldE9wUHJpb3JpdHk6IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICByZXR1cm4gT1BTW2lucHV0XTtcbiAgICB9LFxuICAgIGlzTnVtYmVyOiBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuIG51bWJlclJlZy50ZXN0KGlucHV0KTtcbiAgICB9LFxuICAgIGlzTWFyazogZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBtYXJrUmVnLnRlc3QoaW5wdXQpO1xuICAgIH1cbn07XG4iXX0=
