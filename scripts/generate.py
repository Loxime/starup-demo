from datetime import datetime, timezone
from pathlib import Path
import json
import time

BASE_VALUE = 1000
INTERVAL_SECONDS = 300

BASE_DATE = datetime(
    2026,
    9,
    24,
    tzinfo=timezone.utc
)

BASE_TIMESTAMP = int(
    BASE_DATE.timestamp()
)

now = int(time.time())

elapsed = max(
    0,
    now - BASE_TIMESTAMP
)

value = (
    BASE_VALUE
    + elapsed // INTERVAL_SECONDS
)

generated_at = datetime.now(
    timezone.utc
).isoformat()

Path("site/html").mkdir(
    parents=True,
    exist_ok=True
)

Path("site/json").mkdir(
    parents=True,
    exist_ok=True
)

Path(
    "site/json/value.json"
).write_text(
    json.dumps(
        {
            "value": value,
            "generatedAt": generated_at
        },
        indent=2
    ) + "\n",
    encoding="utf-8"
)

Path(
    "site/html/index.html"
).write_text(
    f'''<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>StarUp HTML Target</title>
</head>

<body>
  <span id="metric-value">{value}</span>
</body>
</html>
''',
    encoding="utf-8"
)

print(
    f"Generated metric value: {value}"
)
