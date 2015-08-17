'use strict';

var zlib = require('zlib');
var path = require('path');
var nano = require('nano');
var _ = require('lodash');
var async = require('async');
var tar = require('tar-stream');

var defaults = {
  credentials: 'http://localhost:5984',
  excludeDbs: ['_replicator', '_users'] // automatic built-in dbs that you probably don't want to backup
};

function backup(options, done) {

  options = _.defaults(options || {}, defaults);
  var connection = nano(options.credentials);

  var pack = tar.pack();

  connection.db.list(function (err, dbs) {
    if (err) {
      return pack.emit('error', err);
    }

    dbs = _.filter(dbs, function (db) {
      return !_.includes(options.excludeDbs, db);
    });

    async.forEach(dbs, function (dbname, next) {
      var db = connection.use(dbname);
      var params = {include_docs: true}; // eslint-disable-line camelcase
      db.list(params, function (err, body) {
        if (err) {
          return next(err);
        }
        body.dbname = dbname;
        var filename = dbname.replace(/[^a-z0-9-_]+/ig, '_') + '.json';
        pack.entry({name: filename}, JSON.stringify(body));
        next();
      });
    }, function (err) {
      if (err) {
        return pack.emit('error', err);
      }

      pack.finalize();
    });
  });

  var gzipStream = zlib.createGzip();
  pack.pipe(gzipStream);

  if (done) {
    pack.on('error', done);
    gzipStream.on('error', done);
    gzipStream.on('end', done);
  }

  return gzipStream;
}

function restore(options, done) {
  if (_.isFunction(options)) {
    done = options;
    options = {};
  }
  options = _.defaults(options || {}, defaults);
  var connection = nano(options.credentials);

  var extract = tar.extract();

  extract.on('entry', function (header, stream, next) {

    // header is the tar header
    // stream is the content body (might be an empty stream)
    // call next when you are done with this entry
    var chunks = [];
    stream.on('data', function (chunk) {
      chunks.push(chunk);
    });
    stream.on('end', function () {
      var json = Buffer.concat(chunks).toString();
      try {
        var body = JSON.parse(json);
      } catch (ex) {
        done(ex);
      }

      var dbname = body.dbname || path.basename(header.name, '.json');

      connection.db.destroy(dbname, function (err) {
        if (err && err.error !== 'not_found') {
          return done(err);
        }
        connection.db.create(dbname, function (err) {
          if (err) {
            return done(err);
          }

          var docs = body.rows.map(function (r) {
            delete r.doc.ref;
            return r.doc;
          });

          connection.use(dbname).bulk({docs: docs}, next);
        });
      });
    });
  });

  extract.on('finish', done);
  extract.on('error', done);

  var unzipStream = zlib.createGunzip();
  unzipStream.on('error', done);
  unzipStream.pipe(extract);

  return unzipStream;
}

module.exports = {
  backup: backup,
  restore: restore
};
