import {
  createHtmlMetric
} from "../lib/metric.js";

export default function handler(
  request,
  response
) {
  response.setHeader(
    "Content-Type",
    "text/html; charset=utf-8"
  );

  response.setHeader(
    "Cache-Control",
    "no-store, max-age=0"
  );

  response
    .status(200)
    .send(createHtmlMetric());
}
