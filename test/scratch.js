process.chdir(__dirname);
const clapi = require('./../index');

const npm = new clapi('npm');

(async () => {

    const log = lines => console.log(lines.join('\n'));

    try {
        log(await npm.ls('typescript'));
        log(await npm.ls('typescript'));
        log(await npm['-v']());
        log(await npm('-v'));
    } catch (e) {
        console.error(e);
    }

})();
