/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const assert = require('assert');
const sinon = require('sinon');
const init = require('../lib/init');

const SCRIPT_PREVERSION = 'npm test';
const SCRIPT_VERSION = 'changes';
const SCRIPT_POSTVERSION = 'git push --follow-tags && npm publish';

describe('init', () => {

  beforeEach(() => {
    sinon.stub(fs, 'readFileSync');
    sinon.stub(fs, 'writeFileSync');
    fs.readFileSync.withArgs('package.json').returns(JSON.stringify({
      version: '1.0.0',
      author: 'Studio <support@javascript.studio>'
    }));
  });

  afterEach(() => {
    sinon.restore();
  });

  it('adds entire scripts section with default indent', () => {
    fs.readFileSync.withArgs('package.json').returns('{}');

    const result = init();

    assert.equal(result, true);
    sinon.assert.calledOnce(fs.writeFileSync);
    sinon.assert.calledWith(fs.writeFileSync, 'package.json', `{
  "scripts": {
    "preversion": "${SCRIPT_PREVERSION}",
    "version": "${SCRIPT_VERSION}",
    "postversion": "${SCRIPT_POSTVERSION}"
  }
}
`, 'utf8');
  });

  it('adds scripts to existing scripts with 4 space indent', () => {
    fs.readFileSync.withArgs('package.json').returns(`{
      "scripts": {
          "test": "echo 'no tests'"
      }
    }`);

    const result = init();

    assert.equal(result, true);
    sinon.assert.calledOnce(fs.writeFileSync);
    sinon.assert.calledWith(fs.writeFileSync, 'package.json', `{
    "scripts": {
        "test": "echo 'no tests'",
        "preversion": "${SCRIPT_PREVERSION}",
        "version": "${SCRIPT_VERSION}",
        "postversion": "${SCRIPT_POSTVERSION}"
    }
}
`);
  });

  it('does not replace existing "preversion" script', () => {
    fs.readFileSync.withArgs('package.json').returns(`{
      "scripts": {
        "preversion": "echo 'Already defined'"
      }
    }`);

    const result = init();

    assert.equal(result, true);
    sinon.assert.calledOnce(fs.writeFileSync);
    sinon.assert.calledWith(fs.writeFileSync, 'package.json', `{
  "scripts": {
    "preversion": "echo 'Already defined'",
    "version": "${SCRIPT_VERSION}",
    "postversion": "${SCRIPT_POSTVERSION}"
  }
}
`);
  });

  it('does not replace existing "postversion" script', () => {
    fs.readFileSync.withArgs('package.json').returns(`{
      "scripts": {
        "postversion": "echo 'Already defined'"
      }
    }`);

    const result = init();

    assert.equal(result, true);
    sinon.assert.calledOnce(fs.writeFileSync);
    sinon.assert.calledWith(fs.writeFileSync, 'package.json', `{
  "scripts": {
    "postversion": "echo 'Already defined'",
    "preversion": "${SCRIPT_PREVERSION}",
    "version": "${SCRIPT_VERSION}"
  }
}
`);
  });

  it('does nothing if "version" script is already defined', () => {
    fs.readFileSync.withArgs('package.json').returns(`{
      "scripts": {
        "version": "echo 'Already defined'"
      }
    }`);

    const result = init();

    assert.equal(result, false);
    sinon.assert.notCalled(fs.writeFileSync);
  });

  it('adds --file options if passed', () => {
    fs.readFileSync.withArgs('package.json').returns('{}');

    const result = init({ file: 'changelog.md' });

    assert.equal(result, true);
    sinon.assert.calledOnce(fs.writeFileSync);
    sinon.assert.calledWith(fs.writeFileSync, 'package.json', `{
  "scripts": {
    "preversion": "${SCRIPT_PREVERSION}",
    "version": "${SCRIPT_VERSION} --file changelog.md",
    "postversion": "${SCRIPT_POSTVERSION}"
  }
}
`);
  });

});
