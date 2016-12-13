# Changes

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

