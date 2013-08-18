'use strict';

var assert  = require('assert');
var path    = require('path');
var pkg     = require('../package.json');
var modName = pkg.name;
var modFile = path.resolve(pkg.main);
var processDir = __dirname;

describe(modName, function() {
    beforeEach(function() {
        // reset node variables to defaults
        delete process.env.NODE_ENV;
        delete process.env.NODE_CONFIG_DIR;
        delete process.env.NODE_CONFIG_LOG;
        // prevent halting the app when config load fails to catch the error
        process.env.NODE_CONFIG_HALT = false;

        // set current working directory of the process to the same dir as this script is located in
        // this allows to have tests their data in separate test directory
        process.chdir(processDir);

        // delete require cache to enforce reloading the index.js
        delete require.cache[modFile];
    });

    describe('unsuccessful require', function() {
        it('should fail to load configs for non-existing environment', function() {
            process.env.NODE_ENV = 'blah';

            var config = require(modFile);
            assert.equal(config, null);
        });

        it('should fail to load configs in non-existing directory', function() {
            process.env.NODE_CONFIG_DIR = 'blah';

            var config = require(modFile);
            assert.equal(config, null);
        });

        it('should fail to load non-existing config for DEV environment in default directory', function() {
            process.env.NODE_ENV = 'dev';
            var config= require(modFile);
            assert.notStrictEqual(config, null);

            config = config.blah;
            assert.strictEqual(config, undefined);
        });

        it('should fail to load DB config for PROD environment in /config1 directory', function() {
            process.env.NODE_ENV = 'prod';
            process.env.NODE_CONFIG_DIR = processDir + '/config1';

            var config= require(modFile);
            assert.strictEqual(config, null);
        });

        it.skip('should halt the app on failure', function() {
        });
    });

    describe('successful require', function() {
        it('should load DB config for DEV environment in default directory', function() {
            process.env.NODE_ENV = 'dev';
            var config= require(modFile);
            assert.notStrictEqual(config, null);

            config = config.db;
            assert.notStrictEqual(config, undefined);
            assert.notStrictEqual(config, null);
            assert.strictEqual(typeof config, 'object');
            assert.strictEqual(config.dbURI, 'mongodb://localhost:27017/dev-db');
        });

        it('should load LOG config for PROD environment in default directory', function() {
            process.env.NODE_ENV = 'prod';
            var config = require(modFile);
            assert.notStrictEqual(config, null);

            config = config.log;
            assert.notStrictEqual(config, undefined);
            assert.notStrictEqual(config, null);
            assert.strictEqual(typeof config, 'object');
            assert.strictEqual(config.fileLogConfig.filename, '/var/log/server-prod.log');
            assert.strictEqual(config.consoleLogConfig.level, 'error');
        });

        it('should load DB config for default environment in /config1 directory', function() {
            process.env.NODE_CONFIG_DIR = processDir + '/config1';

            var config= require(modFile);
            assert.notStrictEqual(config, null);

            config = config.db;
            assert.notStrictEqual(config, undefined);
            assert.notStrictEqual(config, null);
            assert.strictEqual(typeof config, 'object');
            assert.strictEqual(config.dbURI, 'mongodb://localhost:27017/dev-db-config1');
        });

        it.skip('should print out log information', function() {
        });

        it.skip('should not print out log information', function() {
        });
    });
});
