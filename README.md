# bam-node-clapi

This is an experiment using `Proxy` in nodejs as well as trying out `typescript`.

This module, known as `clapi` generates node api wrappers around command line programs
much like `shelljs`, but is much less useful :D.

```js
const clapi = require('clapi');

```

For any given command line string such as `eslint lib src controllers` (4 args), you can
wrap as much of the start of it in `clapi` as you want.

Method calls then dispatch the constructed CLI string and return a promise resolving to the `stdout` of the command.

As such, the following are equivalent:

```js

const eslint = new clapi('eslint');

// 1.
eslint('lib src controllers');

// 2.
eslint('lib', 'src', 'controllers');

// 3.
eslint.lib('src', 'controllers'); // any method call is treated equivalently as the first argument

// Yes, the proxy traps the method call to an otherwise undefined property `lib` on our `clapi` instance.

eslint.src().then(output => {

    console.log(...output);

});


```

##### Well... what can you even do with it?

I don't know! You can pretend to have node APIs for command line programs.

```js

// Commit something!
const git = new clapi('git');
git.commit('-am work in progress').then(() => {

    return git.push();

});

// Compile and execute hello.cpp!

const gpp = new clapi('g++');

gpp['hello.cpp']('-o', 'hello').then(() => {

    const hello = new clapi('./hello');
    return hello();

}).then(output => {

    assert(output[0] === 'Hello, world!');
    const rm = new clapi('rm');

    return rm.hello();

});


// ???

const npm = new clapi('npm');

npm.ls('typescript'); // check a dependency
npm.test(); // run your tests


```
