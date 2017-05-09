process.chdir(__dirname);
const path = require('path');
const clapi = require('./../index');
const assert_ = require('assert');
/**
 * @type {string[]}
 */
const results = [];
const logResults = function () {
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
        results.push(e);
    }
};
const logToConsole = function (stdout) {
    if (stdout instanceof Array) {
        stdout.forEach(line => {
            console.log(line);
        });
    } else {
        console.log(stdout);
    }
    return stdout;
};

assert.equal(typeof clapi, 'function', 'clapi should be a constructor');

const du = new clapi('du');
const echo = new clapi('echo');
const npm = new clapi('npm');

assert.equal(typeof du, 'function', 'instantiated clapi are callable');
assert.equal(typeof echo, 'function', 'instantiated clapi are callable');
assert.equal(typeof npm, 'function', 'instantiated clapi are callable');

const greeting = 'Hello, world!';

[Promise.resolve(),
    () => {

        const pwd = new clapi('pwd');
        return pwd();

    },
    logToConsole,
    stdout => {

        assert.equal(stdout[0].split('/').pop(), 'test', 'pwd is test directory');
        return 0;

    },
    () => {

        const ls = new clapi('ls');
        return ls();

    },
    logToConsole,
    stdout => {

        assert.equal(
            stdout.filter(_ => _ === path.basename(__filename))[0],
            path.basename(__filename),
            'test directory contains this test file'
        );
        return 0;

    },
    () => {

        return du['-sh']('./../src/*');
        // return du('-sh', './');

    },
    logToConsole,
    stdout => {

        assert(stdout instanceof Array, 'output is an array');

        for (const item of [...stdout]) {
            assert.equal(typeof item, 'string', 'output item is a string');
        }
        return 0;

    },
    () => {

        return echo(greeting);

    },
    logToConsole,
    stdout => {

        assert.equal(stdout[0].trim(), greeting, 'stdout by echo should equal its input');
        return 0;

    },
    () => {

        return npm.ls('typescript');

    },
    logToConsole,
    stdout => {

        assert(stdout.join('').includes('typescript@'));
        return 0;

    },
    () => {

        const git = new clapi('git');
        return git.status();

    },
    logToConsole,
    () => {

        const aws = new clapi('aws');
        return aws.configure('list');

    },
    logToConsole,
    () => {

        const cat = new clapi('cat');

        process.chdir('..');

        return cat['package.json']('| grep version')
            .then(out => {
                out[0] = out[0].match(/\d\.\d\.\d/g)[0];

                process.chdir('test');

                return out;
            });

    },
    logToConsole,
    stdout => {

        const actualVersion = require(__dirname + '/../package.json').version;
        assert.equal(stdout[0], actualVersion, 'shell command finds pkg version');
        return 0;

    },
    () => {

        const gpp = new clapi('g++');
        return gpp['hello.cpp']('-o', 'hello')
            .then(() => {

                const hello = new clapi('./hello');
                return hello();

            });

    },
    logToConsole,
    stdout => {

        assert.equal(stdout[0], greeting, 'lol');
        return 0;

    },
    () => {

        const rm = new clapi('rm');
        rm.hello();

    }

].reduce((a, b) => {

    return a.then(b);

}).catch(error => {

    if (error instanceof Array) {
        console.error(...error);
    } else {
        console.error(error);
    }
    return 1;

}).then(logResults);
