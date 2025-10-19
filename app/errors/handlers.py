from flask import jsonify, render_template


def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(error):
        if app.config.get("PROPAGATE_EXCEPTIONS"):
            pass
        if _wants_json():
            return jsonify({"error": "Not found"}), 404
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def server_error(error):
        if _wants_json():
            return jsonify({"error": "Server error"}), 500
        return render_template("errors/500.html"), 500


def _wants_json():
    # Very simple check; browsers will render HTML templates
    from flask import request

    best = request.accept_mimetypes.best_match(["application/json", "text/html"])  # type: ignore
    return best == "application/json" and (
        request.accept_mimetypes[best] > request.accept_mimetypes["text/html"]
    )

