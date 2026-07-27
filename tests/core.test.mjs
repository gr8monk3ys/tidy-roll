import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  TidySession, SORTS, formatBytes, mediaKind, extensionOf, KEEP, TOSS,
} from '../extension/app/core.js';

const item = (id, extra = {}) => ({ id, name: `${id}.jpg`, size: 1000, ...extra });
const items = (...ids) => ids.map((id) => item(id));

describe('TidySession construction', () => {
  test('rejects non-arrays and bad ids', () => {
    assert.throws(() => new TidySession('nope'), TypeError);
    assert.throws(() => new TidySession([{ name: 'x.jpg' }]), TypeError);
    assert.throws(() => new TidySession([item('a'), item('a')]), /duplicate/);
  });

  test('an empty session is immediately done', () => {
    const session = new TidySession([]);
    assert.equal(session.done, true);
    assert.equal(session.current, null);
    assert.equal(session.progress, 1);
    assert.equal(session.decide(KEEP), null);
  });

  test('does not mutate the input array', () => {
    const input = items('a', 'b');
    const session = new TidySession(input);
    session.decide(KEEP);
    assert.equal(input.length, 2);
  });
});

describe('decisions', () => {
  test('keep and toss route items and advance the queue', () => {
    const session = new TidySession(items('a', 'b', 'c'));
    assert.equal(session.current.id, 'a');
    session.decide(KEEP);
    session.decide(TOSS);
    assert.equal(session.current.id, 'c');
    assert.deepEqual(session.kept.map((i) => i.id), ['a']);
    assert.deepEqual(session.tossed.map((i) => i.id), ['b']);
    assert.equal(session.reviewed, 2);
    assert.equal(session.remaining, 1);
    assert.equal(session.done, false);
  });

  test('unknown decisions throw', () => {
    const session = new TidySession(items('a'));
    assert.throws(() => session.decide('maybe'), TypeError);
  });

  test('bytesTossed sums tossed sizes only', () => {
    const session = new TidySession([
      item('a', { size: 300 }), item('b', { size: 700 }), item('c', { size: 11 }),
    ]);
    session.decide(TOSS);
    session.decide(KEEP);
    session.decide(TOSS);
    assert.equal(session.bytesTossed, 311);
  });

  test('progress runs 0 -> 1', () => {
    const session = new TidySession(items('a', 'b'));
    assert.equal(session.progress, 0);
    session.decide(KEEP);
    assert.equal(session.progress, 0.5);
    session.decide(TOSS);
    assert.equal(session.progress, 1);
    assert.equal(session.done, true);
  });
});

describe('skip', () => {
  test('moves the current item to the back of the queue', () => {
    const session = new TidySession(items('a', 'b', 'c'));
    assert.equal(session.skip().id, 'a');
    assert.equal(session.current.id, 'b');
    session.decide(KEEP);
    session.decide(KEEP);
    assert.equal(session.current.id, 'a');
  });

  test('is a no-op with fewer than two items', () => {
    const session = new TidySession(items('only'));
    assert.equal(session.skip(), null);
    assert.equal(session.current.id, 'only');
  });
});

describe('undo', () => {
  test('returns null with nothing to undo', () => {
    assert.equal(new TidySession(items('a')).undo(), null);
  });

  test('reverts a keep', () => {
    const session = new TidySession(items('a', 'b'));
    session.decide(KEEP);
    assert.equal(session.undo().id, 'a');
    assert.equal(session.current.id, 'a');
    assert.equal(session.kept.length, 0);
    assert.equal(session.reviewed, 0);
  });

  test('reverts a toss and its byte count', () => {
    const session = new TidySession([item('a', { size: 500 }), item('b')]);
    session.decide(TOSS);
    assert.equal(session.bytesTossed, 500);
    session.undo();
    assert.equal(session.bytesTossed, 0);
    assert.equal(session.current.id, 'a');
  });

  test('reverts a skip', () => {
    const session = new TidySession(items('a', 'b', 'c'));
    session.skip();
    session.undo();
    assert.deepEqual(session.queue.map((i) => i.id), ['a', 'b', 'c']);
  });

  test('unwinds a whole session in order', () => {
    const session = new TidySession(items('a', 'b', 'c'));
    session.decide(KEEP);
    session.skip();
    session.decide(TOSS);
    while (session.undo()) { /* unwind */ }
    assert.deepEqual(session.queue.map((i) => i.id), ['a', 'b', 'c']);
    assert.equal(session.reviewed, 0);
  });

  test('undo after finishing brings the session back from done', () => {
    const session = new TidySession(items('a'));
    session.decide(TOSS);
    assert.equal(session.done, true);
    session.undo();
    assert.equal(session.done, false);
    assert.equal(session.current.id, 'a');
  });
});

