import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const album = await readFile(new URL("../album/index.html", import.meta.url), "utf8");

test("album tracks contain structured chord progressions", () => {
  const match = album.match(/var T=(\[.*?\]);\s*var BASE=/s);
  assert.ok(match, "album track data must be embedded as JSON");
  const tracks = JSON.parse(match[1]);
  assert.ok(tracks.length > 0);
  for (const track of tracks) {
    assert.ok(track.data?.chords?.sections?.length, track.title + " must contain chord sections");
    assert.ok(track.data.chords.sections.every(section => Array.isArray(section.progression) && section.progression.length));
  }
});

test("album provides a direct Canvas handoff carrying lyrics and chord data", () => {
  assert.match(album, /composition-canvas\.html#lyrics=/);
  assert.match(album, /kind:'duet'/);
  assert.match(album, /sections:\[\{role:'A',label:'Mia \/ A verse'/);
  assert.match(album, /chords:t\.data\.chords/);
});
