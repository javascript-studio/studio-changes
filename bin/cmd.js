#!/usr/bin/env node
/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 *
 * @license MIT
 */
'use strict';

const editor = require('editor');
const changes = require('..');

const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    file: 'f',
    help: 'h'
  }
});

if (argv.help) {
  /* eslint-disable max-len */
  console.log(`Usage: changes [options]

Options:
      --init            Add version lifecycle scripts to package.json.
  -f, --file [FILENAME] Specify the name of the changelog file. Defaults to CHANGES.md.
  -h, --help            Display this help message.
`);
  /* eslint-enable */
  process.exit();
}

if (argv.init) {
  if (require('../lib/init')()) {
    process.exit();
  }
  console.error('"version" script already exists');
  process.exit(1);
}

let file = argv.file;

if (file) {
  changes.setFile(file);
} else {
  file = changes.getFile();
}

// Write the commit history to the changes file
const previous = changes.write();

// Let the user edit the changes
editor(file, (code) => {
  if (code === 0) {
    // Add the changes file to git
    changes.add(previous);
  } else {
    // Roll back
    changes.abort(previous);
  }
});
