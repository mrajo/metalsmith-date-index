'use strict';

var assert = require('assert');
var dir_equal = require('assert-dir-equal');
var join = require('path').join;
var read = require('fs').readFileSync;
var buffer_equal = require('buffer-equal');
var utf8 = require('is-utf8');

var Metalsmith = require('metalsmith');
var markdown = require('metalsmith-markdown-remarkable');
var permalinks = require('metalsmith-permalinks');
var layout = require('metalsmith-layouts');
var htmlmin = require('metalsmith-html-minifier');

var indexer = require('../src/plugin.js');

function assertDirsEqual(src, done) {
    return function (err) {
        if (err) return done(err);
        dir_equal(join(src, 'expected'), join(src, 'build'));
        done();
    };
}

function assertFilesEqual(src, file, done) {
    return function (err) {
        var file_a = read(join(src, 'expected', file));
        var file_b = read(join(src, 'build', file));

        if (utf8(file_a) && utf8(file_b)) {
            assert.equal(file_a.toString(), file_b.toString());
        } else {
            assert(buffer_equal(file_a, file_b));
        }

        done();
    };
}

describe('metalsmith-date-indexer', function () {
    it('should do stuff', function (done) {
        var src = 'test/fixtures/stuff';

        Metalsmith(src)
            .use(markdown())
            .use(permalinks({
                pattern: ':date/:title'
            }))
            .use(indexer())
            .use(layout({
                engine: "swig",
                default: "main.html"
            }))
            .use(htmlmin())
            .build(assertDirsEqual(src, done));
    });
});