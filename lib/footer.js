'use strict';

const $ = require('child_process');
const github = require('./github');

function buildFooter(author, homepage) {
  let footer = '_Released';
  if (author) {
    footer += homepage ? ` by [${author}](${homepage})` : ` by ${author}`;
  }
  const today = new Date().toISOString().split('T')[0];
  return `${footer} on ${today}._`;
}

function readGitConfig(name) {
  try {
    return $.execSync(`git config --get ${name}`).trim();
  } catch (e) {
    return '';
  }
}

async function generateFooter() {
  const author = readGitConfig('user.name') || process.env.GIT_AUTHOR_NAME;
  if (author) {
    const email = readGitConfig('user.email') || process.env.GIT_AUTHOR_EMAIL;
    if (email) {
      const homepage = await github.fetchUserHomepage(email);
      return buildFooter(author, homepage);
    }
    return buildFooter(author);
  }
  return buildFooter();
}

exports.generate = generateFooter;
