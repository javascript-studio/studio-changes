#!/usr/bin/env node
/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 *
 * @license MIT
 */
'use strict';

const editor = require('@studio/editor');
const changes = require('..');

const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    file: 'f',
    tag: 't',
    help: 'h'
  }
});

if (argv.help) {
  /* eslint-disable max-len */
  console.log(`Usage: changes [options]

Options:
      --init            Add version lifecycle scripts to package.json.
  -f, --file [FILENAME] Specify the name of the changelog file. Defaults to CHANGES.md.
  -t, --tag [FORMAT]    Specify a custom git tag format to use. Defaults to "v\${version}".
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

const options = {};
if (argv.file) {
  options.changes_file = argv.file;
}
if (argv.tag) {
  options.tag_format = argv.tag;
}

// Write the commit history to the changes file
const state = changes.write(options);

// Let the user edit the changes
editor(state.changes_file, (code) => {
  if (code === 0) {
    // Add the changes file to git
    changes.add(state);
  } else {
    // Roll back
    changes.abort(state);
  }
});
