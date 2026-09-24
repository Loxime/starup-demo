import assert from "node:assert/strict";
import {
  existsSync,
  readFileSync
} from "node:fs";

const required = [
  "site/index.html",
  "site/app.js",
  "site/core.js",
  "site/styles.css",
  "site/assets/starup-icon.png"
];

for (const file of required) {
  assert.ok(
    existsSync(file),
    `Fichier manquant: ${file}`
  );
}

const html =
  readFileSync(
    "site/index.html",
    "utf8"
  );

assert.match(
  html,
  /src="\.\/app\.js"/
);

assert.match(
  html,
  /href="\.\/styles\.css"/
);

assert.match(
  html,
  /starup-icon\.png/
);

console.log(
  "Static site checks passed."
);
