from .extensions import db


class Scenario(db.Model):
    __tablename__ = "scenarios"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=True)
    width_m = db.Column(db.Float, default=10.0)
    max_depth_m = db.Column(db.Float, default=5.0)
    epsilon_r = db.Column(db.Float, default=9.0)
    wavelength_m = db.Column(db.Float, default=0.3)

    targets = db.relationship("Target", backref="scenario", cascade="all, delete-orphan")


class Target(db.Model):
    __tablename__ = "targets"
    id = db.Column(db.Integer, primary_key=True)
    scenario_id = db.Column(db.Integer, db.ForeignKey("scenarios.id"), nullable=False)
    x_m = db.Column(db.Float, nullable=False)
    z_m = db.Column(db.Float, nullable=False)