describe('restore', () => {
  test('moves a tossed item to kept', () => {
    const session = new TidySession(items('a', 'b'));
    session.decide(TOSS);
    session.decide(TOSS);
    assert.equal(session.restore('a'), true);
    assert.deepEqual(session.tossed.map((i) => i.id), ['b']);
    assert.deepEqual(session.kept.map((i) => i.id), ['a']);
    assert.equal(session.bytesTossed, 1000);
  });

  test('returns false for unknown ids', () => {
    const session = new TidySession(items('a'));
    session.decide(TOSS);
    assert.equal(session.restore('zzz'), false);
  });
});

describe('stats', () => {
  test('reports a consistent snapshot', () => {
    const session = new TidySession(items('a', 'b', 'c', 'd'));
    session.decide(KEEP);
    session.decide(TOSS);
    assert.deepEqual(session.stats(), {
      total: 4, remaining: 2, reviewed: 2, kept: 1, tossed: 1,
      bytesTossed: 1000, progress: 0.5,
    });
  });
});

describe('SORTS', () => {
  const unsorted = [
    { id: 'mid', size: 50, lastModified: 200 },
    { id: 'big', size: 900, lastModified: 100 },
    { id: 'new', size: 10, lastModified: 300 },
  ];

  test('oldest / newest / largest', () => {
    assert.deepEqual(SORTS.oldest(unsorted).map((i) => i.id), ['big', 'mid', 'new']);
    assert.deepEqual(SORTS.newest(unsorted).map((i) => i.id), ['new', 'mid', 'big']);
    assert.deepEqual(SORTS.largest(unsorted).map((i) => i.id), ['big', 'mid', 'new']);
  });

  test('shuffle keeps every item and returns a new array', () => {
    const shuffled = SORTS.shuffle(unsorted);
    assert.notEqual(shuffled, unsorted);
    assert.deepEqual(shuffled.map((i) => i.id).sort(), ['big', 'mid', 'new']);
  });

  test('sorts do not mutate their input', () => {
    const copy = unsorted.slice();
    SORTS.oldest(unsorted);
    SORTS.largest(unsorted);
    assert.deepEqual(unsorted, copy);
  });
});

describe('formatBytes', () => {
  test('covers the unit ladder', () => {
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(-5), '0 B');
    assert.equal(formatBytes(NaN), '0 B');
    assert.equal(formatBytes(999), '999 B');
    assert.equal(formatBytes(1024), '1.0 KB');
    assert.equal(formatBytes(1536), '1.5 KB');
    assert.equal(formatBytes(1048576), '1.0 MB');
    assert.equal(formatBytes(3_481_204), '3.3 MB');
    assert.equal(formatBytes(150 * 1024 ** 2), '150 MB');
    assert.equal(formatBytes(1024 ** 4), '1.0 TB');
  });
});

describe('media detection', () => {
  test('extensionOf', () => {
    assert.equal(extensionOf('IMG_0001.JPG'), 'jpg');
    assert.equal(extensionOf('archive.tar.gz'), 'gz');
    assert.equal(extensionOf('no-extension'), '');
  });

  test('mediaKind routes images, videos, and junk', () => {
    assert.equal(mediaKind('photo.jpeg'), 'image');
    assert.equal(mediaKind('photo.HEIC'), 'image');
    assert.equal(mediaKind('clip.mp4'), 'video');
    assert.equal(mediaKind('clip.mp4', { includeVideos: false }), null);
    assert.equal(mediaKind('notes.txt'), null);
    assert.equal(mediaKind('binary.exe'), null);
  });
});
