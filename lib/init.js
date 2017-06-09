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

  const version_script = argv && argv.file
    ? `changes --file ${argv.file}`
    : 'changes';

  addScript(scripts, 'preversion', 'npm test');
  addScript(scripts, 'version', version_script);
  addScript(scripts, 'postversion', 'git push --follow-tags && npm publish');

  const indent = detectIndent(json).indent || '  ';
  const out = JSON.stringify(pkg, null, indent);
  fs.writeFileSync('package.json', `${out}\n`, 'utf8');
  return true;
};
