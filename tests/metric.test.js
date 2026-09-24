import assert from "node:assert/strict";
import test from "node:test";

import {
  START_VALUE,
  createHtmlMetric,
  createJsonMetric,
  getMetricValue
} from "../lib/metric.js";

test(
  "la valeur augmente toutes les 2 secondes",
  () => {
    const first =
      getMetricValue(0);

    const second =
      getMetricValue(2000);

    const third =
      getMetricValue(4000);

    assert.equal(
      first,
      START_VALUE
    );

    assert.equal(
      second,
      START_VALUE + 1
    );

    assert.equal(
      third,
      START_VALUE + 2
    );
  }
);

test(
  "le JSON expose value",
  () => {
    const payload =
      createJsonMetric(4000);

    assert.equal(
      payload.value,
      START_VALUE + 2
    );

    assert.equal(
      typeof payload.updatedAt,
      "string"
    );
  }
);

test(
  "le HTML expose #metric-value",
  () => {
    const html =
      createHtmlMetric(4000);

    assert.match(
      html,
      /id="metric-value"/
    );

    assert.match(
      html,
      new RegExp(
        `>${START_VALUE + 2}<`
      )
    );
  }
);
