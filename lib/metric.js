export const START_VALUE = 1000;
export const INTERVAL_MS = 2000;

export function getMetricValue(
  now = Date.now()
) {
  return (
    START_VALUE +
    Math.floor(now / INTERVAL_MS)
  );
}

export function createJsonMetric(
  now = Date.now()
) {
  return {
    value: getMetricValue(now),
    updatedAt: new Date(now).toISOString()
  };
}

export function createHtmlMetric(
  now = Date.now()
) {
  const value = getMetricValue(now);

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>StarUp HTML target</title>
</head>

<body>
  <span
    id="metric-value"
    data-metric="value"
  >${value}</span>
</body>
</html>`;
}
