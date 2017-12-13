process.chdir(__dirname);
const path = require('path');
const clapi = require('./../index');
const assert_ = require('assert');
/**
 * @type {string[]}
 */
const results = [];
const logResults = function () {
    for (const result of results) {
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
        results.push(e);
    }
};

assert.equal(typeof clapi, 'function', 'clapi should be a constructor');

const du = new clapi('du');
const echo = new clapi('echo');
const npm = new clapi('npm');

assert.equal(typeof du, 'function', 'instantiated clapi are callable');
assert.equal(typeof echo, 'function', 'instantiated clapi are callable');
assert.equal(typeof npm, 'function', 'instantiated clapi are callable');

const greeting = 'Hello, world!';

(async () => {

    var stdout;

    const pwd = new clapi('pwd');
    stdout = await pwd();
    assert.equal(stdout[0].split('/').pop(), 'test', 'pwd is test directory');

    const ls = new clapi('ls');
    stdout = await ls();
    assert.equal(
        stdout.filter(_ => _ === path.basename(__filename))[0],
        path.basename(__filename),
        'test directory contains this test file'
    );

    stdout = await du['-sh']('./../src/*');
    assert(stdout instanceof Array, 'output is an array');
    for (const item of [...stdout]) {
        assert.equal(typeof item, 'string', 'output item is a string');
    }

    stdout = await echo(greeting);
    assert.equal(stdout[0].trim(), greeting, 'stdout by echo should equal its input');

    stdout = await npm.ls('typescript');
    assert(stdout.join('').includes('typescript@'), 'typescript is installed');

    const cat = new clapi('cat');
    process.chdir('..');

    const out = await cat['package.json']('| grep version');
    out[0] = out[0].match(/\d\.\d\.\d/g)[0];
    process.chdir('test');
    const actualVersion = require(__dirname + '/../package.json').version;
    assert.equal(out[0], actualVersion, 'shell command finds pkg version');

    const gpp = new clapi('g++');
    await gpp['hello.cpp']('-o', 'hello');
    const hello = new clapi('./hello');
    stdout = await hello();
    assert.equal(stdout[0], greeting, 'compiled C++ program');
    const rm = new clapi('rm');
    await rm.hello();

    return logResults();

})();
