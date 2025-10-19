# GPR Lite — Educational Ground Penetrating Radar Simulator

GPR Lite is a small Flask web app that teaches the basics of Ground Penetrating Radar (GPR) using an interactive 2D simulator. Place up to three underground objects, tweak parameters, and see how the B-scan changes. Click on the apex of a hyperbola to see the depth/time math.

## Features

- 2D placement canvas to position 1–3 objects underground
- Adjustable parameters: scan width, max depth, traces, samples, relative permittivity (εr), wavelength
- B-scan rendering that visualizes hyperbolas from subsurface reflectors
- Educational popups explaining every parameter and what a B-scan is
- Apex click: shows exact calculation for depth and two‑way time
- Object shape and size: point or square with configurable size
- Clean Flask architecture: blueprints, application factory, REST API, SQLAlchemy models, error handlers

## Quick Start

Prerequisites:

- Python 3.10+ recommended

Setup (Windows PowerShell shown; similar for macOS/Linux):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Option A: run via Flask CLI
set FLASK_APP=wsgi
flask run

# Option B: run directly
python wsgi.py
```

Open http://127.0.0.1:5000 in your browser.

## How To Use

- Click in the left canvas to add objects; drag to move them. Max three.
- Below the inputs, click the “What is …?” help buttons to learn what each parameter does.
- Choose object shape (Point/Square) and size (meters) when an object is selected.
- Click “Run Simulation” to update the B‑scan with your changes.
- In the B‑scan, click near a hyperbola apex to see the math: εr, velocity v = c/√εr (c ≈ 0.3 m/ns), apex depth z₀, and two‑way time T = 2·z₀/v.

## Concepts

- B‑scan: A 2D image made of many adjacent A‑scans. The X‑axis is antenna position (traces); Y‑axis is depth (or time). Point‑like reflectors appear as hyperbolas; the apex aligns with the object’s lateral position and depth.
- εr and velocity: v = c/√εr. Larger εr slows waves, increasing two‑way travel time for the same depth.
- Wavelength: Shorter wavelengths sharpen returns; longer wavelengths blur them. The simulator uses wavelength to control hyperbola thickness.
- Object size/shape: Extended objects (e.g., squares) broaden and strengthen the return versus point reflectors.

## Project Structure

```
app/
  api/                # REST endpoints (Flask‑RESTful)
  errors/             # Error handlers and templates
  main/               # UI routes blueprint
  static/             # JS/CSS
  templates/          # Jinja2 templates
  __init__.py         # Application factory
  config.py           # Environment‑based config
  extensions.py       # db, migrate
  models.py           # SQLAlchemy models
wsgi.py               # Entrypoint for dev and WSGI servers
requirements.txt      # Python dependencies
```

## Configuration

Environment variables (all optional; sensible defaults exist):

- `SECRET_KEY` — Flask secret key
- `DATABASE_URL` — SQLAlchemy database URI (defaults to SQLite file `gprlite.db`)
- `GPR_WIDTH_M` — default scan width in meters (default 10.0)
- `GPR_MAX_DEPTH_M` — maximum depth in meters (default 5.0)
- `GPR_TRACES` — number of lateral samples/columns (default 200)
- `GPR_SAMPLES` — number of depth samples/rows (default 150)
- `GPR_EPSILON_R` — relative permittivity (default 9.0)
- `GPR_WAVELENGTH_M` — wavelength in meters (default 0.3)

Set in PowerShell (example):

```powershell
$env:GPR_EPSILON_R = 12.0
$env:GPR_WAVELENGTH_M = 0.25
flask run
```

## REST API

Endpoint: `POST /api/simulate`

Request JSON:

```json
{
  "width_m": 10.0,
  "max_depth_m": 5.0,
  "traces": 200,
  "samples": 150,
  "epsilon_r": 9.0,
  "wavelength_m": 0.30,
  "objects": [
    { "x": 3.0, "z": 1.2, "shape": "point" },
    { "x": 6.5, "z": 2.0, "shape": "square", "size_m": 0.6 }
  ]
}
```

Response JSON (excerpt):

```json
{
  "matrix": [[...]],
  "x_axis": [...],
  "z_axis": [...],
  "epsilon_r": 9.0,
  "velocity_m_per_ns": 0.1,
  "wavelength_m": 0.3,
  "objects": [ ... ]
}
```

The client renders `matrix` to the B‑scan canvas and draws helper overlays marking object positions and apex depths.

## Development Notes

- Uses Blueprints, Flask‑SQLAlchemy, Flask‑Migrate, and Flask‑RESTful (see `AGENTS.md`).
- The database and models (`Scenario`, `Target`) are scaffolded for extension; the simulator does not require DB to run.
- To enable migrations:

```powershell
flask --app wsgi db init
flask --app wsgi db migrate -m "init"
flask --app wsgi db upgrade
```

## Disclaimer

This is an educational visualization, not a field‑grade GPR processing tool. It simplifies physics and omits antenna patterns, dispersion, noise, deconvolution, and many other real‑world effects.

