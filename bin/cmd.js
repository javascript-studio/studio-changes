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
/* eslint-disable max-len */
const HELP_TEXT = `usage: changes [--file] [--help]

Options are ...
  -f, --file [FILENAME] Specify the name of the changelog file. Defaults to CHANGES.md.
  -h, --help            Display this help message.
`;
/* eslint-enable */

if (argv.h || argv.help) {
  console.log(HELP_TEXT);
  process.exit();
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
