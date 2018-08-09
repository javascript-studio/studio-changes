/*eslint-env mocha*/
'use strict';

const fs = require('fs');
const { assert, refute, sinon } = require('@sinonjs/referee-sinon');
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
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('adds entire scripts section with default indent', () => {
    fs.readFileSync.withArgs('package.json').returns('{}');

    const result = init();

    assert.isTrue(result);
    assert.calledOnce(fs.writeFileSync);
    assert.calledWith(fs.writeFileSync, 'package.json', `{
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

    assert.isTrue(result);
    assert.calledOnce(fs.writeFileSync);
    assert.calledWith(fs.writeFileSync, 'package.json', `{
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

    assert.isTrue(result);
    assert.calledOnce(fs.writeFileSync);
    assert.calledWith(fs.writeFileSync, 'package.json', `{
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

    assert.isTrue(result);
    assert.calledOnce(fs.writeFileSync);
    assert.calledWith(fs.writeFileSync, 'package.json', `{
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

    assert.isFalse(result);
    refute.called(fs.writeFileSync);
  });

  it('adds --file options if passed', () => {
    fs.readFileSync.withArgs('package.json').returns('{}');

    const result = init({ file: 'changelog.md' });

    assert.isTrue(result);
    assert.calledOnce(fs.writeFileSync);
    assert.calledWith(fs.writeFileSync, 'package.json', `{
  "scripts": {
    "preversion": "${SCRIPT_PREVERSION}",
    "version": "${SCRIPT_VERSION} --file changelog.md",
    "postversion": "${SCRIPT_POSTVERSION}"
  }
}
`);
  });

  it('adds --commits if homepage is configured', () => {
    fs.readFileSync.withArgs('package.json').returns(`{
  "homepage": "https://github.com/javascript-studio/studio-changes"
}`);

    const result = init();

    assert.isTrue(result);
    assert.calledOnce(fs.writeFileSync);
    assert.calledWith(fs.writeFileSync, 'package.json', `{
  "homepage": "https://github.com/javascript-studio/studio-changes",
  "scripts": {
    "preversion": "${SCRIPT_PREVERSION}",
    "version": "${SCRIPT_VERSION} --commits",
    "postversion": "${SCRIPT_POSTVERSION}"
  }
}
`);
  });

  it('adds --commits option if passed', () => {
    fs.readFileSync.withArgs('package.json').returns('{}');

    const result = init({ commits: 'https://javascript.studio' });

    assert.isTrue(result);
    assert.calledOnce(fs.writeFileSync);
    assert.calledWith(fs.writeFileSync, 'package.json', `{
  "scripts": {
    "preversion": "${SCRIPT_PREVERSION}",
    "version": "${SCRIPT_VERSION} --commits https://javascript.studio",
    "postversion": "${SCRIPT_POSTVERSION}"
  }
}
`);
  });

  it('adds --commits if homepage is configured and --commits is given', () => {
    fs.readFileSync.withArgs('package.json').returns(`{
  "homepage": "https://github.com/javascript-studio/studio-changes"
}`);

    const result = init({ commits: true }); // no argument provided, but present

    assert.isTrue(result);
    assert.calledOnce(fs.writeFileSync);
    assert.calledWith(fs.writeFileSync, 'package.json', `{
  "homepage": "https://github.com/javascript-studio/studio-changes",
  "scripts": {
    "preversion": "${SCRIPT_PREVERSION}",
    "version": "${SCRIPT_VERSION} --commits",
    "postversion": "${SCRIPT_POSTVERSION}"
  }
}
`);
  });

  it('fails if --commits is given but homepage is missing', () => {
    fs.readFileSync.withArgs('package.json').returns('{}');

    const result = init({ commits: true }); // no argument provided, but present

    assert.isFalse(result);
    refute.called(fs.writeFileSync);
    assert.calledOnceWith(console.error,
      '--commits option requires base URL or "homepage" in package.json\n');
  });

  it('adds --file and --commits options if passed', () => {
    fs.readFileSync.withArgs('package.json').returns('{}');

    const result = init({
      file: 'changelog.md',
      commits: 'https://studio'
    });

    assert.isTrue(result);
    assert.calledOnce(fs.writeFileSync);
    assert.calledWith(fs.writeFileSync, 'package.json', `{
  "scripts": {
    "preversion": "${SCRIPT_PREVERSION}",
    "version": "${SCRIPT_VERSION} --file changelog.md --commits https://studio",
    "postversion": "${SCRIPT_POSTVERSION}"
  }
}
`);
  });

  it('prefers explicitly specified --commits config over homepage', () => {
    fs.readFileSync.withArgs('package.json').returns(`{
  "homepage": "https://github.com/javascript-studio/studio-changes"
}`);

    const result = init({ commits: 'https://javascript.studio' });

    assert.isTrue(result);
    assert.calledOnce(fs.writeFileSync);
    assert.calledWith(fs.writeFileSync, 'package.json', `{
  "homepage": "https://github.com/javascript-studio/studio-changes",
  "scripts": {
    "preversion": "${SCRIPT_PREVERSION}",
    "version": "${SCRIPT_VERSION} --commits https://javascript.studio",
    "postversion": "${SCRIPT_POSTVERSION}"
  }
}
`);
  });

  it('combines --file with package.json homepage', () => {
    fs.readFileSync.withArgs('package.json').returns(`{
  "homepage": "https://github.com/javascript-studio/studio-changes"
}`);

    const result = init({ file: 'changelog.md' });

    assert.isTrue(result);
    assert.calledOnce(fs.writeFileSync);
    assert.calledWith(fs.writeFileSync, 'package.json', `{
  "homepage": "https://github.com/javascript-studio/studio-changes",
  "scripts": {
    "preversion": "${SCRIPT_PREVERSION}",
    "version": "${SCRIPT_VERSION} --file changelog.md --commits",
    "postversion": "${SCRIPT_POSTVERSION}"
  }
}
`);
  });

});
