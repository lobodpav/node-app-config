'use strict';

/**
 * SYNCHRONOUS configuration wrapper module to ensure the correct kind of configuration is loaded depending on environment being run at.
 * The environment is to be set in the NODE_ENV environmental property. Example startup command: NODE_ENV=prod node index.js
 * As Node.js caches all the requires, so this module will be executed only ones ensuring no performance impact on the app.
 *
 * Available configurations and environments are determined dynamically, based on the following directory and file structures.
 * The only supported configuration files are with '.js' extension, and must be exported this way:
 * module.exports = {
 *     property1: 'value1',
 *     property2: 'value2',
 *     ...
 * }
 *
 * Configuration directory is expected to be called 'config' and to be located in the root of your app/project.
 * You can change the 'config' directory location by setting up NODE_CONFIG_DIR environment variable.
 *
 * For example when running Node.js by `NODE_ENV=test node index.js` command and having following directory structure
 *     config/dev/app.js
 *     config/dev/log.js
 *     config/test/app.js
 *     config/test/log.js
 * this object will be returned upon require call:
 * {
 *     app: require(CONFIG_DIR + 'test/app');
 *     log: require(CONFIG_DIR + 'test/log');
 * }
 *
 * Usage in a module:
 *     var cfg = require('config');
 *     db.connect(cfg.app.aProperty);
 */

var fs   = require('fs');
var path = require('path');

var CONFIG_DIR = process.env.NODE_CONFIG_DIR;
// if the CONFIG_DIR env variable is undefined, use the app root dir + 'config/'
if (CONFIG_DIR === undefined || CONFIG_DIR === null || typeof CONFIG_DIR !== 'string')
    CONFIG_DIR = path.resolve(process.cwd(), 'config/') + '/';
else
    CONFIG_DIR = path.resolve(CONFIG_DIR) + '/';

var ENV = process.env.NODE_ENV;
// if the CONFIG_DIR env variable is undefined, use default configuration scripts without environment (e.g. directly in config/ directory)
if (ENV === undefined || ENV === null || typeof ENV !== 'string')
    ENV = '';

/**
 * SYNCHRONOUSLY fetches all environments available. Generally, returns the list of sub-directories under the CONFIG_DIR.
 * @returns {Array} List of environments available or an empty array in case there is no environment sub-directory
 */
function getEnvs() {
    console.info('Reading environments available in', path.resolve(CONFIG_DIR));

    var stat;
    var envs = fs.readdirSync(CONFIG_DIR);

    // strip away anything but directories - environments must have their own sub-directory
    envs.forEach(function(val, i, arr) {
        stat = fs.statSync(CONFIG_DIR + val);
        if (!stat.isDirectory())
            envs.splice(i, 1);
    });

    return envs;
}

/**
 * SYNCHRONOUSLY fetches all config files under the environment specified in parameter. Currently, only .js files are supported.
 * @param {String} env The environment to search in for config files
 * @returns {Array} List of configuration files as object with name and path. I.e. for 'app.js' file this array of objects will get returned: [{name: 'app', path: '/app/root/config/app.js'}]
 */
function getConfigs(env) {
    var dir = CONFIG_DIR + env;

    console.info('Reading configuration files under', dir);

    var configs = [];
    var dirContent = fs.readdirSync(dir);
    var stat, file, ext;

    // strips away file extensions
    dirContent.forEach(function(val, i, arr) {
        file = dir + '/' + val;
        stat = fs.statSync(file);
        // skip all items but files
        if (!stat.isFile())
            return;

        // adds JS file types only
        ext = path.extname(val);
        if (ext === '.js')
            configs.push({
                name: path.basename(val, ext),
                path: file
            });
    });

    return configs;
}


// ---
// code for loading the configs based on NODE_ENV
// ---


// check for existence of configuration directory
if (!fs.existsSync(CONFIG_DIR)) {
    console.error('Configuration directory for the app is missing. Expected location is \'%s\'.\nHalting the app.', CONFIG_DIR);
    process.exit(-1);
}

var configs = [];
// if no environment was specified, load the configuration directly under config/ directory
// this is required for production and test releases as the config/ directory does not contain environment directories but rather the correct config files themselves
if (ENV === '') {
    console.info('Loading app configuration');
    configs = getConfigs('');
}
else {
    console.info('Loading app configuration for the \'%s\' environment', ENV);

    var envs = getEnvs();
    var e = envs.indexOf(ENV);
    if (e < 0) {
        console.error('Configuration for \'%s\' environment is not available. Expected location is %s/*.js.\nHalting the app.', ENV, CONFIG_DIR + ENV);
        process.exit(-1);
    }
    else {
        configs = getConfigs(ENV);
    }
}

// all configs will be added as a property into this object
var cfg = {};

// add all configurations available into the object being returned by require('config') call
configs.forEach(function(val, index, arr) {
    cfg[val.name] = require(val.path);
});

module.exports = cfg;
