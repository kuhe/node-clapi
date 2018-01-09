/** structural typedefs */
declare interface process {
    cwd(): string;
}
declare const process: process;
declare interface EventEmitter {
    on(event: string, fn: Function): void;
}
declare interface Writable extends EventEmitter {
    write(input: string, encoding: string, callback: IoCallback): void;
}
declare interface ChildProcess extends EventEmitter {
    new(): any;
    stdin: Writable;
    stdout: EventEmitter;
    stderr: EventEmitter;
    disconnect: Function;
    connected: boolean;
}
declare interface child_process {
    ChildProcess: ChildProcess;
    spawn(cmd: string, argv: string[]): ChildProcess;
    spawn(cmd: string, argv: string[], options: object): ChildProcess;
    exec(command: string, callback: Function): ChildProcess;
}
declare interface Require {
    (module: string): any;
}
declare const require: Require;
declare interface ProxyHandler {
    get (target: object, name: string): any;
    set (object: object, property: string, value: any): any;
}
declare interface Proxy extends clapi {
    new (object: object, handler: ProxyHandler): any;
}
declare const Proxy: Proxy;
declare interface IoCallback {
    (error: string, stdout: string, stderr: string): void;
}
/** end structural typedefs */

const child_process: child_process = require('child_process');

/**
 *
 * @module
 *
 * The clapi class wraps any command line executable in a NodeJS class.
 *
 * @example
 *
 * const clapi = require('node-clapi');
 *
 * const echo = new clapi('echo');
 * echo('hello, world').then(...); // Promise<string>
 *
 * @example
 *
 * const du = new clapi('du');
 *
 * // call directly:
 * du('-sh', './src/*').then(...);
 *
 * // call arbitrary method representing first cli argument:
 * du['-sh']('./src/*').then(...);
 *
 */
export default class clapi {

    /**
     * The main command to be represented by this instance e.g.
     * du
     * echo
     * sh
     * npm
     * git
     * ... etc.
     */
    public command: string = '';

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
     */
    public proxy: Proxy;

    /**
     * Prepended to io buffer entries.
     */
    public prefix: string = '';

    /**
     * Any stdout or stderr generated by this instance will be entered here.
     */
    public ioBuffer: string[] = null;

    /**
     * Node handle.
     */
    public process: ChildProcess = null;

    /**
     * Try to spawn instead of exec from child_process.
     */
    public spawn: boolean = false;

    /**
     * The promise generated by the last command issued to this instance.
     */
    public queue: Promise<string[]> = null;

    /**
     * @note Copy-construction enabled.
     * @param command can be any CLI command.
     * @param [spawn] try to spawn child processes instead of using exec.
     * @param [prefix] to be prepended to the ioBuffer log.
     * @returns {Proxy}
     */
    public constructor(command: string|clapi,
                       spawn: boolean = false,
                       prefix: string = '') {

        if (command instanceof clapi) {
            return this.copyConstructor(command);
        }

        this.spawn = spawn;
        this.command = command;
        this.prefix = prefix;
        const ioBuffer: string[] = this.ioBuffer = (this.ioBuffer || []);

        const callable = function (...argv: string[]) {
            return this.dispatchCommand(ioBuffer, command, ...argv);
        }.bind(this);

        Object.setPrototypeOf(callable, clapi.prototype);

        this.proxy = new Proxy(callable, this.handler());
        return this.proxy;

    }

    /**
     * Invoking any method on a clapi instance will result in
     * the base command being dispatched with the method name as its first argument.
     *
     * Any number of arguments to the method will be appended as additional CLI arguments.
     *
     * @param {...string} argv any number of command line arguments.
     */
    public async ['__any_command__'](...argv: string[]): Promise<string> {
        // shell exec this.command + argv
        return '__the_stdout_of_that_command__';
    }

    /**
     * Immediately console log everything from the ioBuffer and empty it.
     * @param [ioBuffer]
     * @param [logger]
     */
    public flush(ioBuffer: string[] = this.ioBuffer, logger : Function = () => {}): void {
        for (let i: number = 0; i < ioBuffer.length; ++i) {
            logger(ioBuffer[i]);
        }
        ioBuffer.length = 0;
    }

