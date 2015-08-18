# couchdb-backup-restore [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> Creates backups of couchdb databases (.tar.gz files containing one .json file per database) and restores from those backups.

Also plays nice with [Cloudant](https://cloudant.com/) (hosted CouchDB service).

## Install

```sh
$ npm install --save couchdb-backup-restore
```


## Usage

```js
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
fs.createReadStream('./db-backup.tar.gz').pipe(cbr.restore(config, done);
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
  excludeDbs: ['_replicator', '_users'] // automatic built-in dbs that you probably don't want to backup
}
```

* `credentials` is passed directly to [nano](https://www.npmjs.com/package/nano) and can be either a straight url or a configuration object.
* `excludeDbs` should be an array, although it may be an empty array (`[]`) if you want to include the built-in `_replicator` and `_users` databases.

## License

MIT © [Nathan Friedly](http://nfriedly.com)


[npm-image]: https://badge.fury.io/js/couchdb-backup-restore.svg
[npm-url]: https://npmjs.org/package/couchdb-backup-restore
[travis-image]: https://travis-ci.org/nfriedly/couchdb-backup-restore.svg?branch=master
[travis-url]: https://travis-ci.org/nfriedly/couchdb-backup-restore
[daviddm-image]: https://david-dm.org/nfriedly/couchdb-backup-restore.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/nfriedly/couchdb-backup-restore
