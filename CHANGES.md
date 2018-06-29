# Changes

## 1.5.1

- 🐛 [`eff93ab`](https://github.com/javascript-studio/studio-changes/commit/eff93ab669f64a4ea73b4e2a48cac218fc94e616)
  Wrap commit link text in back ticks

## 1.5.0

- 🍏 [a8da440](https://github.com/javascript-studio/studio-changes/commit/a8da4404ca9ee546f9b27c3f65df25c683b1c21d)
  Add commit links with --commits
- 🍏 [9c7d655](https://github.com/javascript-studio/studio-changes/commit/9c7d65560b33087ee7cd2adc88dee3a1a054901c)
  Use new `-c` option
- 🐛 [a5e2d02](https://github.com/javascript-studio/studio-changes/commit/a5e2d029a82b56385746402a8f5b1485d3eede55)
  Keep body with multiple paragraphs together

## 1.4.2

- 🐛 Replace editor module with Studio Editor to fix [#14]

[#14]: https://github.com/javascript-studio/studio-changes/issues/14

## 1.4.1

- 🐛 Support "author" object in `package.json`

## 1.4.0

Pat Cavit made `changes` [lerna][] compatible by allowing to specify a custom
tag name format. Use it like this:

```
$ changes --tag '${name}@${version}'
```

- 🍏 Custom git tag format support (Pat Cavit)

    > Supports the parsed version from `CHANGES.md` as `${version}` along w/
    > any other string-compatible key in `package.json`.

- 📚 Add `npx` invocation examples

[lerna]: https://github.com/lerna/lerna

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

