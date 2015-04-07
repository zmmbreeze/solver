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
