import {
  createJsonMetric
} from "../lib/metric.js";

export default function handler(
  request,
  response
) {
  response.setHeader(
    "Cache-Control",
    "no-store, max-age=0"
  );

  response
    .status(200)
    .json(createJsonMetric());
}
