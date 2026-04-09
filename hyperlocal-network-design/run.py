#!/usr/bin/env python3
"""
Application entry point.

  Development:   python3 run.py
  Production:    gunicorn -c gunicorn.conf.py 'app:create_app()'

  User management:
    python3 run.py create-user <username> <password>
    python3 run.py create-user <username> <password> --name "Display Name"
    python3 run.py list-users
"""

from dotenv import load_dotenv
load_dotenv()

import sys
from app import create_app
from app.config import get_config


def _get_all_ips():
    """Return a list of (label, ip) tuples for all network interfaces."""
    import socket
    ips = [("Local", "localhost")]
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ip = info[4][0]
            if ip not in ("127.0.0.1", "0.0.0.0") and ip not in [i[1] for i in ips]:
                ips.append(("Network", ip))
    except Exception:
        pass

    try:
        import netifaces
        for iface in netifaces.interfaces():
            addrs = netifaces.ifaddresses(iface).get(netifaces.AF_INET, [])
            for addr in addrs:
                ip = addr.get("addr")
                if ip and ip not in ("127.0.0.1", "0.0.0.0") and ip not in [i[1] for i in ips]:
                    label = "VPN/Network" if iface.startswith(("utun", "tun", "ppp")) else "Network"
                    ips.append((label, ip))
    except ImportError:
        pass

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        if ip not in [i[1] for i in ips]:
            ips.append(("Network", ip))
    except Exception:
        pass

    return ips


def _banner(cfg):
    ips = _get_all_ips()
    port = cfg.PORT

    print()
    print("    ╔══════════════════════════════════════════════════════════════════╗")
    print("    ║   FLIPKART HYPERLOCAL DISTANCE ANALYSIS SERVER                  ║")
    print(f"    ║   Status: RUNNING  •  Port: {port:<5}                          ║")
    print("    ╠══════════════════════════════════════════════════════════════════╣")
    for label, ip in ips:
        url = f"http://{ip}:{port}"
        print(f"    ║   {label + ':':<10} {url:<50} ║")
    print("    ╠══════════════════════════════════════════════════════════════════╣")
    print("    ║   Share the Network/VPN URL with colleagues on the same VPN     ║")
    print("    ╚══════════════════════════════════════════════════════════════════╝")
    print()


def _create_user(app, username, password, display_name=None):
    from app.extensions import bcrypt, db
    from app.models import User

    with app.app_context():
        existing = User.query.filter_by(username=username).first()
        if existing:
            print(f"Error: User '{username}' already exists.")
            sys.exit(1)

        pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        user = User(username=username, password_hash=pw_hash, display_name=display_name)
        db.session.add(user)
        db.session.commit()
        print(f"User '{username}' created successfully.")


def _list_users(app):
    from app.models import User

    with app.app_context():
        users = User.query.all()
        if not users:
            print("No users found. Create one with: python3 run.py create-user <username> <password>")
            return
        print(f"{'ID':<5} {'Username':<20} {'Display Name':<25} {'Created'}")
        print("-" * 75)
        for u in users:
            created = u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "?"
            print(f"{u.id:<5} {u.username:<20} {(u.display_name or '-'):<25} {created}")


if __name__ == "__main__":
    cfg = get_config()
    app = create_app(cfg)

    if len(sys.argv) >= 2:
        cmd = sys.argv[1]

        if cmd == "create-user":
            if len(sys.argv) < 4:
                print("Usage: python3 run.py create-user <username> <password> [--name \"Display Name\"]")
                sys.exit(1)
            username = sys.argv[2]
            password = sys.argv[3]
            display_name = None
            if "--name" in sys.argv:
                idx = sys.argv.index("--name")
                if idx + 1 < len(sys.argv):
                    display_name = sys.argv[idx + 1]
            _create_user(app, username, password, display_name)
            sys.exit(0)

        elif cmd == "list-users":
            _list_users(app)
            sys.exit(0)

        else:
            print(f"Unknown command: {cmd}")
            print("Available commands: create-user, list-users")
            sys.exit(1)

    _banner(cfg)
    app.run(host=cfg.HOST, port=cfg.PORT, debug=cfg.DEBUG, threaded=True)
