#!/usr/bin/env python3
"""Comfy Bridge — proxy local com senha (20/07/2026).

O ComfyUI Desktop so aceita conexoes em 127.0.0.1:8000 (nao da pra chamar
dele da VPS). Este script escuta na rede Tailscale numa porta separada
(8088) com uma chave secreta obrigatoria e repassa pro ComfyUI local — sem
mexer no processo do ComfyUI Desktop em si. Usado por fayai_news.py na VPS
pra gerar 1 capa especifica por noticia publicada.

Rodar: definir COMFY_BRIDGE_SECRET no ambiente, depois
python scripts/arcade/comfy_bridge.py
(a mesma chave precisa estar em COMFY_BRIDGE_SECRET no .env.fayai da VPS)
"""
import http.server
import os
import socketserver
import sys
import urllib.error
import urllib.request

COMFY = "http://127.0.0.1:8000"
SECRET = os.environ.get("COMFY_BRIDGE_SECRET")
PORT = 8088

if not SECRET:
    sys.exit("Defina COMFY_BRIDGE_SECRET no ambiente antes de rodar este script.")


class Handler(http.server.BaseHTTPRequestHandler):
    def _authorized(self):
        return self.headers.get("x-comfy-secret") == SECRET

    def _proxy(self):
        if not self._authorized():
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error":"unauthorized"}')
            return
        length = int(self.headers.get("Content-Length", 0) or 0)
        body = self.rfile.read(length) if length else None
        req = urllib.request.Request(COMFY + self.path, data=body, method=self.command)
        content_type = self.headers.get("Content-Type")
        if content_type:
            req.add_header("Content-Type", content_type)
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                self.send_response(resp.status)
                self.send_header("Content-Type", resp.headers.get("Content-Type", "application/json"))
                self.end_headers()
                self.wfile.write(resp.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.end_headers()
            self.wfile.write(e.read())
        except Exception as e:  # noqa: BLE001 -- proxy generico, qualquer falha vira 502
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(f'{{"error":"{e}"}}'.encode())

    def do_GET(self):
        self._proxy()

    def do_POST(self):
        self._proxy()

    def log_message(self, fmt, *args):
        print(f"[comfy-bridge] {self.address_string()} {fmt % args}")


if __name__ == "__main__":
    with socketserver.ThreadingTCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"comfy-bridge listening on 0.0.0.0:{PORT} -> {COMFY}")
        httpd.serve_forever()
