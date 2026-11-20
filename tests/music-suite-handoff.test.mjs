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


test("chat handoff sends the complete Free Talk transcript to Canvas as editable source material", async () => {
  const app = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const start = app.indexOf("function sendLatestEnglishToMusicSuite()");
  const end = app.indexOf("\nfunction ", start + 10);
  assert.ok(start >= 0 && end > start, "handoff function must exist");
  const handoff = app.slice(start, end);
  assert.match(app, /transcript: \[\]/);
  assert.match(app, /function pushTranscript\(role, content\)/);
  assert.match(app, /STATE\.transcript\.push\(entry\)/);
  assert.match(app, /FREETALK_TRANSCRIPT_STORAGE_KEY/);
  assert.match(app, /function saveFreeTalkTranscript\(\)/);
  assert.match(app, /function loadFreeTalkTranscript\(\)/);
  assert.match(app, /rollbackFailedUserTurn\(userHistoryEntry\)/);
  assert.match(app, /STATE\.transcript = \[\]/);
  assert.match(handoff, /STATE\.transcript/);
  assert.match(handoff, /source: 'speak-native-dialogue'/);
  assert.match(handoff, /dialogue/);
  assert.match(handoff, /turnId: index \+ 1/);
  assert.match(handoff, /apps\/composition-canvas\.html#import=/);
  assert.match(handoff, /http:\/\/localhost:8000\/apps\/composition-canvas\.html#import=/);
  assert.doesNotMatch(handoff, /localhost:8000\/music-suite/);
  assert.match(handoff, /https:\/\/norinori-jan\.github\.io\/music-suite/);
  assert.doesNotMatch(handoff, /vocal-lab-v3\.html/);
});
