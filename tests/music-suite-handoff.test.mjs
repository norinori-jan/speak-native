import test from "node:test";
import vm from "node:vm";
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


function createTranscriptHarness({ stored = null, storageThrows = false } = {}) {
  const values = new Map();
  if (stored !== null) values.set("dei_freetalk_transcript_v1", stored);
  const localStorage = {
    getItem(key) { if (storageThrows) throw new Error("storage unavailable"); return values.get(key) ?? null; },
    setItem(key, value) { if (storageThrows) throw new Error("storage unavailable"); values.set(key, value); },
    removeItem(key) { if (storageThrows) throw new Error("storage unavailable"); values.delete(key); }
  };
  const context = {
    localStorage,
    console: { warn() {} },
    convMode: "casual",
    currentTopic: "daily",
    TOPIC_SETS: { casual: [{ key: "daily" }, { key: "travel" }], business: [{ key: "work" }] },
    STATE: { history: [], transcript: [] }
  };
  const source = appSourceForTranscriptHarness;
  return vm.runInNewContext(source + ";({saveFreeTalkTranscript,loadFreeTalkTranscript,clearSavedFreeTalkTranscript,pushTranscript,pushHistory,rollbackFailedUserTurn,STATE})", context);
}

const transcriptApp = await readFile(new URL("../index.html", import.meta.url), "utf8");
const transcriptFunctionsStart = transcriptApp.indexOf("const FREETALK_TRANSCRIPT_STORAGE_KEY");
const transcriptFunctionsEnd = transcriptApp.indexOf("function getHistoryForGemini()", transcriptFunctionsStart);
assert.ok(transcriptFunctionsStart >= 0 && transcriptFunctionsEnd > transcriptFunctionsStart, "transcript functions exist in app source");
const appSourceForTranscriptHarness = transcriptApp.slice(transcriptFunctionsStart, transcriptFunctionsEnd);

test("Free Talk transcript persists all turns while AI history is capped at ten", () => {
  const h = createTranscriptHarness();
  for (let i = 0; i < 12; i++) h.pushHistory(i % 2 ? "assistant" : "user", "turn " + i);
  assert.equal(h.STATE.history.length, 10);
  assert.equal(h.STATE.transcript.length, 12);
  const restored = h.loadFreeTalkTranscript();
  assert.equal(restored.length, 12);
  assert.equal(restored[0].content, "turn 0");
  assert.equal(restored[11].content, "turn 11");
});

test("Free Talk transcript restore rejects corrupt, incompatible, and empty records", () => {
  for (const stored of ["{broken", JSON.stringify({ version: 2, mode: "casual", turns: [{ role: "user", content: "hello" }] }), JSON.stringify({ version: 1, mode: "business", turns: [{ role: "user", content: "hello" }] }), JSON.stringify({ version: 1, mode: "casual", turns: [] })]) {
    assert.equal(createTranscriptHarness({ stored }).loadFreeTalkTranscript(), null);
  }
});

test("Free Talk transcript restore filters invalid turns and restores only a known topic", () => {
  const stored = JSON.stringify({ version: 1, mode: "casual", topic: "travel", turns: [
    { role: "user", content: "  " }, { role: "system", content: "ignore" },
    { role: "assistant", content: "Let's travel." }, { role: "user", content: 42 }
  ] });
  const h = createTranscriptHarness({ stored });
  const turns = h.loadFreeTalkTranscript();
  assert.equal(turns.length, 1);
  assert.equal(turns[0].content, "Let's travel.");
});

test("Free Talk transcript storage failures do not crash chat operations", () => {
  const h = createTranscriptHarness({ storageThrows: true });
  assert.equal(h.saveFreeTalkTranscript(), false);
  h.pushTranscript("user", "still in memory");
  assert.equal(h.STATE.transcript.length, 1);
  assert.equal(h.loadFreeTalkTranscript(), null);
  assert.doesNotThrow(() => h.clearSavedFreeTalkTranscript());
});

test("failed Free Talk turn rolls back its exact transcript entry without removing earlier duplicate text", () => {
  const h = createTranscriptHarness();
  h.pushHistory("user", "same text");
  const pending = h.pushHistory("user", "same text");
  h.rollbackFailedUserTurn(pending);
  assert.equal(h.STATE.history.length, 1);
  assert.equal(h.STATE.transcript.length, 1);
  assert.equal(h.STATE.transcript[0].content, "same text");
  const persisted = h.loadFreeTalkTranscript();
  assert.equal(persisted.length, 1);
  assert.equal(persisted[0].content, "same text");
});
