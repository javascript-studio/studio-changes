'use strict';

const fs = require('fs');
const $ = require('child_process');

const CHANGES_FILE = 'CHANGES.md';
const CHANGES_HEADING = '# Changes\n\n';

function exists(changes, version) {
  return changes.indexOf(`\n## ${version}\n`) !== -1;
}

// Write the commit history to the changes file
exports.write = function () {
  const package_json = fs.readFileSync('package.json', 'utf8');
  const { version, author } = JSON.parse(package_json);

  // Get previous file content
  let previous;
  try {
    previous = fs.readFileSync(CHANGES_FILE, 'utf8');
    if (previous.indexOf(CHANGES_HEADING) !== 0) {
      console.error(`Unexpected ${CHANGES_FILE} file header`);
      process.exit(1);
      return null;
    }
  } catch (e) {
    previous = CHANGES_HEADING;
  }

  // Do not allow version to be added twice
  if (exists(previous, version)) {
    console.error(`Version ${version} is already in ${CHANGES_FILE}`);
    process.exit(1);
    return null;
  }

  // Generate changes for this release
  const version_match = previous.match(/^## ([0-9a-z\.\-]+)$/m);
  const log_range = version_match ? `v${version_match[1]}..HEAD` : '';
  const flags = '--format="» %s (%an)%n%n%b%n" --no-merges';
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
    .replace(/^([^\»\s])/gm, '  $1')
    .replace(/^»/gm, '-');

  // Only mention contributors
  if (author) {
    const author_name = author.substring(0, author.indexOf('<')).trim();
    changes = changes.replace(new RegExp(` \\(${author_name}\\)$`, 'gm'), '');
  }

  // Generate new changes
  let next = `${CHANGES_HEADING}## ${version}\n\n${changes}`;
  const remain = previous.substring(CHANGES_HEADING.length);
  if (remain) {
    next += `\n${remain}`;
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
