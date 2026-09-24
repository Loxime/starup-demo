from pathlib import Path
import json
import re

json_data = json.loads(
    Path(
        "site/json/value.json"
    ).read_text(
        encoding="utf-8"
    )
)

html = Path(
    "site/html/index.html"
).read_text(
    encoding="utf-8"
)

match = re.search(
    r'id="metric-value">(\d+)<',
    html
)

if not match:
    raise SystemExit(
        "HTML metric not found"
    )

html_value = int(
    match.group(1)
)

json_value = json_data["value"]

if html_value != json_value:
    raise SystemExit(
        "HTML and JSON values differ"
    )

if not Path(
    "site/assets/starup-icon.png"
).exists():
    raise SystemExit(
        "Logo missing"
    )

print(
    f"HTML value: {html_value}"
)

print(
    f"JSON value: {json_value}"
)

print(
    "All checks passed."
)
