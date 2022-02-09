# couchdb-backup-restore [![NPM version][npm-image]][npm-url] [![Build Status - with CouchDB 1.6.1][travis-image]][travis-url] [![Node.js CI - with CouchDB 2.3, 3.0, and latest](https://github.com/nfriedly/couchdb-backup-restore/actions/workflows/node.js.yml/badge.svg)](https://github.com/nfriedly/couchdb-backup-restore/actions/workflows/node.js.yml)
Creates backups of couchdb databases (.tar.gz files containing one .json file per database) and restores from those backups.

Also plays nice with [Cloudant](https://cloudant.com/) (hosted CouchDB service).

**Note: [the official backup methods](https://docs.couchdb.org/en/latest/maintenance/backups.html) are recomended for most users.** However, this tool will remain avaliable for those who need it.

### Limitations

* This library **does not support attachments**, right now. It will only back up and restore documents. PR's welcome.

* This backs up only the current revision (`_rev`) of each document; **backing up and restoring will loose all previous revisions.**
  (This is normal behavior though - to quote the documentation, [You cannot rely on document revisions for any other purpose than concurrency control.](https://wiki.apache.org/couchdb/Document_revisions))
  

## Install

```sh
$ npm install --save couchdb-backup-restore
```

## Usage

```js
var fs = require('fs');
var cbr = require('couchdb-backup-restore');

var config = {credentials: 'http://localhost:5984'};

function done(err) {
  if (err) {
    return console.error(err);
  }
  console.log('all done!');
}

// backup
cbr.backup(config, done).pipe(fs.createWriteStream('./db-backup.tar.gz'))
  
// restore
fs.createReadStream('./db-backup.tar.gz').pipe(cbr.restore(config, done));
```

[Bluemix](https://console.ng.bluemix.net/) / Cloudant example:

```
var cbr = require('couchdb-backup-restore');
var bluemix = require('bluemix'); 

var config = {
 credentials: bluemix.getService('cloudantNoSQLDB').credentials
}

// or just var config = bluemix.getService('cloudantNoSQLDB');
```

### Configuring

Default options are:

```js
{
  credentials: 'http://localhost:5984',
  excludeDbs: ['_replicator', '_users'], // automatic built-in dbs that you probably don't want to backup
  databases: null
}
```

* `credentials` is passed directly to [nano](https://www.npmjs.com/package/nano) and can be either a straight url or a configuration object.
* `excludeDbs` should be an array, although it may be an empty array (`[]`) if you want to include the built-in `_replicator` and `_users` databases.
* `databases` may be an array. If set, CBR will only back up the specified DBs, overriding the `excludeDbs` option.

### Compatibility

Travis CI automatically tests changes against Node.js LTS and Stable (14.16.0 and 15.10.0 at the time of writing) and CouchDB 1.6.1.

Github Actions automatically tests changes against Node.js 14 and 15 and Couch DB 2.3, 3.0, and latest (3.1.1 at the time of writing).

## License

MIT © [Nathan Friedly](http://nfriedly.com)


[npm-image]: https://badge.fury.io/js/couchdb-backup-restore.svg
[npm-url]: https://npmjs.org/package/couchdb-backup-restore
[travis-image]: https://travis-ci.org/nfriedly/couchdb-backup-restore.svg?branch=master
[travis-url]: https://travis-ci.org/nfriedly/couchdb-backup-restore
[daviddm-image]: https://david-dm.org/nfriedly/couchdb-backup-restore.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/nfriedly/couchdb-backup-restore
