#!/usr/bin/env node
/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 *
 * @license MIT
 */
'use strict';

const editor = require('editor');
const changes = require('..');

// Write the commit history to the changes file
const previous = changes.write();

// Let the user edit the changes
editor('CHANGES.md', (code) => {
  if (code === 0) {
    // Add the changes file to git
    changes.add(previous);
  } else {
    // Roll back
    changes.abort(previous);
  }
});
