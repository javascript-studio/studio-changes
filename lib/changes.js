/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 *
 * @license MIT
 */
'use strict';

const fs = require('fs');
const $ = require('child_process');

const CHANGES_HEADING = '# Changes';
let CHANGES_FILE = 'CHANGES.md';
const DEFAULT_TAG_FORMAT = 'v${version}';

function exists(changes, version) {
  const escaped_version = version.replace(/([\.\-])/g, '\\$1');
  const regexp = new RegExp(`\r?\n## ${escaped_version}\r?\n`);
  return regexp.test(changes);
}

function buildTag(options, version, pkg) {
  const tag_format = options.tag_format || DEFAULT_TAG_FORMAT;
  return tag_format.replace(/\$\{([^}]+)\}/g, (match, key) =>
    key === 'version' ? version : pkg[key]
  );
}

// Write the commit history to the changes file
exports.write = function (options = {}) {
  const package_json = fs.readFileSync('package.json', 'utf8');
  const pkg = JSON.parse(package_json);
  const { version, author } = pkg;

  // Get previous file content
  let previous;
  let heading;
  let newline;
  try {
    previous = fs.readFileSync(CHANGES_FILE, 'utf8');
    const match = previous.match(new RegExp(`^${CHANGES_HEADING}(\r?\n){2}`));
    if (!match) {
      console.error(`Unexpected ${CHANGES_FILE} file header`);
      process.exit(1);
      return null;
    }
    heading = match[0];
    newline = match[1];
  } catch (e) {
    previous = heading = `${CHANGES_HEADING}\n\n`;
    newline = '\n';
  }

  // Generate changes for this release
  const version_match = previous.match(/^## ([0-9a-z\.\-]+)$/m);
  let log_range = '';
  if (version_match) {
    log_range = `${buildTag(options, version_match[1], pkg)}..HEAD`;
  }
  const flags = '--format="» %s (%an)%n%n%b" --no-merges';
  let changes;
  try {
    changes = $.execSync(`git log ${log_range} ${flags}`, {
      encoding: 'utf8'
    });
  } catch (e) {
    process.exit(1);
    return null;
  }

  // Remove blanks (if no body) and indent body
  changes = changes.replace(/\n{3,}/g, '\n')
    .replace(/^([^\»\s])/gm, '    > $1')
    .replace(/^»/gm, '-')
    .replace(/\n/gm, newline);

  // Only mention contributors
  if (author) {
    const author_name = author.substring(0, author.indexOf('<')).trim();
    changes = changes.replace(new RegExp(` \\(${author_name}\\)$`, 'gm'), '');
  }

  // Do not allow version to be added twice
  if (exists(previous, version)) {
    console.error(`Version ${version} is already in ${CHANGES_FILE}\n`);
    if (changes) {
      console.error('# Changes for next release:\n');
      console.error(changes);
    }
    process.exit(1);
    return null;
  }

  // Generate new changes
  let next = `${heading}## ${version}${newline}${newline}${changes}`;
  const remain = previous.substring(heading.length);
  if (remain) {
    next += `${newline}${remain}`;
  }
  fs.writeFileSync(CHANGES_FILE, next);
  return previous;
};

// Roll back changes
exports.abort = function (previous) {
  fs.writeFileSync(CHANGES_FILE, previous);
  process.exitCode = 1;
};

// Add changes to git, unless the user removed the current version to abort
exports.add = function (previous) {
  const package_json = fs.readFileSync('package.json', 'utf8');
  const { version } = JSON.parse(package_json);
  if (exists(fs.readFileSync(CHANGES_FILE, 'utf8'), version)) {
    // Add changes file to git so that npm includes it in the release commit
    $.execSync(`git add ${CHANGES_FILE}`);
  } else {
    exports.abort(previous);
  }
};

// Get file to write changelog
exports.getFile = function () {
  return CHANGES_FILE;
};

// Set file to write changelog
exports.setFile = function (file) {
  CHANGES_FILE = file;
};
