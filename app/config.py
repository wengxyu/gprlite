import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", f"sqlite:///{os.path.abspath('gprlite.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # App defaults for simulation
    GPR_WIDTH_M = float(os.getenv("GPR_WIDTH_M", "10.0"))
    GPR_MAX_DEPTH_M = float(os.getenv("GPR_MAX_DEPTH_M", "5.0"))
    GPR_TRACES = int(os.getenv("GPR_TRACES", "200"))
    GPR_SAMPLES = int(os.getenv("GPR_SAMPLES", "150"))
    GPR_EPSILON_R = float(os.getenv("GPR_EPSILON_R", "9.0"))
    GPR_WAVELENGTH_M = float(os.getenv("GPR_WAVELENGTH_M", "0.3"))

