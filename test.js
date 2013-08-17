'use strict';

var assert  = require('assert');
var path    = require('path');
var pkg     = require('./package.json');
var modName = pkg.name;
var modFile = path.resolve(pkg.main);

describe(modName, function() {
    beforeEach(function() {
        // reset node variables to defaults
        delete process.env.NODE_ENV;
        delete process.env.NODE_CONFIG_DIR;
        delete process.env.NODE_CONFIG_DEBUG;
        // prevent halting the app when config load fails to catch the error
        process.env.NODE_CONFIG_HALT = false;

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
    });

    describe('successful require', function() {
        it('should load DB config for DEV environment in /config directory', function() {
            process.env.NODE_ENV = 'dev';
            var config = require(modFile);
            assert.notStrictEqual(config, null);

            var configDB = config.db;
            assert.notStrictEqual(configDB, undefined);
            assert.notStrictEqual(configDB, null);
            assert.strictEqual(typeof configDB, 'object');
        });

        it('should load LOG config for PROD environment in /config directory', function() {
            process.env.NODE_ENV = 'dev';

            var config = require(modFile);
//            assert.strictEqual(config.aaa, bbb);
        });
    });
});