import fs from "node:fs";
import path from "node:path";

/**
 * Append-only JSON store of commercial-signal snapshots, keyed by flight
 * identity. Writes are atomic (temp file + rename) to avoid a corrupt file
 * if the process is killed mid-write.
 */
export function createSnapshotStore(filePath) {
  function load() {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(raw);
      return data && typeof data === "object" && !Array.isArray(data)
        ? data
        : {};
    } catch {
      return {};
    }
  }

  function persist(data) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
    fs.renameSync(tmp, filePath);
  }

  function appendSnapshot(key, entry, { maxHistory = 500 } = {}) {
    const data = load();
    const history = Array.isArray(data[key]) ? data[key] : [];
    history.push(entry);
    if (history.length > maxHistory)
      history.splice(0, history.length - maxHistory);
    data[key] = history;
    persist(data);
    return history;
  }

  function getHistory(key) {
    const data = load();
    return Array.isArray(data[key]) ? data[key] : [];
  }

  return { appendSnapshot, getHistory };
}
