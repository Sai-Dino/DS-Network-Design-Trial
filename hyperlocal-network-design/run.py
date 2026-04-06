#!/usr/bin/env python3
"""
Application entry point.

  Development:   python run.py
  Production:    gunicorn -c gunicorn.conf.py 'app:create_app()'
"""

from app import create_app
from app.config import get_config


def _banner(cfg):
    import socket

    try:
        local_ip = socket.gethostbyname(socket.gethostname())
    except Exception:
        local_ip = "127.0.0.1"

    print(f"""
    ╔══════════════════════════════════════════════════════════════════╗
    ║   FLIPKART HYPERLOCAL DISTANCE ANALYSIS SERVER                  ║
    ║   Status: RUNNING  •  Port: {cfg.PORT:<5}                          ║
    ║   Local:    http://localhost:{cfg.PORT}                            ║
    ║   Network:  http://{local_ip}:{cfg.PORT}                          ║
    ╚══════════════════════════════════════════════════════════════════╝
    """)


if __name__ == "__main__":
    cfg = get_config()
    app = create_app(cfg)
    _banner(cfg)
    app.run(host=cfg.HOST, port=cfg.PORT, debug=cfg.DEBUG, threaded=True)
