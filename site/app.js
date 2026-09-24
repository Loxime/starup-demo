import {
  createHtmlPayload,
  createJsonPayload,
  extractMonitorValue
} from "./core.js";

const STORAGE_KEY =
  "starup-demo-monitors-v2";

const PREFS_KEY =
  "starup-demo-prefs-v2";

let modalOpen = false;
let editingId = null;

const preferences = loadPreferences();

let monitors = loadMonitors();

if (monitors.length === 0) {
  monitors = createDefaultMonitors();
  saveMonitors();
}

let selectedId =
  preferences.selectedId &&
  monitors.some(
    (monitor) =>
      monitor.id === preferences.selectedId
  )
    ? preferences.selectedId
    : monitors[0]?.id ?? null;

let chartShape =
  preferences.chartShape ?? "smooth";

function id() {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now()}-${Math.random()}`;
}

function createDefaultMonitors() {
  const now = Date.now();

  return [
    {
      id: id(),
      name: "Démo JSON",
      sourceType: "json",
      jsonPath: "stats.value",
      selector: null,
      sourceValue: 1000,
      increment: 2,
      intervalSeconds: 2,
      enabled: true,
      status: "pending",
      lastError: null,
      lastCheckedAt: null,
      nextPollAt: now,
      measurements: []
    },
    {
      id: id(),
      name: "Démo HTML",
      sourceType: "html",
      selector: ".metric-value",
      jsonPath: null,
      sourceValue: 500,
      increment: 1,
      intervalSeconds: 3,
      enabled: true,
      status: "pending",
      lastError: null,
      lastCheckedAt: null,
      nextPollAt: now,
      measurements: []
    }
  ];
}

function loadMonitors() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY);

    return raw
      ? JSON.parse(raw)
      : [];
  } catch {
    return [];
  }
}

function loadPreferences() {
  try {
    return JSON.parse(
      localStorage.getItem(PREFS_KEY)
        ?? "{}"
    );
  } catch {
    return {};
  }
}

function saveMonitors() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(monitors)
  );
}

function savePreferences() {
  localStorage.setItem(
    PREFS_KEY,
    JSON.stringify({
      selectedId,
      chartShape
    })
  );
}

function selectedMonitor() {
  return monitors.find(
    (monitor) =>
      monitor.id === selectedId
  ) ?? null;
}

function statusLabel(monitor) {
  if (!monitor.enabled) {
    return "En pause";
  }

  if (monitor.status === "healthy") {
    return "Opérationnel";
  }

  if (monitor.status === "error") {
    return "Erreur";
  }

  return "En attente";
}

function pollMonitor(monitor) {
  try {
    const result =
      extractMonitorValue(
        monitor,
        monitor.sourceValue
      );

    monitor.measurements.push({
      value: result.value,
      measuredAt:
        new Date().toISOString()
    });

    monitor.measurements =
      monitor.measurements.slice(-100);

    monitor.status = "healthy";
    monitor.lastError = null;
    monitor.lastCheckedAt =
      new Date().toISOString();

    monitor.sourceValue +=
      monitor.increment;
  } catch (error) {
    monitor.status = "error";

    monitor.lastError =
      error instanceof Error
        ? error.message
        : String(error);

    monitor.lastCheckedAt =
      new Date().toISOString();
  }

  monitor.nextPollAt =
    Date.now() +
    monitor.intervalSeconds * 1000;

  saveMonitors();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatNumber(value) {
  return value === null ||
    value === undefined
    ? "—"
    : Number(value).toLocaleString(
        "fr-FR"
      );
}

function buildChart(monitor) {
  const measurements =
    monitor.measurements;

  if (measurements.length === 0) {
    return `
      <div class="no-data">
        Aucune mesure pour le moment.
      </div>
    `;
  }

  const width = 1000;
  const height = 340;
  const top = 30;
  const bottom = 310;

  const values =
    measurements.map(
      (measurement) =>
        measurement.value
    );

  let min =
    Math.min(...values);

  let max =
    Math.max(...values);

  if (min === max) {
    min -= 1;
    max += 1;
  }

  const points =
    measurements.map(
      (measurement, index) => {
        const x =
          measurements.length === 1
            ? width / 2
            : (
                index /
                (
                  measurements.length - 1
                )
              ) * width;

        const y =
          bottom -
          (
            (
              measurement.value -
              min
            ) /
            (max - min)
          ) *
          (bottom - top);

        return {
          x,
          y
        };
      }
    );

  const grid = [70, 130, 190, 250, 310]
    .map(
      (y) => `
        <line
          x1="0"
          x2="${width}"
          y1="${y}"
          y2="${y}"
          stroke="#263143"
          stroke-dasharray="5 5"
        />
      `
    )
    .join("");

  let series = "";

  if (chartShape === "bar") {
    const barWidth =
      Math.max(
        5,
        Math.min(
          30,
          width /
          Math.max(points.length, 1) *
          0.55
        )
      );

    series = points
      .map(
        (point) => `
          <rect
            x="${point.x - barWidth / 2}"
            y="${point.y}"
            width="${barWidth}"
            height="${bottom - point.y}"
            rx="4"
            fill="#f97316"
          />
        `
      )
      .join("");
  } else if (
    chartShape === "step"
  ) {
    const stepPoints = [];

    points.forEach(
      (point, index) => {
        if (index === 0) {
          stepPoints.push(
            `${point.x},${point.y}`
          );

          return;
        }

        const previous =
          points[index - 1];

        stepPoints.push(
          `${point.x},${previous.y}`,
          `${point.x},${point.y}`
        );
      }
    );

    series = `
      <polyline
        points="${stepPoints.join(" ")}"
        fill="none"
        stroke="#f97316"
        stroke-width="4"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    `;
  } else if (
    chartShape === "area"
  ) {
    const polyline =
      points
        .map(
          (point) =>
            `${point.x},${point.y}`
        )
        .join(" ");

    const area =
      `0,${bottom} ${polyline} ` +
      `${width},${bottom}`;

    series = `
      <polygon
        points="${area}"
        fill="rgba(249,115,22,.14)"
      />

      <polyline
        points="${polyline}"
        fill="none"
        stroke="#f97316"
        stroke-width="4"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    `;
  } else if (
    chartShape === "smooth" &&
    points.length >= 3
  ) {
    let path =
      `M ${points[0].x} ${points[0].y}`;

    for (
      let index = 1;
      index < points.length - 1;
      index += 1
    ) {
      const current =
        points[index];

      const next =
        points[index + 1];

      const midX =
        (current.x + next.x) / 2;

      const midY =
        (current.y + next.y) / 2;

      path +=
        ` Q ${current.x} ${current.y}` +
        ` ${midX} ${midY}`;
    }

    const last =
      points[points.length - 1];

    path +=
      ` T ${last.x} ${last.y}`;

    series = `
      <path
        d="${path}"
        fill="none"
        stroke="#f97316"
        stroke-width="4"
        stroke-linecap="round"
      />
    `;
  } else {
    const polyline =
      points
        .map(
          (point) =>
            `${point.x},${point.y}`
        )
        .join(" ");

    series = `
      <polyline
        points="${polyline}"
        fill="none"
        stroke="#f97316"
        stroke-width="4"
        stroke-linejoin="${
          chartShape === "straight"
            ? "miter"
            : "round"
        }"
        stroke-linecap="round"
      />
    `;
  }

  return `
    <svg
      class="chart"
      viewBox="0 0 ${width} ${height}"
      preserveAspectRatio="none"
    >
      ${grid}
      ${series}
    </svg>
  `;
}

function payloadPreview(monitor) {
  if (monitor.sourceType === "json") {
    return JSON.stringify(
      createJsonPayload(
        monitor.sourceValue
      ),
      null,
      2
    );
  }

  return createHtmlPayload(
    monitor.sourceValue
  );
}

function render() {
  const app =
    document.querySelector("#app");

  const monitor =
    selectedMonitor();

  if (!monitor) {
    app.innerHTML = `
      ${renderHeader()}

      <main class="empty-page">
        <h2>Aucun monitor</h2>

        <p>
          Crée un monitor JSON ou HTML
          pour commencer.
        </p>

        <button
          class="primary-button"
          data-action="add"
        >
          + Ajouter un monitor
        </button>
      </main>

      ${renderModal()}
    `;

    bindEvents();
    return;
  }

  const latest =
    monitor.measurements.at(-1)
    ?? null;

  const previous =
    monitor.measurements.at(-2)
    ?? null;

  const delta =
    latest && previous
      ? latest.value -
        previous.value
      : null;

  app.innerHTML = `
    ${renderHeader()}

    <main class="layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <strong>MONITORS</strong>
          <span>${monitors.length}</span>
        </div>

        <div class="monitor-list">
          ${monitors.map(
            (item) => `
              <button
                class="monitor-item ${
                  item.id === selectedId
                    ? "active"
                    : ""
                }"
                data-select="${item.id}"
              >
                <span class="monitor-top">
                  <i
                    class="status-dot ${
                      !item.enabled
                        ? "paused"
                        : item.status
                    }"
                  ></i>

                  <strong>
                    ${escapeHtml(item.name)}
                  </strong>
                </span>

                <small>
                  ${item.sourceType.toUpperCase()}
                  · ${item.intervalSeconds}s
                </small>
              </button>
            `
          ).join("")}
        </div>

        <button
          class="sidebar-add"
          data-action="add"
        >
          + Ajouter
        </button>
      </aside>

      <section class="content">
        <div class="monitor-toolbar">
          <div>
            <div class="monitor-title">
              <h2>
                ${escapeHtml(monitor.name)}
              </h2>

              <span
                class="status-badge ${
                  !monitor.enabled
                    ? "paused"
                    : monitor.status
                }"
              >
                ${statusLabel(monitor)}
              </span>
            </div>

            <p class="source-summary">
              Source simulée
              ${monitor.sourceType.toUpperCase()}
              · incrément
              ${monitor.increment >= 0
                ? "+"
                : ""
              }${monitor.increment}
            </p>

            <small>
              Dernier check :
              ${
                monitor.lastCheckedAt
                  ? new Date(
                      monitor.lastCheckedAt
                    ).toLocaleString(
                      "fr-FR"
                    )
                  : "jamais"
              }
            </small>
          </div>

          <div class="monitor-actions">
            <button
              class="primary-button"
              data-action="check"
            >
              Vérifier maintenant
            </button>

            <button
              class="secondary-button"
              data-action="toggle"
            >
              ${
                monitor.enabled
                  ? "Pause"
                  : "Reprendre"
              }
            </button>

            <button
              class="secondary-button"
              data-action="edit"
            >
              Modifier
            </button>

            <button
              class="danger-button"
              data-action="delete"
            >
              Supprimer
            </button>
          </div>
        </div>

        ${
          monitor.lastError
            ? `
              <div class="error-box">
                <strong>
                  Erreur d'extraction
                </strong>

                <span>
                  ${escapeHtml(
                    monitor.lastError
                  )}
                </span>
              </div>
            `
            : ""
        }

        <div class="chart-controls">
          <div class="selector">
            ${[
              ["smooth", "Lisse"],
              ["straight", "Droite"],
              ["step", "Escalier"],
              ["area", "Aire"],
              ["bar", "Barres"]
            ].map(
              ([shape, label]) => `
                <button
                  class="${
                    chartShape === shape
                      ? "active"
                      : ""
                  }"
                  data-shape="${shape}"
                >
                  ${label}
                </button>
              `
            ).join("")}
          </div>
        </div>

        <div class="cards">
          <article class="card featured">
            <span>Valeur actuelle</span>

            <strong>
              ${formatNumber(
                latest?.value
              )}
            </strong>
          </article>

          <article class="card">
            <span>
              Delta dernier check
            </span>

            <strong>
              ${
                delta === null
                  ? "—"
                  : delta >= 0
                    ? `+${formatNumber(delta)}`
                    : formatNumber(delta)
              }
            </strong>
          </article>

          <article class="card">
            <span>Mesures</span>

            <strong>
              ${monitor.measurements.length}
            </strong>
          </article>

          <article class="card">
            <span>Prochaine valeur source</span>

            <strong>
              ${formatNumber(
                monitor.sourceValue
              )}
            </strong>
          </article>
        </div>

        <article class="panel">
          <div class="panel-header">
            <div>
              <h3>Évolution</h3>

              <p>
                Les données sont simulées
                localement dans ton navigateur.
              </p>
            </div>
          </div>

          ${buildChart(monitor)}
        </article>

        <div class="source-grid">
          <article class="panel">
            <h3>
              Payload ${monitor.sourceType.toUpperCase()}
            </h3>

            <p>
              Valeur brute actuellement
              exposée par la source simulée.
            </p>

            <pre>${escapeHtml(
              payloadPreview(monitor)
            )}</pre>
          </article>

          <article class="panel">
            <h3>Extraction StarUp</h3>

            ${
              monitor.sourceType === "json"
                ? `
                  <div class="config-line">
                    <span>JSON Path</span>
                    <code>
                      ${escapeHtml(
                        monitor.jsonPath
                      )}
                    </code>
                  </div>
                `
                : `
                  <div class="config-line">
                    <span>Sélecteur CSS</span>
                    <code>
                      ${escapeHtml(
                        monitor.selector
                      )}
                    </code>
                  </div>
                `
            }

            <div class="config-line">
              <span>Intervalle</span>
              <code>
                ${monitor.intervalSeconds}s
              </code>
            </div>

            <div class="config-line">
              <span>Incrément</span>
              <code>
                ${monitor.increment}
              </code>
            </div>

            <p class="hint">
              Modifie volontairement le
              selector/path avec une valeur
              incorrecte pour tester l'état
              d'erreur.
            </p>
          </article>
        </div>
      </section>
    </main>

    ${renderModal()}
  `;

  bindEvents();
}

function renderHeader() {
  return `
    <header class="header">
      <div class="brand">
        <img
          src="./assets/starup-icon.png"
          alt=""
        >

        <div>
          <h1>StarUp</h1>
          <span>
            HTML + JSON Playground
          </span>
        </div>
      </div>

      <div class="header-actions">
        <span class="browser-note">
          Données privées dans
          ce navigateur
        </span>

        <button
          class="secondary-button"
          data-action="reset"
        >
          Réinitialiser
        </button>

        <button
          class="primary-button"
          data-action="add"
        >
          + Ajouter
        </button>
      </div>
    </header>
  `;
}

function renderModal() {
  if (!modalOpen) {
    return "";
  }

  const monitor =
    editingId
      ? monitors.find(
          (item) =>
            item.id === editingId
        )
      : null;

  const sourceType =
    monitor?.sourceType ?? "json";

  return `
    <div class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <div>
            <h2>
              ${
                monitor
                  ? "Modifier le monitor"
                  : "Nouveau monitor"
              }
            </h2>

            <p>
              Teste une extraction JSON
              ou HTML en direct.
            </p>
          </div>

          <button
            class="close-button"
            data-action="close-modal"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form id="monitor-form">
          <label>
            Nom

            <input
              name="name"
              required
              value="${escapeHtml(
                monitor?.name ?? ""
              )}"
              placeholder="Mon compteur"
            >
          </label>

          <label>
            Type de source

            <select
              name="sourceType"
              id="source-type"
            >
              <option
                value="json"
                ${
                  sourceType === "json"
                    ? "selected"
                    : ""
                }
              >
                JSON
              </option>

              <option
                value="html"
                ${
                  sourceType === "html"
                    ? "selected"
                    : ""
                }
              >
                HTML
              </option>
            </select>
          </label>

          <div class="form-grid">
            <label>
              Valeur de départ

              <input
                name="startValue"
                type="number"
                step="any"
                required
                value="${
                  monitor?.sourceValue
                  ?? 1000
                }"
              >
            </label>

            <label>
              Incrément

              <input
                name="increment"
                type="number"
                step="any"
                required
                value="${
                  monitor?.increment
                  ?? 1
                }"
              >
            </label>
          </div>

          <label>
            Intervalle de collecte (secondes)

            <input
              name="intervalSeconds"
              type="number"
              min="1"
              max="60"
              required
              value="${
                monitor?.intervalSeconds
                ?? 2
              }"
            >
          </label>

          <label
            id="json-path-field"
          >
            JSON Path

            <input
              name="jsonPath"
              value="${escapeHtml(
                monitor?.jsonPath
                ?? "stats.value"
              )}"
              placeholder="stats.value"
            >
          </label>

          <label
            id="selector-field"
          >
            Sélecteur CSS

            <input
              name="selector"
              value="${escapeHtml(
                monitor?.selector
                ?? ".metric-value"
              )}"
              placeholder=".metric-value"
            >
          </label>

          <div class="preset-row">
            <button
              type="button"
              class="secondary-button"
              data-preset="json"
            >
              Preset JSON
            </button>

            <button
              type="button"
              class="secondary-button"
              data-preset="html"
            >
              Preset HTML
            </button>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="secondary-button"
              data-action="close-modal"
            >
              Annuler
            </button>

            <button
              class="primary-button"
              type="submit"
            >
              ${
                monitor
                  ? "Enregistrer"
                  : "Créer"
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function updateSourceFields() {
  const type =
    document.querySelector(
      "#source-type"
    )?.value;

  const jsonField =
    document.querySelector(
      "#json-path-field"
    );

  const selectorField =
    document.querySelector(
      "#selector-field"
    );

  if (!jsonField || !selectorField) {
    return;
  }

  jsonField.hidden =
    type !== "json";

  selectorField.hidden =
    type !== "html";
}

function showModal(monitorId = null) {
  editingId = monitorId;
  modalOpen = true;
  render();
}

function closeModal() {
  modalOpen = false;
  editingId = null;
  render();
}

function submitMonitor(form) {
  const data =
    new FormData(form);

  const sourceType =
    String(
      data.get("sourceType")
    );

  const startValue =
    Number(
      data.get("startValue")
    );

  const increment =
    Number(
      data.get("increment")
    );

  const intervalSeconds =
    Math.max(
      1,
      Number(
        data.get("intervalSeconds")
      )
    );

  const existing =
    editingId
      ? monitors.find(
          (monitor) =>
            monitor.id === editingId
        )
      : null;

  if (existing) {
    existing.name =
      String(data.get("name")).trim();

    existing.sourceType =
      sourceType;

    existing.sourceValue =
      startValue;

    existing.increment =
      increment;

    existing.intervalSeconds =
      intervalSeconds;

    existing.jsonPath =
      sourceType === "json"
        ? String(
            data.get("jsonPath")
          ).trim()
        : null;

    existing.selector =
      sourceType === "html"
        ? String(
            data.get("selector")
          ).trim()
        : null;

    existing.status = "pending";
    existing.lastError = null;
    existing.nextPollAt =
      Date.now();
  } else {
    const monitor = {
      id: id(),
      name:
        String(
          data.get("name")
        ).trim(),
      sourceType,
      sourceValue: startValue,
      increment,
      intervalSeconds,
      jsonPath:
        sourceType === "json"
          ? String(
              data.get("jsonPath")
            ).trim()
          : null,
      selector:
        sourceType === "html"
          ? String(
              data.get("selector")
            ).trim()
          : null,
      enabled: true,
      status: "pending",
      lastError: null,
      lastCheckedAt: null,
      nextPollAt: Date.now(),
      measurements: []
    };

    monitors.push(monitor);
    selectedId = monitor.id;
  }

  saveMonitors();
  savePreferences();

  modalOpen = false;
  editingId = null;

  render();
}

function bindEvents() {
  document
    .querySelectorAll("[data-select]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          selectedId =
            button.dataset.select;

          savePreferences();
          render();
        }
      );
    });

  document
    .querySelectorAll("[data-shape]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          chartShape =
            button.dataset.shape;

          savePreferences();
          render();
        }
      );
    });

  document
    .querySelectorAll("[data-action]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const action =
            button.dataset.action;

          const monitor =
            selectedMonitor();

          if (action === "add") {
            showModal();
          }

          if (action === "edit") {
            showModal(monitor?.id);
          }

          if (action === "close-modal") {
            closeModal();
          }

          if (
            action === "check" &&
            monitor
          ) {
            pollMonitor(monitor);
            render();
          }

          if (
            action === "toggle" &&
            monitor
          ) {
            monitor.enabled =
              !monitor.enabled;

            monitor.nextPollAt =
              Date.now();

            saveMonitors();
            render();
          }

          if (
            action === "delete" &&
            monitor
          ) {
            const confirmed =
              window.confirm(
                `Supprimer "${monitor.name}" ?`
              );

            if (!confirmed) {
              return;
            }

            monitors =
              monitors.filter(
                (item) =>
                  item.id !==
                  monitor.id
              );

            selectedId =
              monitors[0]?.id
              ?? null;

            saveMonitors();
            savePreferences();
            render();
          }

          if (action === "reset") {
            const confirmed =
              window.confirm(
                "Réinitialiser toute la démo ?"
              );

            if (!confirmed) {
              return;
            }

            monitors =
              createDefaultMonitors();

            selectedId =
              monitors[0].id;

            chartShape = "smooth";

            saveMonitors();
            savePreferences();
            render();
          }
        }
      );
    });

  const form =
    document.querySelector(
      "#monitor-form"
    );

  if (form) {
    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        submitMonitor(form);
      }
    );

    document
      .querySelector(
        "#source-type"
      )
      ?.addEventListener(
        "change",
        updateSourceFields
      );

    document
      .querySelectorAll(
        "[data-preset]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const type =
              button.dataset.preset;

            const source =
              form.elements
                .sourceType;

            source.value = type;

            if (type === "json") {
              form.elements.name.value =
                "Test JSON";

              form.elements.jsonPath.value =
                "stats.value";
            } else {
              form.elements.name.value =
                "Test HTML";

              form.elements.selector.value =
                ".metric-value";
            }

            updateSourceFields();
          }
        );
      });

    updateSourceFields();
  }
}

setInterval(() => {
  const now = Date.now();
  let changed = false;

  for (const monitor of monitors) {
    if (
      monitor.enabled &&
      now >= monitor.nextPollAt
    ) {
      pollMonitor(monitor);
      changed = true;
    }
  }

  if (
    changed &&
    !modalOpen
  ) {
    render();
  }
}, 500);

render();
