from math import sqrt, exp
from flask import current_app, request
from flask_restful import Resource


def compute_velocity(epsilon_r: float) -> float:
    # Speed of light ~ 0.3 m/ns in vacuum
    c = 0.3
    return c / (epsilon_r ** 0.5)


class SimulationResource(Resource):
    def post(self):
        payload = request.get_json(force=True) or {}

        width_m = float(payload.get("width_m", current_app.config["GPR_WIDTH_M"]))
        max_depth_m = float(payload.get("max_depth_m", current_app.config["GPR_MAX_DEPTH_M"]))
        traces = int(payload.get("traces", current_app.config["GPR_TRACES"]))
        samples = int(payload.get("samples", current_app.config["GPR_SAMPLES"]))
        epsilon_r = float(payload.get("epsilon_r", current_app.config["GPR_EPSILON_R"]))
        wavelength_m = float(payload.get("wavelength_m", current_app.config["GPR_WAVELENGTH_M"]))
        targets = payload.get("objects", [])[:3]

        # Ensure targets are valid
        clean_targets = []
        for t in targets:
            try:
                x = max(0.0, min(width_m, float(t.get("x", 0.0))))
                z = max(0.0, min(max_depth_m, float(t.get("z", 0.0))))
                shape = str(t.get("shape", "point")).lower()
                if shape not in ("point", "square"):
                    shape = "point"
                size_m = float(t.get("size_m", 0.0))
                size_m = max(0.0, min(width_m/3.0, size_m))
                clean_targets.append({"x": x, "z": z, "shape": shape, "size_m": size_m})
            except Exception:
                continue

        # Physical axes
        xs = [i * width_m / max(1, traces - 1) for i in range(traces)]
        zs = [j * max_depth_m / max(1, samples - 1) for j in range(samples)]

        # Thickness/blur around the hyperbola surface (meters)
        sigma = max(0.02, wavelength_m / 4.0)

        # Build intensity matrix (samples x traces)
        matrix = [[0.0 for _ in range(traces)] for _ in range(samples)]

        for j, z in enumerate(zs):
            for i, x in enumerate(xs):
                val = 0.0
                for tgt in clean_targets:
                    x0 = tgt["x"]
                    z0 = tgt["z"]
                    shape = tgt.get("shape", "point")
                    size_m = float(tgt.get("size_m", 0.0))

                    if shape == "square" and size_m > 0.0:
                        # Sample a small grid inside the square centered at (x0,z0)
                        half = size_m / 2.0
                        samples_xy = [-half, 0.0, half]
                        contrib = 0.0
                        count = 0
                        for dx in samples_xy:
                            for dz in samples_xy:
                                ideal_z = sqrt((x - (x0 + dx)) ** 2 + (z0 + dz) ** 2)
                                delta = z - ideal_z
                                weight = exp(-0.5 * (delta / sigma) ** 2)
                                attenuation = 1.0 / max(0.5, ideal_z)
                                contrib += weight * attenuation
                                count += 1
                        # Average, then mildly scale by size to reflect larger reflector strength
                        if count:
                            val += (contrib / count) * (1.0 + min(1.0, size_m))
                    else:
                        ideal_z = sqrt((x - x0) ** 2 + z0 ** 2)
                        delta = z - ideal_z
                        weight = exp(-0.5 * (delta / sigma) ** 2)
                        attenuation = 1.0 / max(0.5, ideal_z)
                        val += weight * attenuation
                matrix[j][i] = val

        # Normalize to [0,1]
        vmax = max((v for row in matrix for v in row), default=1.0)
        if vmax > 0:
            for j in range(samples):
                for i in range(traces):
                    matrix[j][i] = matrix[j][i] / vmax

        velocity_m_per_ns = compute_velocity(epsilon_r)

        return {
            "matrix": matrix,
            "x_axis": xs,
            "z_axis": zs,
            "epsilon_r": epsilon_r,
            "velocity_m_per_ns": velocity_m_per_ns,
            "wavelength_m": wavelength_m,
            "objects": clean_targets,
        }
