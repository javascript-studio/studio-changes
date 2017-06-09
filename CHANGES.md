# Changes

## 1.3.0

Now you can generate the npm version lifecycle scripts with `changes` itself:

```bash
$ node_modules/.bin/changes --init
```

Indentations are preserved, existing scripts will not be touched, and if a
`version` script already exists, no changes are made.

- 🍏 Add `--init` to generate lifecycle scripts
- 🍏 Allow to combine `--init` and `--file`
- ✨ Add `package-lock.json`

## 1.2.0

- 🍏 Quote commit body (#10)

    > Render commit bodies as markdown quotes to better group long commit
    > messages.

## 1.1.0

🍏 Blade Barringer [added two command line options][pr6]:

  - `--file` or `-f` allows to configure the changelog file name. It defaults
    to `CHANGES.md` as before.
  - `--help` or `-h` displays a help message.

🍏 If the current version number is found in the changelog, the changes command
exits with code 1. In addition, it will now also print any outstanding commits.
With this you can preview the changes for the next release:

```bash
$ node_modules/.bin/changes
```

🐛 The message body is now indented with four spaces instead of two to make the
paragraph part of the list item. The body is now also separated from the next
list item by a blank line.

[pr6]: https://github.com/javascript-studio/studio-changes/pull/6

## 1.0.5

🐛 When git is configured to convert `LF` to `CRLF` on Windows, the header
detection didn't work. [This patch fixes the header detection][pr2] and uses
the line terminator found in the header when generating newlines.

[pr2]: https://github.com/javascript-studio/studio-changes/pull/2

## 1.0.4

Improve project description and usage notes.

## 1.0.3

📣 This release open sources `@studio/changes`. It adds the MIT license and
some meta data to the package. The documentation was enriched with an animated
GIF, but no functional changes have been made. Happy releasing!

## 1.0.2

Adding unit tests revealed several bugs, like actually reading the
`package.json` file in the current directory instead of the one from this
project.

If a commit message has a non-empty body, it is now shown below the subject.

## 1.0.1

With this patch, the previous version is taken from the `CHANGES.md` instead of
using the `package.json` version. This makes the git log range work in case
there has been a release before. Also improved the npm scripts documentation
slightly.

## 1.0.0

- Add pre- and postversion scripts
- Inception

