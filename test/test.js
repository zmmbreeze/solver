var assert = require('assert')
var solver = require('../src/solver');

var testSolver = function (input, out, marks) {
    var eq = solver.compile(input);
    assert.equal(eq.output.join(' '), out);
    assert.equal(eq.marks.join(' '), marks);
};

describe('solver', function() {
    it ('solver.compile base', function() {
        testSolver('1 + 2', '1 2 +', '');
        testSolver('1-2', '1 2 -', '');
        testSolver('1*2', '1 2 *', '');
        testSolver('1 / 2', '1 2 /', '');
    });

    it ('solver.compile float number', function() {
        testSolver('1.2 + 12', '1.2 12 +', '');
        testSolver('12 + 1.2', '12 1.2 +', '');
    });

    it ('solver.compile minus', function() {
        testSolver('-12 + 2', '12 - 2 +', '');
    });

    it ('solver.compile space test', function() {
        testSolver('12 + 2', '12 2 +', '');
        testSolver('1-23', '1 23 -', '');
        testSolver('112*23', '112 23 *', '');
        testSolver('12 / 244', '12 244 /', '');
    });

    it ('solver.compile multi operator', function() {
        testSolver('12 + 2*3', '12 2 3 * +', '');
        testSolver('1 / 2-23', '1 2 / 23 -', '');
    });

    it ('solver.compile bracket', function() {
        testSolver('(12 + 2)*3', '12 2 + 3 *', '');
        testSolver('1 / (2-23)', '1 2 23 - /', '');
        testSolver('1 + 2 / (2*23)', '1 2 2 23 * / +', '');
        testSolver('(1 + 2 ) / (2*23)', '1 2 + 2 23 * /', '');
        testSolver('31 + 42 * 23 / ( 14 - 255 )', '31 42 23 * 14 255 - / +', '');
    });

    it ('solver.compile mark', function() {
        testSolver('x + 23 / (12*y)', 'x 23 12 y * / +', 'x y');
        testSolver('(x + 23) / ( x*y )', 'x 23 + x y * /', 'x x y');
    });
});

