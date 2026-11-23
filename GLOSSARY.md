# Tidy Roll

A swipe-to-clean photo tool shipped as a Chrome extension (`extension/`), an Expo mobile app (`mobile/`) and a marketing site (`site/`). Photos stay on the device; nothing is deleted until the user confirms.

## Language

**Session**:
One pass through a queue of media items, recording a decision for each. In the extension this is `TidySession`; on mobile it is identified by a `sessionId` and summarised by a `SessionSummary`.
_Avoid_: Run, review round

**Item**:
A single media file under review (extension: `id`, `name`, `size`; mobile: a `SessionAsset`).
_Avoid_: Photo, file (when the type of media is irrelevant)

**Queue**:
The ordered list of items not yet decided in a session; `current` is its head and `peek` looks behind it.
_Avoid_: Stack, deck

**Decision**:
The keep or discard verdict recorded for an item. Extension values are `keep` and `toss`; mobile values are `keep`, `delete` and `bookmark`.
_Avoid_: Vote, choice

**Keep**:
A decision to leave the item untouched.

**Toss**:
The extension's decision to remove an item, acted on only after the summary is confirmed. The mobile app calls the same idea **delete**.
_Avoid_: Discard

**Bookmark**:
A mobile decision that saves an item (`BookmarkAsset`) to the Bookmarks tab to look at later instead of deciding now.
_Avoid_: Favourite, star

**Skip**:
Deferring the current item to the back of the queue without a decision.

**Undo**:
Reverting the most recent decision or skip.

**Restore**:
Rescuing a tossed item from the summary screen; it counts as kept.

**Summary**:
The screen at the end of a session that lists what was tossed or deleted and asks for confirmation. Mobile stores it as a `SessionSummary`.
_Avoid_: Results, review screen

## Removal

**Staged delete**:
An asset marked for deletion during a session but not yet touched in the library. Swiping left only stages; `confirmAndCommit` performs the removal after an explicit yes.
_Avoid_: Pending delete

**Commit**:
Carrying out the staged removals once confirmed. On mobile a `CommitAction` is either `deleteAssets` or `removeFromAlbum`.

**Trash mode**:
The extension's default toss mode: tossed files are moved into the `Tidy Roll - Tossed` folder inside the tidied folder instead of being deleted.
_Avoid_: Recycle bin

**Bytes reclaimed**:
Total size freed by confirmed deletes, counting only sizes that could be measured (`bytesReclaimed` in `AppStats`).
_Avoid_: Space saved

## Scope and progress

**Scope**:
The set of media a session covers, keyed by `scopeKey`. Mobile modes are `month`, `day`, `recents`, `random`, `album` and `bookmarks`.
_Avoid_: Filter, collection

**Month key**:
A `YYYY-MM` string identifying a calendar month scope (`MonthKey`).

**Cursor**:
The saved paging position in a scope (`ScopeProgress`, `StoredProgress`), used to resume where the user left off. Reopening a completed scope starts from the top.
_Avoid_: Offset, bookmark (which means something else here)

**On This Day**:
A mobile feature that reviews photos taken on today's date in past years; completing it extends the **streak** (`streakCount`).

**Streak**:
Consecutive days on which the On This Day scope was completed.

**Stats**:
Lifetime tidying counts (`AppStats`: reviewed, kept, bookmarked, deleted, removed from albums, bytes reclaimed). Never contain file names or contents.
