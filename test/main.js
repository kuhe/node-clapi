process.chdir(__dirname);
const path = require('path');
const Cliw = require('./../index');
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

[Promise.resolve(),
    () => {

        const pwd = new Cliw('pwd');
        return pwd();

    },
    logToConsole,
    stdout => {

        assert.equal(stdout[0].split('/').pop(), 'test', 'pwd is test directory');
        return 0;

    },
    () => {

        const ls = new Cliw('ls');
        return ls();

    },
    logToConsole,
    stdout => {

        assert.equal(stdout[0].trim(), 'ls: ' + path.basename(__filename), 'test directory contains this test file');
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

        assert.equal(stdout[0].trim(), 'echo: ' + greeting, 'stdout by echo should equal its input');
        return 0;

    },
    () => {

        return npm.ls('typescript');

    },
    logToConsole,
    stdout => {

        assert.equal(stdout.join('\n'), `npm: cli-to-node@0.1.0 /Users/fu/www/github/cli-to-node
npm: └── typescript@2.3.2 `, 'npm ls check');
        return 0;

    },
    () => {

        const git = new Cliw('git');
        return git.status();

    },
    logToConsole,
    () => {

        const aws = new Cliw('aws');
        return aws.configure('list');

    },
    logToConsole,
    () => {

        const shell = new Cliw('');

        const cd = shell('cd ..');
        const getVersion = () => {
            return shell(`# Version key/value should be on his own line
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')

echo $PACKAGE_VERSION`);
        };

        return cd.then(getVersion);
    },
    logToConsole,
    stdout => {

        const actualVersion = require(__dirname + '/../package.json').version;
        assert.equal(stdout[0], 'SHELL: ' + actualVersion, 'shell command to find pkg version');
        return 0;

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
