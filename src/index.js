'use strict';

var fs = require('fs-extra');
var sep = require('path').sep;
var join = require('path').join;
var async = require('async');
var _ = require('lodash');

function config(params) {
    var options = {
        pattern: '(.*/)?([\\d]{4})/([\\d]{2})/([\\d]{2})/(.+\\.html)',
        layout: 'index.html'
    };

    if (sep === '\\') {
        options.pattern = '([\\d]{4})\\\\([\\d]{2})\\\\([\\d]{2})\\\\(.+\\.html)';
    }

    if ('object' == typeof params) Object.assign(options, params);
    if ('string' == typeof string) {
        options = {
            pattern: params
        };
    };

    return options;
}

function plugin(params) {
    var options = config(params);

    return function (files, metalsmith, done) {
        var index_by_year = {};
        var index_by_month = {};
        var section;

        // get files created by permalinks :date pattern
        _.filter(files, function (file, path) {
            var regexp = new RegExp(options.pattern);
            var match = regexp.exec(path);

            if (match != null) {
                if (match[1]) section = match[1];

                if (index_by_year[match[2]] == null) {
                    index_by_year[match[2]] = [];
                }

                index_by_year[match[2]].push({
                    title: file.title,
                    path: path.replace(/\\/g, '/')
                });

                var month_key = match[2] + '/' + match[3];
                if (index_by_month[month_key] == null) {
                    index_by_month[month_key] = [];
                }

                index_by_month[month_key].push({
                    title: file.title,
                    path: path.replace(/\\/g, '/')
                });

                return true;
            }
            return false;
        });

        var create_index = function (index, datePart, done) {
            var new_path = join(section, datePart, 'index.html');

            files[new_path] = {
                path: datePart,
                mode: '0666',
                layout: options.layout,
                index: index,
                contents: new Buffer('')
            };

            done();
        };

        async.parallel(
            [
                function (callback) {
                    _.forIn(index_by_year, function (index, year) {
                        index = _.sortBy(index, function (file) {
                            return file.path;
                        });
                    });

                    async.forEachOf(index_by_year, create_index, callback);
                },
                function (callback) {
                    _.forIn(index_by_month, function (index, year) {
                        index = _.sortBy(index, function (file) {
                            return file.path;
                        });
                    });

                    async.forEachOf(index_by_month, create_index, callback);
                }
            ],
            done
        );

        done();
    };
}

module.exports = plugin;
