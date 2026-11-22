# Swiping stages removals; only an explicit confirmation commits them

A left swipe never touches the library or disk. Items are staged and only removed after the user confirms on the summary screen (`confirmAndCommit` on mobile, `executeToss` in the extension). The extension defaults to trash mode, moving files into a `Tidy Roll - Tossed` folder rather than deleting them. We accepted the extra confirmation step because a fast swipe gesture makes accidental irreversible deletion easy.

## Consequences

- After a failed or partial delete, `commitStagedDeletes` re-checks the library to report exactly which assets are gone instead of assuming none were.
- Only an explicit `true` from the confirmation counts as a yes.
