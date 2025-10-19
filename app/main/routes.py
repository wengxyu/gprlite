from flask import render_template, current_app
from . import bp


@bp.route("/")
def index():
    cfg = current_app.config
    return render_template(
        "index.html",
        defaults={
            "width_m": cfg["GPR_WIDTH_M"],
            "max_depth_m": cfg["GPR_MAX_DEPTH_M"],
            "traces": cfg["GPR_TRACES"],
            "samples": cfg["GPR_SAMPLES"],
            "epsilon_r": cfg["GPR_EPSILON_R"],
            "wavelength_m": cfg["GPR_WAVELENGTH_M"],
        },
    )

