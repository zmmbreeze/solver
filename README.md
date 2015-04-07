solver
============

Help you solve simple mathematical expressions.

    1 + 1 = 2

API
--

### solver.solve

    solver.solve('2 + 2 / (2*1)') === 3;
    solver.solve('x + y * 3', {
        x: 1,
        y: 2
    }) === 7;

### solver.compile

    var eq = solver.compile('1 + 3 * x');
    eq.solve({ x: 1 }) === 4;
    eq.solve({ x: 2 }) === 7;
    eq.solve({ x: 3 }) === 10;

Install
--


