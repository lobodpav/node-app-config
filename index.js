'use strict';

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

// halt the app in case of failure during configs' load
var HALT = process.env.NODE_CONFIG_NO_HALT === undefined;

// print out debug messages if enabled
var LOG = process.env.NODE_CONFIG_LOG !== undefined;

/**
 * SYNCHRONOUSLY fetches all environments available. Generally, returns the list of sub-directories under the CONFIG_DIR.
 * @returns {Array} List of environments available or an empty array in case there is no environment sub-directory
 */
function    getEnvs() {
    if (LOG)
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
 * @returns {Array} List of configuration files as an object with name and path. I.e. for 'app.js' file this array of objects will get returned: [{name: 'app', path: '/app/root/config/app.js'}]
 */
function getConfigs(env) {
    var dir = CONFIG_DIR + env;

    if (LOG)
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


// check for non-existence of configuration directory
try {
    fs.accessSync(CONFIG_DIR, fs.R_OK);
}
catch (e) {
    if (LOG || HALT) { // always print the error if halting the app
        console.error('Configuration directory for the app is either missing or non-readable. Expected location is', CONFIG_DIR);
        console.error(e);
    }
    if (HALT) {
        console.error('Halting the app.');
        process.exit(-1);
    } else {
        module.exports = null;
        return;
    }
}

var configs = [];
// if no environment was specified, load the configuration directly under config/ directory
// this is required for production and test releases as the config/ directory does not contain environment directories but rather the appropriate config files themselves
if (ENV === '') {
    if (LOG)
        console.info('Loading app configuration');
    configs = getConfigs('');
}
else {
    if (LOG)
        console.info('Loading app configuration for the \'%s\' environment', ENV);

    var envs = getEnvs();
    var e = envs.indexOf(ENV);
    if (e < 0) {
        if (LOG || HALT) // always print the error if halting the app
            console.error('Configuration for \'%s\' environment is not available. Expected location is %s/*.js', ENV, CONFIG_DIR + ENV);
        if (HALT) {
            console.error('Halting the app.');
            process.exit(-1);
        } else {
            module.exports = null;
            return;
        }
    }
    else {
        configs = getConfigs(ENV);
    }
}

// all configs will be added as a property into this object
var cfg = {};

// add all configurations available into the object being returned by require('app-config') call
configs.forEach(function(val, index, arr) {
    // delete the module from cache if in there
    // this will ensure the files get reloaded every time this code is being run
    // useful for unit tests which may delete the `app-config` module from cache to get the configs reloaded
    var requireKey = require.resolve(val.path);
    if (require.cache[requireKey])
        delete require.cache[requireKey];

    cfg[val.name] = require(val.path);
});

if (LOG && configs.length <= 0)
    console.warn('No configuration file found');

module.exports = cfg;
