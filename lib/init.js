/*
 * Copyright (c) Maximilian Antoni <max@javascript.studio>
 *
 * @license MIT
 */
'use strict';

const fs = require('fs');
const detectIndent = require('detect-indent');

function addScript(scripts, name, source) {
  if (!scripts[name]) {
    scripts[name] = source;
    return true;
  }
  return false;
}

module.exports = function (argv) {
  const json = fs.readFileSync('package.json', 'utf8');
  const pkg = JSON.parse(json);

  let scripts = pkg.scripts;
  if (!scripts) {
    scripts = pkg.scripts = {};
  }
  if (scripts.version) {
    return false;
  }

  let version_script = 'changes';
  let has_commits = false;
  if (argv) {
    if (argv.file) {
      version_script += ` --file ${argv.file}`;
    }
    if (argv.commits) {
      if (typeof argv.commits === 'boolean') {
        if (!pkg.homepage) {
          console.error('--commits option requires base URL or "homepage" in '
            + 'package.json\n');
          return false;
        }
      } else {
        version_script += ` --commits ${argv.commits}`;
        has_commits = true;
      }
    }
  }
  if (!has_commits && pkg.homepage) {
    version_script += ' --commits';
  }

  addScript(scripts, 'preversion', 'npm test');
  addScript(scripts, 'version', version_script);
  addScript(scripts, 'postversion', 'git push --follow-tags && npm publish');

  const indent = detectIndent(json).indent || '  ';
  const out = JSON.stringify(pkg, null, indent);
  fs.writeFileSync('package.json', `${out}\n`, 'utf8');
  return true;
};
