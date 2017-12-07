require('shelljs/make');
var path = require('path');
var fs = require('fs');

var rp = function (relPath) {
    return path.join(__dirname, relPath);
}

var buildPath = path.join(__dirname, '_build');
var testPath = path.join(__dirname, 'test');
var tsc = path.join(__dirname, 'node_modules/.bin/tsc');
var tslint = path.join(__dirname, 'node_modules/.bin/tslint');

var run = function (cl) {
    try {
        console.log('> ' + cl);
        var rc = exec(cl).code;
        if (rc !== 0) {
            echo('Exec failed with rc ' + rc);
            exit(rc);
        }
    }
    catch (err) {
        echo(err.message);
        exit(1);
    }
}

// Run linting on all ts files in the lib directory
// It's important to have the double quotes in place to run across platforms
var lint = function () {
    var filesGlob = '"lib/**/*.ts?(x)"';
    var rulesDir = path.join(__dirname, 'node_modules/tslint-microsoft-contrib');
    var config = path.join(__dirname, 'node_modules/tslint-microsoft-contrib/tslint.json');

    run(tslint + ' ' + filesGlob + ' --rules-dir "' + rulesDir + '" --config "' + config + '"');
}

target.clean = function () {
    rm('-Rf', buildPath);
};

target.build = function () {
    target.clean();

    run(tsc + ' --outDir ' + buildPath);
    cp('-Rf', rp('lib/opensource'), buildPath);
    cp(rp('package.json'), buildPath);
    cp(rp('README.md'), buildPath);
    cp(rp('LICENSE'), buildPath);

    lint();
}

target.test = function() {
    target.build();

    // install the just built lib into the test proj
    pushd('test')
    run('npm install ../_build');
    popd();

    run('tsc -p ./test');
    run('mocha test');
}

target.buildtest = function() {
    target.build();
    target.test();
}

target.samples = function () {
    target.build();

    pushd('samples');
    run('npm install ../_build');
    run('tsc');
    run('node samples.js');
    popd();
    console.log('done');
}

target.validate = function() {
    target.build();
    target.test();
    target.samples();
}