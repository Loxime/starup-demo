import assert from "node:assert/strict";
import test from "node:test";

import {
  parseHTML
} from "linkedom";

import {
  createHtmlPayload,
  createJsonPayload,
  extractHtmlValue,
  extractJsonValue,
  extractMonitorValue,
  parseNumericValue,
  readJsonPath
} from "../site/core.js";

const parseDocument = (html) =>
  parseHTML(html).document;

test(
  "parse un entier",
  () => {
    assert.equal(
      parseNumericValue("1234"),
      1234
    );
  }
);

test(
  "parse espaces et NBSP",
  () => {
    assert.equal(
      parseNumericValue(
        "1\u00a0234"
      ),
      1234
    );
  }
);

test(
  "parse une virgule décimale",
  () => {
    assert.equal(
      parseNumericValue("12,5"),
      12.5
    );
  }
);

test(
  "parse une valeur négative",
  () => {
    assert.equal(
      parseNumericValue("-42"),
      -42
    );
  }
);

test(
  "refuse une chaîne sans nombre",
  () => {
    assert.throws(
      () =>
        parseNumericValue(
          "aucune valeur"
        )
    );
  }
);

test(
  "lit un JSON path imbriqué",
  () => {
    assert.equal(
      readJsonPath(
        {
          stats: {
            value: 321
          }
        },
        "stats.value"
      ),
      321
    );
  }
);

test(
  "signale un JSON path manquant",
  () => {
    assert.throws(
      () =>
        readJsonPath(
          {
            stats: {}
          },
          "stats.value"
        ),
      /introuvable/
    );
  }
);

test(
  "extrait une valeur JSON",
  () => {
    const payload =
      createJsonPayload(456);

    assert.equal(
      extractJsonValue(
        payload,
        "stats.value"
      ),
      456
    );
  }
);

test(
  "extrait une valeur HTML par classe",
  () => {
    const payload =
      createHtmlPayload(789);

    assert.equal(
      extractHtmlValue(
        payload,
        ".metric-value",
        parseDocument
      ),
      789
    );
  }
);

test(
  "extrait une valeur HTML par attribut",
  () => {
    const payload =
      createHtmlPayload(987);

    assert.equal(
      extractHtmlValue(
        payload,
        '[data-metric="likes"]',
        parseDocument
      ),
      987
    );
  }
);

test(
  "signale un sélecteur HTML manquant",
  () => {
    assert.throws(
      () =>
        extractHtmlValue(
          createHtmlPayload(10),
          ".inexistant",
          parseDocument
        ),
      /introuvable/
    );
  }
);

test(
  "monitor JSON complet",
  () => {
    const result =
      extractMonitorValue(
        {
          sourceType: "json",
          jsonPath: "stats.value"
        },
        1500,
        parseDocument
      );

    assert.equal(
      result.value,
      1500
    );
  }
);

test(
  "monitor HTML complet",
  () => {
    const result =
      extractMonitorValue(
        {
          sourceType: "html",
          selector: ".metric-value"
        },
        2500,
        parseDocument
      );

    assert.equal(
      result.value,
      2500
    );
  }
);
