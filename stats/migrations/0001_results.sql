CREATE TABLE IF NOT EXISTS personality_results (
 id INTEGER PRIMARY KEY,
 device_key TEXT NOT NULL UNIQUE CHECK(length(device_key)=64),
 result_code TEXT NOT NULL CHECK(result_code IN ('DND','ECO','LAN','BG','SOLO','MUTE','TIMER','DRAFT','TBD','LOADING','ROAM','READ','HOTSPOT','SYNC','INSTANT','POWER','LIVE','CLOSER')),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
