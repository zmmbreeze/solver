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
