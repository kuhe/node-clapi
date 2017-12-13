# node-clapi

This is an experiment using `Proxy` in nodejs as well as trying out `typescript`.

This module, known as `clapi` generates node api wrappers around command line programs
much like `shelljs`, but is much less useful :D.

```js
const clapi = require('clapi');

```

For any given command line string such as `eslint lib src controllers` (4 args), you can
wrap as much of the beginning of it in `clapi` as you want.

Method calls then dispatch the constructed CLI string and return a promise resolving to the `stdout` of the command.

As such, the following are equivalent:

```js

const eslint = new clapi('eslint');

// 1.
eslint('lib src controllers'); // -> Promise<stdout>

// 2.
eslint('lib', 'src', 'controllers'); // -> Promise<stdout>

// 3.
eslint.lib('src', 'controllers'); // -> Promise<stdout>
                                  // any method call is treated equivalently as the first argument (!)

```

The `Proxy` implementation intercepts the property access to `lib` which is undefined, and instead
 returns a `Function<Promise<stdout>>` method that will forward its arguments to the command line via
 `child_process.exec`.

In `shelljs` this would be something like `shelljs.exec(`eslint lib src controllers`).stdout;`.

###### @todo: how do you maintain an open process with child_process.spawn?


### Well... what can you even do with it?

I don't know! You can pretend to have node APIs for command line programs.

```js

// Commit something?
const git = new clapi('git');
git.commit('-am work in progress').then(() => {

    return git.push();

});

// Compile and execute hello.cpp?

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
