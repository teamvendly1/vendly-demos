const fs = require("fs");
const path = process.argv[2];
const text = fs.readFileSync(path, "utf8");

const re = /Apple([^\x00-\x7F]+)s /g;
const m = re.exec(text);
let blob = m[1];
console.log("blob length:", blob.length);

function decodeOnce(s) {
  return Buffer.from(s, "latin1").toString("utf8");
}

let cur = blob;
for (let i = 0; i < 20; i++) {
  const next = decodeOnce(cur);
  console.log("pass", i, "len", next.length, JSON.stringify(next.slice(0, 20)));
  if (next === cur) { console.log("stable, stopping"); break; }
  cur = next;
}
console.log("FINAL:", JSON.stringify(cur), "codepoints:", [...cur].map(c => c.codePointAt(0).toString(16)));
