'use strict';

var fs = require('fs-extra');
var sep = require('path').sep;
var join = require('path').join;
var async = require('async');
var _ = require('lodash');

function config(params) {
    var options = {
        pattern: '([\\d]{4})/([\\d]{2})/([\\d]{2})/(.+\\.html)',
        layout: 'index.html'
    };

    if (sep === '\\') {
        options.pattern = '([\\d]{4})\\\\([\\d]{2})\\\\([\\d]{2})\\\\(.+\\.html)';
    }

    if ('object' == typeof params) options = params;
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

        // get files created by permalinks :date pattern
        var ff = _.filter(files, function (file, path) {
            var regexp = new RegExp(options.pattern);
            var match = regexp.exec(path);

            if (match != null) {
                if (index_by_year[match[1]] == null) {
                    index_by_year[match[1]] = [];
                }
                index_by_year[match[1]].push({
                    title: file.title,
                    path: path.replace(/\\/g, '/')
                });

                var month_key = match[1] + '/' + match[2];
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
            var new_path = datePart + '/index.html';

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
