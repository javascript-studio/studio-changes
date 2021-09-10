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
    commits: 'c',
    file: 'f',
    tag: 't',
    dir: 'd',
    workspace: 'w',
    help: 'h'
  }
});

if (argv.help) {
  /* eslint-disable max-len */
  console.log(`Usage: changes [options]

Options:
      --init            Add version lifecycle scripts to package.json.
  -c, --commits [URL]   Generate links to commits using the given URL as base.
                        If no URL is given it defaults to "\${homepage}/commit".
      --footer          Generate a footer with the git author and release date.
  -f, --file [FILENAME] Specify the name of the changelog file. Defaults to CHANGES.md.
  -t, --tag [FORMAT]    Specify a custom git tag format to use. Defaults to "v\${version}".
  -d, --dir [PATH]      Specify a directory to filter git log entries.
  -w, --workspace       Convenience flag to set --dir to the current directory name and --tag to "\${dir} v\${version}"
  -h, --help            Display this help message.
`);
  /* eslint-enable */
  process.exit();
}

if (argv.init) {
  // eslint-disable-next-line node/global-require
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
if (argv.dir) {
  options.dir = argv.dir;
}
if (argv.commits) {
  options.commits = argv.commits;
}
if (argv.footer) {
  options.footer = argv.footer;
}
if (argv.workspace) {
  options.workspace = true;
}

// Write the commit history to the changes file
changes
  .write(options)
  .then((state) => {
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
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
