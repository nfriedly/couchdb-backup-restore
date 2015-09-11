'use strict';

var fs = require('fs');
var path = require('path');
var tmpDir = require('os').tmpdir();
var assert = require('assert');
var couchdbBackupRestore = require('../lib/cbr.js');
var nano = require('nano')('http://localhost:5984');
var async = require('async');

var DBNAME = 'test_db'; // note: this must match the name of the db in fixtures/test_backup.tar.gz

describe('couchdb-backup-restore', function () {
  this.timeout(5000); // give the tests a little extra time since we're dealing with multiple network & fs requests in some tests

  function cleanup(next) {
    nano.db.destroy(DBNAME, function (err) {
      if (err && err.error !== 'not_found') {
        return next(err);
      }
      next();
    });
  }

  before(cleanup);
  afterEach(cleanup);

  function scaffold(next) {
    nano.db.create(DBNAME, function (err) {
      if (err) {
        return next(err);
      }
      nano.use(DBNAME).bulk({docs: [
        {
          _id: 'test_doc_1',
          name: 'test doc 1'
        }, {
          _id: 'test_doc_2',
          name: 'test doc 2'
        }
      ]}, next);
    });
  }

  it('should stream backup data', function (done) {
    scaffold(function (err) {
      if (err) {
        return done(err);
      }

      var dataSent = false;

      var source = couchdbBackupRestore.backup(null, function () {
        assert(dataSent, 'Data was written to the destination stream');
        done();
      });

      source.on('error', done);

      source.on('data', function () {
        dataSent = true;
      });
    });
  });

  it('should be able to restore an empty db from a backup', function (done) {
    this.timeout(5000);
    var source = fs.createReadStream(path.join(__dirname, 'fixtures/test_backup.tar.gz'));
    source.on('error', done);
    source.pipe(couchdbBackupRestore.restore(function (err) {
      if (err) {
        return done(err);
      }
      nano.use(DBNAME).get('test_doc_2', function (err, doc) {
        if (err) {
          return done(err);
        }

        assert.equal(doc.name, 'test doc 2');
        done();
      });
    }));
  });

  it('should be able to backup, allow changes, and then restore to the previous backup (end-to-end backup & restore flow)', function (done) {
    scaffold(function (err) {
      if (err) {
        return done(err);
      }
      var backupPath = path.join(tmpDir, 'couchdb_test_backup_' + Math.random().toString().substr(2) + '.tar.gz');

      // first create a backup
      var backupStream = couchdbBackupRestore.backup({databases: [DBNAME]});
      backupStream.on('error', done);
      backupStream.pipe(fs.createWriteStream(backupPath)).on('close', function () {

        // then make changes
        var db = nano.use(DBNAME);
        async.parallel([

          // update a doc
          function (next) {
            db.get('test_doc_1', function (err, doc) {
              if (err) {
                return next(err);
              }
              doc.name = 'new name';
              db.insert(doc, next);
            });
          },

          // delete a doc
          function (next) {
            db.get('test_doc_2', function (err, doc) {
              if (err) {
                return next(err);
              }
              db.destroy(doc._id, doc._rev, next); // eslint-disable-line no-underscore-dangle
            });
          },

          // add a doc
          function (next) {
            db.insert({name: 'test doc 3'}, 'test_doc_3', next);
          }

        ], function (err) {
          if (err) {
            return done(err);
          }
          // todo maybe verifying the changes
          // now rollback the db
          fs.createReadStream(backupPath).pipe(couchdbBackupRestore.restore(function (err) {
            if (err) {
              return done(err);
            }

            // and make sure that none of the changes survived
            async.parallel([

              // updated doc - should be rolled back
              function (next) {
                db.get('test_doc_1', function (err, doc) {
                  if (err) {
                    return next(err);
                  }
                  assert.equal(doc.name, 'test doc 1');
                  next();
                });
              },

              // deleted doc - should be restored
              function (next) {
                db.get('test_doc_2', next); // will return an error if doc is still deleted
              },

              // added doc - should no longer exist in db
              function (next) {
                db.get('test_doc_3', function (err) {
                  assert(err, 'Should throw a not_found error because this doc does not exist in the backup');
                  assert(err.error, 'not_found');
                  next();
                });
              }
            ], function (err) {
              // cleanup
              fs.unlink(backupPath, function (unlinkErr) {
                done(err || unlinkErr);
              });
            });
          }));
        });
      });
    });
  });

});
