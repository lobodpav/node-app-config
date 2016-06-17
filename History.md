# 1.0.0 / 2016-06-17

* Replaced deprecated `fs.existsSync()` call by `fs.accessSync()`. `fs.existsSync()` was deprecated since Node.js v1.0.0.
* Updated `mocha` and `should` dependencies
* Proven stable enough to be finally called version 1.0.0

# 0.1.5 / 2016-04-09

* Updated to latest package versions

# 0.1.4 / 2014-02-10

* Fixed devDependencies in package.json to contain version numbers
* Added unit test for `app-config` reload feature in 0.1.2

# 0.1.3 / 2014-02-10

* Increased the version number due to publishing incorrect code as 0.1.2

# 0.1.2 / 2014-02-10

* Configuration files are now reloaded if `app-config` module is deleted from `require.cache` and then required again. This is useful for unit tests when need to reload the config files after making any changes to config object.
* Replaced Node's `assert` module in unit tests by `should`

# 0.1.1 / 2013-11-13

* Always print an error when terminating the app due to a critical error
* Print a warning if the configuration directory is empty

# 0.1.0 / 2013-08-18

* Initial release with support for dynamic configuration loading
