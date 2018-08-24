/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 *
 * @license MIT
 */
'use strict';

const fs = require('fs');
const $ = require('child_process');

const CHANGES_HEADING = '# Changes';
const DEFAULT_CHANGES_FILE = 'CHANGES.md';
const DEFAULT_TAG_FORMAT = 'v${version}';
const DEFAULT_COMMIT_URL_FORMAT = '${homepage}/commit';
const VARIABLE_RE = /\$\{([^}]+)\}/g;

function exists(changes, version) {
  const escaped_version = version.replace(/([.-])/g, '\\$1');
  const regexp = new RegExp(`\r?\n## ${escaped_version}\r?\n`);
  return regexp.test(changes);
}

function buildTag(options, version, pkg) {
  const tag_format = options.tag_format || DEFAULT_TAG_FORMAT;
  return tag_format.replace(VARIABLE_RE, (match, key) =>
    key === 'version' ? version : pkg[key]
  );
}

// Write the commit history to the changes file
exports.write = function (options = {}) {
  const changes_file = options.changes_file || DEFAULT_CHANGES_FILE;
  const package_json = fs.readFileSync('package.json', 'utf8');
  const pkg = JSON.parse(package_json);
  const { version, author } = pkg;

  // Get previous file content
  let previous;
  let heading;
  let newline;
  try {
    previous = fs.readFileSync(changes_file, 'utf8');
    const match = previous.match(new RegExp(`^${CHANGES_HEADING}(\r?\n){2}`));
    if (!match) {
      console.error(`Unexpected ${changes_file} file header`);
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
  const version_match = previous.match(/^## ([0-9a-z.-]+)$/m);
  let log_range = '';
  if (version_match) {
    log_range = `${buildTag(options, version_match[1], pkg)}..HEAD`;
  }
  let flags = '--format="» ';
  let commits = options.commits;
  if (commits) {
    if (commits === true) {
      commits = DEFAULT_COMMIT_URL_FORMAT;
      if (!pkg.homepage) {
        console.error('--commits option requires base URL or "homepage" in '
          + 'package.json\n');
        process.exit(1);
        return null;
      }
    }
    commits = commits.replace(VARIABLE_RE, (match, key) => pkg[key]);
    flags += `[\\\`%h\\\`](${commits}/%H)«  `;
  }
  flags += '%s (%an)%n%n%b" --no-merges';
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
  changes = changes
    .replace(/\n{3,}/g, '\n')
    // Indent body with quotes:
    .replace(/^([^»])/gm, '    > $1')
    // Remove trainling whitespace on blank quote lines
    .replace(/^ {4}> \n/gm, '    >\n');

  changes = changes
    // Replace commit markers with dashes:
    .replace(/^»/gm, '-')
    // Replace newline markers with newlines:
    .replace(/«/gm, '\n')
    // Restore original newlines:
    .replace(/\n/gm, newline);

  // Only mention contributors
  if (author) {
    const author_name = typeof author === 'object'
      ? author.name
      : author.substring(0, author.indexOf('<')).trim();
    changes = changes.replace(new RegExp(` \\(${author_name}\\)$`, 'gm'), '');
  }

  // Do not allow version to be added twice
  if (exists(previous, version)) {
    console.error(`Version ${version} is already in ${changes_file}\n`);
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
  fs.writeFileSync(changes_file, next);
  return { previous, changes_file };
};

// Roll back changes
exports.abort = function (state) {
  fs.writeFileSync(state.changes_file, state.previous);
  process.exitCode = 1;
};

// Add changes to git, unless the user removed the current version to abort
exports.add = function (state) {
  const package_json = fs.readFileSync('package.json', 'utf8');
  const { version } = JSON.parse(package_json);
  if (exists(fs.readFileSync(state.changes_file, 'utf8'), version)) {
    // Add changes file to git so that npm includes it in the release commit
    $.execSync(`git add ${state.changes_file}`);
  } else {
    exports.abort(state);
  }
};
