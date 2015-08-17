# couchdb-backup-restore [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> Creates backups of couchdb databases (.tar.gz files containing one .json file per database) and restores from those backups.


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

## License

MIT © [Nathan Friedly](http://nfriedly.com)


[npm-image]: https://badge.fury.io/js/couchdb-backup-restore.svg
[npm-url]: https://npmjs.org/package/couchdb-backup-restore
[travis-image]: https://travis-ci.org/nfriedly/couchdb-backup-restore.svg?branch=master
[travis-url]: https://travis-ci.org/nfriedly/couchdb-backup-restore
[daviddm-image]: https://david-dm.org/nfriedly/couchdb-backup-restore.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/nfriedly/couchdb-backup-restore
