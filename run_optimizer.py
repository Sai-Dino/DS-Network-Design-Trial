#!/usr/bin/env python3
"""
Network Optimizer server with OSRM proxy.
Serves the HTML and proxies /osrm/* requests to the local OSRM server
to avoid browser CORS issues.

Usage: python3 run_optimizer.py
Then open: http://localhost:5050
"""
import http.server
import urllib.request
import urllib.error
import os
import webbrowser
import json

PORT = 5050
OSRM_URL = 'http://localhost:5000'
DIR = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    def do_GET(self):
        # Health check endpoint
        if self.path == '/osrm-health':
            try:
                r = urllib.request.urlopen(f"{OSRM_URL}/route/v1/driving/77.5946,12.9716;77.6,12.97", timeout=5)
                body = r.read()
                msg = b'{"proxy":"ok","osrm":"ok","osrm_url":"' + OSRM_URL.encode() + b'"}'
            except Exception as e:
                msg = json.dumps({"proxy":"ok","osrm":"error","detail":str(e)}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(msg))
            self.end_headers()
            self.wfile.write(msg)
        # Proxy OSRM requests
        elif self.path.startswith('/osrm/'):
            self.proxy_osrm()
        elif self.path == '/' or self.path == '':
            # Redirect to the optimizer
            self.send_response(302)
            self.send_header('Location', '/network_optimizer.html')
            self.end_headers()
        else:
            super().do_GET()

    def proxy_osrm(self):
        # Strip /osrm prefix and forward to OSRM server
        osrm_path = self.path[5:]  # Remove '/osrm'
        url = OSRM_URL + osrm_path
        try:
            req = urllib.request.urlopen(url, timeout=60)
            data = req.read()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(data))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(data)
        except urllib.error.URLError as e:
            error_msg = json.dumps({'error': str(e), 'code': 'Error'}).encode()
            self.send_response(502)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(error_msg))
            self.end_headers()
            self.wfile.write(error_msg)
        except Exception as e:
            error_msg = json.dumps({'error': str(e), 'code': 'Error'}).encode()
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(error_msg))
            self.end_headers()
            self.wfile.write(error_msg)

    def log_message(self, format, *args):
        # Log all requests for debugging
        super().log_message(format, *args)

if __name__ == '__main__':
    # Test OSRM connection first
    print(f"Testing OSRM at {OSRM_URL}...")
    try:
        r = urllib.request.urlopen(f"{OSRM_URL}/route/v1/driving/77.5946,12.9716;77.6,12.97", timeout=5)
        d = json.loads(r.read())
        if d.get('code') == 'Ok':
            print(f"  OSRM is running!\n")
        else:
            print(f"  OSRM responded but returned: {d.get('code')}\n")
    except Exception as e:
        print(f"  WARNING: OSRM not reachable at {OSRM_URL}: {e}")
        print(f"  Make sure OSRM is running before using the optimizer.\n")

    print(f"Starting server at http://localhost:{PORT}")
    print(f"Opening browser...\n")
    print("Press Ctrl+C to stop\n")

    webbrowser.open(f"http://localhost:{PORT}/network_optimizer.html")

    with http.server.HTTPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
