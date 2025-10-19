import os
from flask import Flask
from .extensions import db, migrate
from .config import Config


def create_app(config_class: type = Config) -> Flask:
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object(config_class)

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    from .main import bp as main_bp
    app.register_blueprint(main_bp)

    from .api import api_bp
    app.register_blueprint(api_bp)

    # Error handlers
    from .errors.handlers import register_error_handlers
    register_error_handlers(app)

    return app