    /**
     * @param [ioBuffer]
     * @param resolve
     * @param reject
     * @returns {IoCallback} by default, returns a callback to be used with child_process.exec
     *                       which will store the error and stdout returned in the designated ioBuffer.
     */
    private ioCallback(ioBuffer: string[] = this.ioBuffer,
                       resolve: Function,
                       reject: Function): IoCallback {

        return <IoCallback>(error: string, stdout: string, stderr: string): void => {

            if (error) {
                this.addTo(ioBuffer, error);
            }
            if (stderr) {
                this.addTo(ioBuffer, stderr);
                reject(ioBuffer.slice());
            }
            if (stdout) {
                this.addTo(ioBuffer, stdout);
            }
            if (!stderr) {
                resolve(ioBuffer.slice());
            }
            this.flush();

        }

    }

    /**
     * @param [ioBuffer] the storage array for the output of the dispatched command.
     * @param argv any number of additional command line arguments.
     * @returns {Promise<string[]>} a Promise that will resolve with the command line (std out) output.
     */
    private dispatchCommand(ioBuffer: string[] = this.ioBuffer,
                            ...argv: string[]): Promise<string[]> {

        const { spawn } = this;

        return this.queue = new Promise((resolve, reject) => {

            const hasResolved: boolean = false;

            if (spawn) {
                if (!this.process) {

                    const proc = this.process = child_process.spawn(argv[0], argv.length === 1 ? [''] : argv.slice(1), {
                        cwd: process.cwd()
                    });

                    proc.stdout.on('data', (data: string): void => {
                        this.addTo(ioBuffer, data);
                        !hasResolved && resolve(ioBuffer);
                    });
                    proc.stderr.on('data', (data: string): void => {
                        this.addTo(ioBuffer, data);
                        !hasResolved && reject(ioBuffer);
                    });
                    proc.on('close', (code: number): void => {
                        this.addTo(ioBuffer, `Child process exited with code ${code}.`);
                        this.process = null;
                        !hasResolved && resolve(ioBuffer);
                    });

                } else {

                    this.process.stdin.write(argv.join(' '), 'utf-8', this.ioCallback(ioBuffer, resolve, reject));

                }
            } else {
                this.process = child_process.exec(argv.join(' '), this.ioCallback(ioBuffer, resolve, reject));
            }

        });

    }

    /**
     * Concatenation helper.
     * @param container
     * @param raw
     * @returns {string[]}
     */
    private addTo(container: string[], raw: string): string[] {
        const additions = this.format(raw);
        for (let i: number = 0; i < additions.length; ++i) {
            container.push(additions[i]);
        }
        return container;
    }

    /**
     * Clean up output strings representing multiple lines.
     * @param raw
     * @returns {string}
     */
    private format(raw: string|string[]): string[] {
        const { prefix = '' } = this;

        if (raw instanceof Array) {
            raw = raw.map(_ => _.toString());
        } else {
            raw = (raw || '')
                .toString()
                .split('\n');
        }

        return raw
            .filter(Boolean)
            .map(_ => prefix + _);
    }

    /**
     * @returns {ProxyHandler} A property access capture mode that ensures all method calls are translated
     *                         to CLI commands.
     */
    private handler(): ProxyHandler {

        const { command, ioBuffer } = this;

        return <ProxyHandler>{
            get: (target: object, name: string): Function => {
                return (...argv: string[]): Promise<string[]> => {
                    return this.dispatchCommand(ioBuffer, command, name, ...argv);
                };
            },
            set: (object: object, property: string, value: string|string[], receiver: object): boolean => {
                return true;
            }
        }

    }

    // # the following methods are pointless:

    /**
     * @param other
     * @returns {clapi} a copy of the other CLIW.
     */
    public copyConstructor(other: clapi): clapi {

        this.spawn = other.spawn;
        this.command = other.command;
        this.prefix = other.prefix;
        this.ioBuffer = other.ioBuffer.slice();
        this.constructor(this.command);

        return this;

    }

    /**
     * Move another instance into this one.
     * @param other
     * @returns {clapi}
     */
    public moveConstructor(other: clapi): clapi {

        this.spawn = other.spawn;
        delete other.spawn;

        this.command = other.command;
        delete other.command;

        this.prefix = other.prefix;
        delete other.prefix;

        this.ioBuffer = other.ioBuffer;
        delete other.ioBuffer;

        this.proxy = other.proxy;
        delete other.proxy;

        this.process = other.process;
        delete other.process;

        return this;

    }

    /**
     * Deletes all properties of this instance.
     */
    public destructor(): void {
        if (this.process && this.process.connected) {
            this.process.disconnect();
        }
        new clapi('').moveConstructor(this);
    }

};
