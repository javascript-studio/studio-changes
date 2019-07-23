/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 *
 * @license MIT
 */
'use strict';

const $ = require('child_process');

const VARIABLE_RE = /\$\{([^}]+)\}/g;

function parseAuthor(author) {
  const m = author.match(/[<(]/);
  return m ? author.substring(0, m.index).trim() : author;
}

module.exports = function ({
  log_range,
  commits,
  newline,
  pkg
}) {

  let flags = '--format="» ';
  if (commits) {
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
    .replace(/^ {4}> \n/gm, '    >\n')
    // Replace commit markers with dashes:
    .replace(/^»/gm, '-')
    // Replace newline markers with newlines:
    .replace(/«/gm, '\n')
    // Restore original newlines:
    .replace(/\n/gm, newline);

  // Only mention contributors
  const { author } = pkg;
  if (author) {
    const author_name = typeof author === 'object'
      ? author.name
      : parseAuthor(author);
    changes = changes.replace(new RegExp(` \\(${author_name}\\)$`, 'gm'), '');
  }

  return changes;
};
