#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { execSync } = require('child_process');
const editor = require('editor');
const { version, author } = require('./package.json');

const CHANGES_FILE = 'CHANGES.md';
const CHANGES_HEADING = '# Changes\n\n';

// Get previous file content
let previous;
try {
  previous = fs.readFileSync(CHANGES_FILE, 'utf8');
  if (previous.indexOf(CHANGES_HEADING) !== 0) {
    console.error('Unexpected changes file content');
    process.exit(1);
  }
} catch (e) {
  previous = CHANGES_HEADING;
}

// Generate changes for this release
let changes;
try {
  const opts = { encoding: 'utf8' };
  if (previous === CHANGES_HEADING) {
    changes = execSync('git log --format="- %s (%an)"', opts);
  } else {
    changes = execSync(`git log v${version}..HEAD --format="- %s (%an)"`, opts);
  }
} catch (e) {
  process.exit(1);
}

// Only mention contributors
if (author) {
  const author_name = author.substring(0, author.indexOf('<')).trim();
  changes = changes.replace(new RegExp(` \\(${author_name}\\)`, 'g'), '');
}

// Generate new changes
const remain = previous.substring(CHANGES_HEADING.length);
const heading = `## ${version}`;
fs.writeFileSync(CHANGES_FILE,
  `${CHANGES_HEADING}${heading}\n\n${changes}\n${remain}`);

// Let the user edit the changes
editor('CHANGES.md', (code) => {
  if (code !== 0
      || fs.readFileSync(CHANGES_FILE, 'utf8').indexOf(heading) === -1) {
    // Abort
    fs.writeFileSync(CHANGES_FILE, previous);
    process.exitCode = 1;
  } else {
    // Add changes file so that npm includes it in the release commit
    execSync(`git add ${CHANGES_FILE}`);
  }
});
