'use strict';

var should  = require('should');
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
        // prevent halting the app when config load fails, to catch the error
        process.env.NODE_CONFIG_NO_HALT = true;

        // set current working directory of the process to the same dir as this script is located in
        // this allows to have tests and their data in a dedicated directory
        process.chdir(processDir);

        // delete require cache to enforce reloading the index.js
        delete require.cache[modFile];
    });

    describe('unsuccessful require', function() {
        it('should fail to load configs for non-existing environment', function() {
            process.env.NODE_ENV = 'blah';

            var config = require(modFile);
            should(config).be.equal(null);
        });

        it('should fail to load configs in non-existing directory', function() {
            process.env.NODE_CONFIG_DIR = 'blah';

            var config = require(modFile);
            should(config).be.equal(null);
        });

        it('should fail to load non-existing config for DEV environment in default directory', function() {
            process.env.NODE_ENV = 'dev';
            var config = require(modFile);
            should.exist(config);

            should.not.exist(config.blah);
        });

        it('should fail to load DB config for PROD environment in /config1 directory', function() {
            process.env.NODE_ENV = 'prod';
            process.env.NODE_CONFIG_DIR = processDir + '/config1';

            var config = require(modFile);
            should(config).be.equal(null);
        });

        it('should halt the app on failure', function() {
            // make the NO_HALT undefined
            delete process.env.NODE_CONFIG_NO_HALT;
            // set the environment to non-existing one to get the app halted
            process.env.NODE_ENV = 'blah';

            var halted = false;
            // backup the function definition
            var exit = process.exit;
            // backup console functions' definition
            var err = console.error;
            var info = console.info;
            var warn = console.warn;

            // mock the process.exit() function to catch its call
            process.exit = function() {
                halted = true;
            };

            // mocks to suppress logging attempts when HATL is being enabled
            console.error = console.info = console.warn = function() {};


            require(modFile);

            // restore the original definition
            process.exit = exit;
            // restore console functions' definition
            console.error = err;
            console.info = info;
            console.warn = warn;

            halted.should.be.true();
        });

        it('should not halt the app on failure', function() {
            // set the environment to non-existing one to cause an error
            process.env.NODE_ENV = 'blah';

            var config = require(modFile);
            should(config).be.equal(null);
        });
    });

    describe('successful require', function() {
        it('should load DB config for DEV environment in default directory', function() {
            process.env.NODE_ENV = 'dev';
            var config = require(modFile);
            should.exist(config);

            config = config.db;
            should.exist(config);
            config.should.be.an.Object();
            config.should.have.property('dbURI', 'mongodb://localhost:27017/dev-db');
        });

        it('should load LOG config for PROD environment in default directory', function() {
            process.env.NODE_ENV = 'prod';
            var config = require(modFile);
            should.exist(config);

            config = config.log;
            should.exist(config);
            config.should.be.an.Object();
            config.should.have.properties('fileLogConfig', 'consoleLogConfig');
            config.fileLogConfig.should.have.property('filename', '/var/log/server-prod.log');
            config.consoleLogConfig.should.have.property('level', 'error');
        });

        it('should load DB config for default environment in /config1 directory', function() {
            process.env.NODE_CONFIG_DIR = processDir + '/config1';

            var config = require(modFile);
            should.exist(config);

            config = config.db;
            should.exist(config);
            config.should.be.an.Object();
            config.should.have.property('dbURI', 'mongodb://localhost:27017/dev-db-config1');
        });

        it('should print out log information', function() {
            process.env.NODE_CONFIG_LOG = true;

            var log = false;
            // backup the functions' definition
            var err = console.error;
            var info = console.info;
            var warn = console.warn;

            // mocks to catch logging attempts
            console.error = console.info = console.warn = function() {log = true;}

            require(modFile);

            // restore the functions' definition
            console.error = err;
            console.info = info;
            console.warn = warn;

            log.should.be.true();
        });

        it('should not print out log information', function() {
            var log = false;
            // backup the functions' definition
            var err = console.error;
            var info = console.info;

            // mocks to catch logging attempts
            console.error = console.info = function() {log = true;}

            require(modFile);

            // restore the functions' definition
            console.error = err;
            console.info = info;

            log.should.be.false();
        });

        it('should reload config files when `app-config` is deleted from `require.cache`', function() {
            process.env.NODE_ENV = 'dev';

            var config = require(modFile);
            config.should.have.property('db');

            // create new property
            config.db.blah = 'blah!';
            config.db.should.have.property('blah', 'blah!');

            // delete the module from cache so that the `blah` property shall get removed upon new require call
            delete require.cache[modFile];

            // repeated require shall revert any previous changes made to the config
            var config = require(modFile);
            config.should.have.property('db');
            config.db.should.not.have.property('blah');
        });

        it('should not reload config files when `app-config` is not deleted from `require.cache`', function() {
            process.env.NODE_ENV = 'dev';

            var config = require(modFile);
            config.should.have.property('db');

            // create new property
            config.db.blah = 'blah!';
            config.db.should.have.property('blah', 'blah!');

            // repeated require shall not revert any previous changes made to the config
            var config = require(modFile);
            config.should.have.property('db');
            config.db.should.have.property('blah', 'blah!');
        });
    });
});
