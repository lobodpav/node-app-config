# ! CAUTION !

This module is **not maintained anymore**.
You can use https://app-config.dev instead.

# app-config

Configuration-loader utility for `Node.js` to load different set of configuration files depending on your execution environment.

Simply prepare your configuration files and call `require('app-config')`. Available configurations and environments are determined dynamically, based on your directory and file structures.

# Introduction

In Java environment, `classpath` is used to 'inject' paths of right configuration files.

In Javascript world, there is nothing like `classpath`. This tool is here to solve your multi-environment configuration problem.

# Quick intro to usage

Create database config file for `dev` environment

```
/app_root/config/dev/db.js
```

Give the config file some content

```js
module.exports = {
    hostname: 'localhost',
    port: 1234
}
```

Load the config in your app

```js
var config = require('app-config');

console.log('DB URL:', config.db.hostname + ':' + config.db.port);
```

Run your app

```bash
NODE_ENV=dev node you_app.js
```

Like it? Read on for more details.

# Directory structure

An example of directory structure required by the tool.
```
config/
    dev/
        db.js
        log.js
    prod/
        db.js
        log.js
    db.js
    log.js
    ...
```
Each environment is a separate directory of the same name. In the example above, we have two environments: `dev` and `prod`.
Configuration files are stored within each environment directory. Any sub-directory under an environment directory will be ignored.

Configuration files located directly under `config/` directory are supported for two reasons:

* They are loaded in case no execution environment is set
* Allow you to use a build tool (Grunt for example) to assemble the right config files in the root of `config/` directory depending on which environment you are building a package for.
    * For example, for production packages, you may want to copy only the .js files of `config/prod/` into the package's `config/` directory

# Configuration files' format

Javascript-only files are supported and they must export an object. Example `config/prod/log.js`:
```js
module.exports = {
    emitErrors: true,

    fileLogConfig: {
        filename: '/var/log/app.log',
        level: 'debug'
    }
}
```

# Usage

When calling `require('app-config')`, configuration files are loaded depending on the execution environment,
which is being set by using environmental variables. More on that below.

Returned object upon `require` call for the example directory structure:
```js
{
    log: {
        emitErrors: true,

        fileLogConfig: {
            filename: '/var/log/app.log',
            level: 'debug'
        }
    },
    db: {
        ...
    }
}
```

### Example usage in a Node.js module
```js
var config = require('app-config');

console.log('Log level:', config.log.fileLogConfig.level);
```

# Configuration options

All configuration options are available via the environment variables below.
Some examples of how to set the environmental variables:

* `NODE_ENV=dev  NODE_CONFIG_NO_HALT= node index.js`
* `NODE_ENV=qa   NODE_CONFIG_DIR='/qa/config/path/' node index.js`
* `NODE_ENV=prod NODE_CONFIG_LOG= NODE_CONFIG_DIR='/prod/config/path/' node index.js`

### NODE_ENV

Environment to be used when requiring the tool. In our example, we have `dev` and `prod`.

### NODE_CONFIG_DIR

Configuration directory is expected to be called 'config' and to be located in the root of your app/project.
You can change this default behavior by setting this option up to whatever path you like.

### NODE_CONFIG_NO_HALT

If an error occurs during the load of config files, the app is halted unless overridden by defining this option to whatever value.
For example, the app is halted if the configuration directory does not exist, if an environment does not exist in `config` directory, etc.

The app is being halted by executing `process.exit(-1)` command. If the halt is prevented by defining this option,
the returned value by the `require` call is `null` and it is up to you to handle this situation.

### NODE_CONFIG_LOG

Prints out information and error messages into console if defined.

# Technical details

This tool is fully synchronous. I.e. for all file operations, synchronous Node.js functions are being called.
This is essential to have the config files loaded immediately upon `require` call.
Since Node.js caches all `require` calls, this tool will be executed only ones ensuring no performance impact on the app.

## Code's logic insight

The tool walks through `config/` directory in your app's root (or any other provided directory via configuration) and scans for environment directory.
When found, an object is returned, having properties of the same name as the log files - just the .js extension is stripped out.

Object returned by `require` call on our example directory structure above with `NODE_ENV=prod`:
```js
{
    db:  require(NODE_CONFIG_DIR + '/prod/db.js');
    log: require(NODE_CONFIG_DIR + '/prod/log.js');
}
```

Prior requiring the `db` and `log` modules above, they are deleted from `require.cache`.
This will ensure reloading of config files if you intentionally deleted `app-config` module from `require.cache`.
Useful for unit testing when playing around with properties in object returned upon `require('app-config')`.

# Installation

`npm install app-config`

# Dependencies

The tool does not depend on any other code. For developers of this tool, `Mocha` and `Should` are the only dependencies for running unit tests.

# Development

In order to develop this plugin, these steps are required:

* Clone the git repo by running `git clone URL`
* Go to the newly created directory in Terminal
* Run `npm install` to download dependencies
* Run unit tests by `npm test`
