from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent / "web"), **kwargs)


if __name__ == "__main__":
    host = "0.0.0.0"
    port = 8000
    print(f"4D航迹预测可视化原型已启动: http://localhost:{port}")
    server = ThreadingHTTPServer((host, port), AppHandler)
    server.serve_forever()
