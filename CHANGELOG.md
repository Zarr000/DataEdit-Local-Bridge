# Changelog

## 0.3.0

- Added a non-blocking GitHub version check when `dataedit start` launches.
- Added `dataedit update` to reinstall the latest `main` branch from the official repository.
- Update checks fail silently when GitHub is unreachable so Local Bridge can still start.
- CLI and `/health` read the installed version from `package.json`.
- Added automated semantic-version comparison tests.
