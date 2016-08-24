/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const $ = require('child_process');
const assert = require('assert');
const sinon = require('sinon');
const changes = require('..');

describe('changes', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(fs, 'readFileSync');
    sandbox.stub(fs, 'writeFileSync');
    sandbox.stub($, 'execSync');
    sandbox.stub(process, 'exit');
    sandbox.stub(console, 'error');
    fs.readFileSync.withArgs('package.json').returns(JSON.stringify({
      version: '1.0.0',
      author: 'Studio <support@javascript.studio>'
    }));
  });

  afterEach(() => {
    sandbox.restore();
  });

  function missingChanges() {
    fs.readFileSync.withArgs('CHANGES.md').throws(new Error());
  }

  function setChanges(str) {
    fs.readFileSync.withArgs('CHANGES.md').returns(str);
  }

  function setLog(log) {
    $.execSync.returns(log);
  }

  it('generates new changes file', () => {
    missingChanges();
    setLog('- Inception (That Dude)\n\n\n\n');

    changes.write();

    sinon.assert.calledOnce(fs.writeFileSync);
    sinon.assert.calledWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception (That Dude)\n');
    sinon.assert.calledOnce($.execSync);
    sinon.assert.calledWithMatch($.execSync, 'git log  --format=');
  });

  it('removes package author', () => {
    missingChanges();
    setLog('- Inception (Studio)\n\n\n\n');

    changes.write();

    sinon.assert.calledOnce(fs.writeFileSync);
    sinon.assert.calledWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n');
  });

  it('add commit log to existing changes file', () => {
    const initial = '# Changes\n\n## 0.1.0\n\nSome foo.\n';
    setChanges(initial);
    setLog('- Inception (Studio)\n\n\n\n');

    const previous = changes.write();

    sinon.assert.calledOnce(fs.writeFileSync);
    sinon.assert.calledWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n- Inception\n\n## 0.1.0\n\nSome foo.\n');
    sinon.assert.calledOnce($.execSync);
    sinon.assert.calledWithMatch($.execSync, 'git log v0.1.0..HEAD');
    assert.equal(previous, initial);
  });

  it('identifies previous commit with -beta suffix', () => {
    setChanges('# Changes\n\n## 0.1.0-beta\n\nSome foo.\n');
    setLog('- Inception (Studio)\n\n\n\n');

    changes.write();

    sinon.assert.calledWithMatch($.execSync, 'git log v0.1.0-beta..HEAD');
  });

  it('adds body indented on new line', () => {
    missingChanges();
    setLog('- Inception (Studio)\n\nFoo Bar Doo\n\n- Other (Dude)\n\n\n\n'
      + '- Third (Person)\n\nDoes\nstuff\n\n');

    changes.write();

    sinon.assert.calledOnce(fs.writeFileSync);
    sinon.assert.calledWith(fs.writeFileSync, 'CHANGES.md',
      '# Changes\n\n## 1.0.0\n\n'
      + '- Inception\n\n  Foo Bar Doo\n\n'
      + '- Other (Dude)\n'
      + '- Third (Person)\n\n  Does\n  stuff\n\n');
  });

  it('fails if changes file has not the right format', () => {
    setChanges('# Something else\n\n## 1.0.0\n\nFoo');

    changes.write();

    sinon.assert.calledOnce(console.error);
    sinon.assert.calledWith(console.error, 'Unexpected CHANGES.md file header');
    sinon.assert.calledOnce(process.exit);
    sinon.assert.calledWith(process.exit, 1);
  });

  it('fails if version is already in changes file', () => {
    setChanges('# Changes\n\n## 1.0.0\n\nFoo');

    changes.write();

    sinon.assert.calledOnce(console.error);
    sinon.assert.calledWith(console.error,
      'Version 1.0.0 is already in CHANGES.md');
    sinon.assert.calledOnce(process.exit);
    sinon.assert.calledWith(process.exit, 1);
  });

});
