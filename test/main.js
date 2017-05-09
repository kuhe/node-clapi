const Cliw = require('./../index');
const assert_ = require('assert');
/**
 * @type {string[]}
 */
const results = [];
const done = function () {
    for (result of results) {
        console.log(result);
    }
    results.length = 0;
};
const assert = function (assertion, msg) {
    try {
        assert_(assertion);
        results.push('OK: ' + msg);
    } catch (e) {
        results.push('FAILURE: ' + msg);
        console.error(e);
    }
};
assert.equal = function (a, b, msg) {
    try {
        assert_.equal(a, b, msg);
        results.push('OK: ' + msg);
    } catch (e) {
        results.push('FAILURE: ' + msg);
        console.error(e);
    }
};
const logToConsole = function (stdout) {
    console.log(...stdout);
    return stdout;
};

assert.equal(typeof Cliw, 'function', 'cliw should be a constructor');

const du = new Cliw('du');
const echo = new Cliw('echo');
const npm = new Cliw('npm');

assert.equal(typeof du, 'function', 'instantiated Cliw are callable');
assert.equal(typeof echo, 'function', 'instantiated Cliw are callable');
assert.equal(typeof npm, 'function', 'instantiated Cliw are callable');

const greeting = 'hello, world';

Promise.resolve()
    .then(() => {
        return du['-sh']('./../src/*');
    })
    .then(logToConsole)
    .then(stdout => {

        assert(stdout instanceof Array, 'output is an array');

        for (const item of [...stdout]) {
            assert.equal(typeof item, 'string', 'output item is a string');
        }

    })
    .then(() => {

        return echo(greeting);

    })
    .then(logToConsole)
    .then(stdout => {

        assert.equal(stdout[0].trim(), 'echo: ' + greeting, 'stdout by echo should equal its input');

    })
    .then(() => {

        return npm.ls('typescript');

    })
    .then(logToConsole)
    .then(stdout => {

        assert.equal(stdout.join('\n'), `npm: cli-to-node@0.1.0 /Users/fu/www/github/cli-to-node
npm: └── typescript@2.3.2 `, 'npm ls check')

    })
    .then(() => {

        const git = new Cliw('git');

        git.commit(`-am 'initial'`);

        return git.status();

    })
    .then(logToConsole)
    .then(done);
