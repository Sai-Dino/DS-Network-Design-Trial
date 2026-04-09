"""
Authentication endpoints — login, logout, signup, and current-user check.

Uses Flask's built-in signed session cookies.  No tokens to manage,
no localStorage to worry about.  The browser sends the cookie
automatically on every request.
"""

import logging
import re

from flask import Blueprint, jsonify, request, session

from app.extensions import bcrypt, db
from app.models import User

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__)

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9._-]{3,30}$")


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter(User.username.ilike(username)).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        logger.warning("Failed login attempt for '%s'", username)
        return jsonify({"error": "Invalid username or password"}), 401

    session.permanent = True
    session["user_id"] = user.id
    session["username"] = user.username

    logger.info("User '%s' logged in", username)
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/api/auth/signup", methods=["POST"])
def signup():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    display_name = (body.get("display_name") or "").strip() or None

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if not _USERNAME_RE.match(username):
        return jsonify({
            "error": "Username must be 3-30 characters (letters, numbers, . _ - only)"
        }), 400

    if len(password) < 4:
        return jsonify({"error": "Password must be at least 4 characters"}), 400

    if User.query.filter(User.username.ilike(username)).first():
        return jsonify({"error": "Username already taken"}), 409

    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(username=username, password_hash=pw_hash, display_name=display_name)
    db.session.add(user)
    db.session.commit()

    session.permanent = True
    session["user_id"] = user.id
    session["username"] = user.username

    logger.info("New user signed up: '%s'", username)
    return jsonify({"user": user.to_dict()}), 201


@auth_bp.route("/api/auth/logout", methods=["POST"])
def logout():
    username = session.get("username", "unknown")
    session.clear()
    logger.info("User '%s' logged out", username)
    return jsonify({"status": "logged_out"}), 200


@auth_bp.route("/api/auth/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not logged in"}), 401

    user = db.session.get(User, user_id)
    if not user:
        session.clear()
        return jsonify({"error": "User not found"}), 401

    return jsonify({"user": user.to_dict()}), 200
