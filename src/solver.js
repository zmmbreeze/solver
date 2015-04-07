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

