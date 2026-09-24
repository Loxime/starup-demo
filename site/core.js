export function parseNumericValue(input) {
  const normalized = String(input)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, "")
    .replace(",", ".");

  const match = normalized.match(
    /-?\d+(?:\.\d+)?/
  );

  if (!match) {
    throw new Error(
      `Aucune valeur numérique trouvée dans "${input}"`
    );
  }

  const value = Number(match[0]);

  if (!Number.isFinite(value)) {
    throw new Error(
      `Valeur numérique invalide "${match[0]}"`
    );
  }

  return value;
}

export function readJsonPath(data, path) {
  const parts = path
    .split(".")
    .filter(Boolean);

  let current = data;

  for (const part of parts) {
    if (
      typeof current !== "object" ||
      current === null ||
      !(part in current)
    ) {
      throw new Error(
        `Chemin JSON "${path}" introuvable`
      );
    }

    current = current[part];
  }

  return current;
}

export function createJsonPayload(value) {
  return {
    stats: {
      value
    },
    updatedAt: new Date().toISOString()
  };
}

export function createHtmlPayload(value) {
  return `
    <article class="metric-card">
      <span class="metric-label">
        Likes
      </span>

      <strong
        class="metric-value"
        data-metric="likes"
      >${value}</strong>
    </article>
  `.trim();
}

export function extractJsonValue(
  payload,
  jsonPath
) {
  const raw = readJsonPath(
    payload,
    jsonPath
  );

  return parseNumericValue(
    String(raw)
  );
}

export function extractHtmlValue(
  html,
  selector,
  parseDocument
) {
  const document = parseDocument
    ? parseDocument(html)
    : new DOMParser().parseFromString(
        html,
        "text/html"
      );

  const element =
    document.querySelector(selector);

  if (!element) {
    throw new Error(
      `Sélecteur CSS "${selector}" introuvable`
    );
  }

  return parseNumericValue(
    element.textContent ?? ""
  );
}

export function extractMonitorValue(
  monitor,
  sourceValue,
  parseDocument
) {
  if (monitor.sourceType === "json") {
    const payload =
      createJsonPayload(sourceValue);

    return {
      value: extractJsonValue(
        payload,
        monitor.jsonPath
      ),
      payload
    };
  }

  const payload =
    createHtmlPayload(sourceValue);

  return {
    value: extractHtmlValue(
      payload,
      monitor.selector,
      parseDocument
    ),
    payload
  };
}
