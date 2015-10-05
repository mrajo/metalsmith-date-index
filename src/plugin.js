'use strict';

var fs = require('fs-extra');
var sep = require('path').sep;
var join = require('path').join;
var async = require('async');
var _ = require('lodash');
var moment = require('moment');

function config(params) {
    var options = {
        pattern: '(.*/)?([\\d]{4})/([\\d]{2})/([\\d]{2})/(.+\\.html)',
        layout: 'index.html',
        metadata: {}
    };

    if (sep === '\\') {
        options.pattern = '(.*/)?([\\d]{4})\\\\([\\d]{2})\\\\([\\d]{2})\\\\(.+\\.html)';
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
                section = match[1] || '.';

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

        var make_title = function (section, year, month) {
            var sect = (section !== '.') ?
                        section.charAt(0).toUpperCase() + section.slice(1, -1) + ' ' :
                        '';

            if (month) {
                return sect + 'Archive for ' + month + ' ' + year;
            } else {
                return sect + 'Archive for ' + year;
            }
        };

        var create_index = function (index, dateParts, done) {
            var new_path = join(section, dateParts, 'index.html');
            var date = dateParts.split('/');
            var year = date[0];

            // month isn't available for year indexes, but needs to be passed
            // as metadata. make an object with month key to pass to Object.assign
            var month_metadata = {};
            var month;

            if (date.length == 2) {
                month = month_metadata.month = moment(dateParts, 'YYYY/MM').format('MMMM');
            }

            files[new_path] = Object.assign(
                {
                    path: dateParts,
                    mode: '0666',
                    title: make_title(section, year, month),
                    year: year,
                    layout: options.layout,
                    pages: index,
                    contents: new Buffer('')
                },
                month_metadata,
                options.metadata
            );

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
