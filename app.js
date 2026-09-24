let currentValue = 1000;
let shape = "smooth";

const values = Array.from(
  { length: 24 },
  (_, index) => 976 + index
);

const current =
  document.querySelector("#current-value");

const delta =
  document.querySelector("#delta");

const samples =
  document.querySelector("#samples");

const line =
  document.querySelector("#line");

const grid =
  document.querySelector("#grid");

const lastCheck =
  document.querySelector("#last-check");

function drawGrid() {
  const lines = [];

  for (let y = 40; y <= 320; y += 70) {
    lines.push(
      `<line
        x1="0"
        x2="1000"
        y1="${y}"
        y2="${y}"
        stroke="#263143"
        stroke-dasharray="5 5"
      />`
    );
  }

  grid.innerHTML = lines.join("");
}

function pointsForValues() {
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;

  return values.map((value, index) => {
    const x =
      (index / (values.length - 1)) * 1000;

    const y =
      320 -
      ((value - min) / (max - min)) * 260;

    return {
      x,
      y
    };
  });
}

function drawChart() {
  const points = pointsForValues();

  if (shape === "step") {
    const result = [];

    points.forEach((point, index) => {
      if (index === 0) {
        result.push(`${point.x},${point.y}`);
        return;
      }

      const previous = points[index - 1];

      result.push(
        `${point.x},${previous.y}`,
        `${point.x},${point.y}`
      );
    });

    line.setAttribute(
      "points",
      result.join(" ")
    );

    return;
  }

  line.setAttribute(
    "points",
    points
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ")
  );

  line.setAttribute(
    "stroke-linejoin",
    shape === "straight"
      ? "miter"
      : "round"
  );
}

function update() {
  const previous = currentValue;

  currentValue +=
    Math.random() > 0.18
      ? Math.ceil(Math.random() * 3)
      : 0;

  values.push(currentValue);
  values.shift();

  const change =
    currentValue - previous;

  current.textContent =
    currentValue.toLocaleString("fr-FR");

  delta.textContent =
    change >= 0
      ? `+${change}`
      : String(change);

  samples.textContent =
    Number(samples.textContent) + 1;

  lastCheck.textContent =
    `Dernier check : ${
      new Date().toLocaleTimeString("fr-FR")
    }`;

  drawChart();
}

document
  .querySelector("#check-button")
  .addEventListener("click", update);

document
  .querySelectorAll("#shapes button")
  .forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll("#shapes button")
        .forEach((item) =>
          item.classList.remove("active")
        );

      button.classList.add("active");

      shape = button.dataset.shape;
      drawChart();
    });
  });

drawGrid();
drawChart();

setInterval(update, 2000);
