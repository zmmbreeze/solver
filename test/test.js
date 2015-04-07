var assert = require('assert')
var solver = require('../src/solver');

describe('solver', function() {
    describe('solver.compile', function() {
        var testSolver = function (input, out, marks) {
            var eq = solver.compile(input);
            assert.equal(eq.toString(), out);
            assert.equal(eq.marks.join(' '), marks);
        };
        it('base', function() {
            testSolver('1 + 2', '1 2 +', '');
            testSolver('1-2', '1 2 -', '');
            testSolver('1*2', '1 2 *', '');
            testSolver('1 / 2', '1 2 /', '');
        });

        it('space test', function() {
            testSolver('12 + 2', '12 2 +', '');
            testSolver('1-23', '1 23 -', '');
            testSolver('112*23', '112 23 *', '');
            testSolver('12 / 244', '12 244 /', '');
        });

        it('float number', function() {
            testSolver('1.2 + 12', '1.2 12 +', '');
            testSolver('12 + 1.2', '12 1.2 +', '');
        });

        it('multi operator', function() {
            testSolver('12 + 2*3', '12 2 3 * +', '');
            testSolver('1 / 2-23', '1 2 / 23 -', '');
        });

        it('bracket', function() {
            testSolver('(12 + 2)*3', '12 2 + 3 *', '');
            testSolver('1 / (2-23)', '1 2 23 - /', '');
            testSolver('1 + 2 / (2*23)', '1 2 2 23 * / +', '');
            testSolver('(1 + 2 ) / (2*23)', '1 2 + 2 23 * /', '');
            testSolver('31 + 42 * 23 / ( 14 - 255 )', '31 42 23 * 14 255 - / +', '');
        });

        it('minus', function() {
            testSolver('-12 + 2', '-12 2 +', '');
            testSolver('12 + -2', '12 -2 +', '');
            testSolver('12 + (-2)', '12 -2 +', '');
            testSolver('12 + (-2 * 3)', '12 -2 3 * +', '');
            testSolver('(-2 / 34) + 12', '-2 34 / 12 +', '');
            testSolver('1 + 25 / (-10)', '1 25 -10 / +', '');
        });

        it('mark', function() {
            testSolver('x + 25 / (-10*yy)', 'x 25 -10 yy * / +', 'x yy');
            testSolver('x + 25 / (10*-yy)', 'x 25 10 -yy * / +', 'x yy');
            testSolver('(x + 23) / ( x*y )', 'x 23 + x y * /', 'x x y');
        });
    });

    describe('solver.solve', function() {
        var testSolver = function (input, result, marks) {
            assert.equal(solver.solve(input, marks), result || eval(input));
        };

        it('base', function() {
            testSolver('1 + 4', 5);
            testSolver('1 * 4', 4);
            testSolver('1 - 4', -3);
            testSolver('1/4', 0.25);
        });

        it('float number', function() {
            testSolver('1.5 + 4.3', 5.8);
            testSolver('1.5 * 2', 3);
            testSolver('2.5 - 3.4', 2.5 - 3.4);
            testSolver('1/2.5', 1/2.5);
        });

        it('multi operator', function() {
            testSolver('12 + 2*3', 18);
            testSolver('1 / 2-23', -22.5);
        });

        it('bracket', function() {
            testSolver('(12 + 2)*3', 42);
            testSolver('1 / (2-23)');
            testSolver('1 + 2 / (2*23)');
            testSolver('(1 + 2 ) / (2*23)');
            testSolver('31 + 42 * 23 / ( 14 - 255 )');
        });

        it('minus', function() {
            testSolver('-12 + 2');
            testSolver('12 + -2');
            testSolver('12 + (-2)');
            testSolver('12 + (-2 * 3)');
            testSolver('(-2 / 34) + 12');
        });

        it('mark', function() {
            testSolver('2 + 25 / -10*10'); // 2 25 / + 10 10 * -
            testSolver('x + 25 / (-10*yy)', 1.75, {'x': 2, 'yy': 10});
            testSolver('(x + -25) / ( x*y )', -0.2, {'x': 5, 'y': 20});
        });
    });
});

