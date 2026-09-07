#!/usr/bin/env python3
"""
轴承产品展示网站 - 本地启动与持久化服务器
用法: python server.py [端口号]
默认端口: 8080
"""

import http.server
import socketserver
import socket
import webbrowser
import sys
import os
import pathlib
import json
import base64
import time
import uuid

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIRECTORY, "data")
IMAGES_DIR = os.path.join(DIRECTORY, "images")
INQUIRIES_FILE = os.path.join(DATA_DIR, "inquiries.json")
CONTENT_FILE = os.path.join(DATA_DIR, "content.csv")
ADMIN_FILE = os.path.join(DATA_DIR, "admin.json")

def get_admin_credentials():
    """获取管理员账号密码，若不存在则初始化默认账号"""
    if os.path.exists(ADMIN_FILE):
        try:
            with open(ADMIN_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"username": "admin", "password": "123"}

def save_admin_credentials(creds):
    """保存管理员账号密码到磁盘"""
    with open(ADMIN_FILE, "w", encoding="utf-8") as f:
        json.dump(creds, f, ensure_ascii=False, indent=2)

# 确保目录存在
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

# 确保支持 SVG、CSV 等文件类型的 MIME 类型
MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".csv": "text/csv; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".json": "application/json; charset=utf-8",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
}



class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    """自定义请求处理器，支持 REST API 与 MIME 类型映射"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # 添加 CORS 头与无缓存头，方便开发与实时同步
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, status_code, data):
        """返回 JSON 响应"""
        response_bytes = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response_bytes)))
        self.end_headers()
        self.wfile.write(response_bytes)

    def read_json_body(self):
        """读取请求体中的 JSON 数据"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length <= 0:
                return {}
            body = self.rfile.read(content_length).decode("utf-8")
            return json.loads(body)
        except Exception as e:
            print(f"[API Error] 解析请求体失败: {e}")
            return {}

    def do_GET(self):
        # 截取路径 query string
        path_only = self.path.split("?")[0]

        # API 路由: 状态检查
        if path_only == "/api/status":
            self.send_json(200, {
                "status": "ok",
                "has_backend": True,
                "server_time": time.strftime("%Y-%m-%d %H:%M:%S"),
                "message": "本地 Python 后端服务正常运行，支持直接落盘保存"
            })
            return

        # API 路由: 获取询盘列表
        if path_only == "/api/inquiries":
            inquiries = []
            if os.path.exists(INQUIRIES_FILE):
                try:
                    with open(INQUIRIES_FILE, "r", encoding="utf-8") as f:
                        inquiries = json.load(f)
                except Exception as e:
                    print(f"[API Error] 读取询盘列表失败: {e}")
            self.send_json(200, {"success": True, "data": inquiries})
            return

        # 默认静态文件处理
        super().do_GET()

    def do_POST(self):
        path_only = self.path.split("?")[0]

        # API 路由: 管理员登录认证
        if path_only == "/api/login":
            data = self.read_json_body()
            username = data.get("username", "").strip()
            password = data.get("password", "").strip()
            creds = get_admin_credentials()
            if username == creds.get("username") and password == creds.get("password"):
                token = f"token_{uuid.uuid4().hex}"
                print(f"[API Auth] 用户 {username} 登录成功")
                self.send_json(200, {"success": True, "token": token, "message": "登录成功"})
            else:
                print(f"[API Auth] 用户 {username} 登录失败: 密码错误")
                self.send_json(401, {"success": False, "message": "用户名或密码错误，请重试"})
            return

        # API 路由: 修改管理员密码
        if path_only == "/api/change-password":
            data = self.read_json_body()
            old_password = data.get("old_password", "").strip()
            new_password = data.get("new_password", "").strip()
            creds = get_admin_credentials()
            if old_password != creds.get("password"):
                self.send_json(400, {"success": False, "message": "当前原密码不正确，请重新输入"})
                return
            if not new_password or len(new_password) < 6:
                self.send_json(400, {"success": False, "message": "新密码长度不能少于6位"})
                return
            creds["password"] = new_password
            save_admin_credentials(creds)
            print(f"[API Auth] 管理员密码已成功修改")
            self.send_json(200, {"success": True, "message": "密码修改成功！请使用新密码重新登录"})
            return

        # API 路由: 保存 content.csv
        if path_only == "/api/save-content":
            data = self.read_json_body()
            csv_text = data.get("csv", "")
            if not csv_text and "rows" in data:
                # 兼容行数组格式
                rows = data.get("rows", [])
                lines = []
                for row in rows:
                    line = ",".join(
                        f'"{cell.replace(chr(34), chr(34)+chr(34))}"' if any(c in cell for c in [',', '"', '\n']) else cell
                        for cell in row
                    )
                    lines.append(line)
                csv_text = "\n".join(lines)

            if not csv_text:
                self.send_json(400, {"success": False, "message": "CSV 内容为空"})
                return

            try:
                with open(CONTENT_FILE, "w", encoding="utf-8-sig") as f:
                    f.write(csv_text)
                print(f"[API] 成功保存数据至: {CONTENT_FILE}")
                self.send_json(200, {"success": True, "message": "网站内容已直接保存至 content.csv"})
            except Exception as e:
                print(f"[API Error] 写入 content.csv 失败: {e}")
                self.send_json(500, {"success": False, "message": f"保存失败: {str(e)}"})
            return

        # API 路由: 保存上传图片到 images 目录
        if path_only == "/api/save-image":
            data = self.read_json_body()
            base64_data = data.get("base64", "")
            filename = data.get("filename", "")

            if not base64_data or not filename:
                self.send_json(400, {"success": False, "message": "缺少图片数据或文件名"})
                return

            # 安全过滤文件名
            safe_filename = os.path.basename(filename)
            if not safe_filename:
                safe_filename = f"upload-{uuid.uuid4().hex[:8]}.jpg"

            try:
                # 去除 data:image/...;base64, 前缀
                if "," in base64_data:
                    base64_data = base64_data.split(",", 1)[1]
                image_bytes = base64.b64decode(base64_data)
                target_path = os.path.join(IMAGES_DIR, safe_filename)
                with open(target_path, "wb") as f:
                    f.write(image_bytes)
                print(f"[API] 成功保存图片至: {target_path} ({len(image_bytes)} 字节)")
                self.send_json(200, {
                    "success": True,
                    "url": f"images/{safe_filename}",
                    "filename": safe_filename,
                    "message": f"图片已保存至 images/{safe_filename}"
                })
            except Exception as e:
                print(f"[API Error] 保存图片失败: {e}")
                self.send_json(500, {"success": False, "message": f"保存图片失败: {str(e)}"})
            return

        # API 路由: 提交在线询盘
        if path_only == "/api/submit-inquiry":
            inquiry = self.read_json_body()
            if not inquiry.get("name") and not inquiry.get("contact"):
                self.send_json(400, {"success": False, "message": "请填写姓名或联系电话"})
                return

            inquiry["id"] = uuid.uuid4().hex[:10]
            inquiry["created_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
            inquiry["status"] = "unread"

            # 读取现有询盘列表并追加
            inquiries = []
            if os.path.exists(INQUIRIES_FILE):
                try:
                    with open(INQUIRIES_FILE, "r", encoding="utf-8") as f:
                        inquiries = json.load(f)
                except Exception:
                    inquiries = []
            
            inquiries.insert(0, inquiry)  # 最新排在最前

            try:
                with open(INQUIRIES_FILE, "w", encoding="utf-8") as f:
                    json.dump(inquiries, f, ensure_ascii=False, indent=2)
                print(f"[API] 收到新客户询盘: {inquiry.get('name')} - {inquiry.get('contact')}")
                self.send_json(200, {
                    "success": True,
                    "message": "询盘提交成功！我们的技术选型工程师将在2小时内与您联系。"
                })
            except Exception as e:
                print(f"[API Error] 保存询盘失败: {e}")
                self.send_json(500, {"success": False, "message": f"提交失败: {str(e)}"})
            return

        # API 路由: 删除询盘
        if path_only == "/api/delete-inquiry":
            data = self.read_json_body()
            inquiry_id = data.get("id")
            if not inquiry_id or not os.path.exists(INQUIRIES_FILE):
                self.send_json(400, {"success": False, "message": "缺少询盘 ID"})
                return
            try:
                with open(INQUIRIES_FILE, "r", encoding="utf-8") as f:
                    inquiries = json.load(f)
                inquiries = [item for item in inquiries if item.get("id") != inquiry_id]
                with open(INQUIRIES_FILE, "w", encoding="utf-8") as f:
                    json.dump(inquiries, f, ensure_ascii=False, indent=2)
                self.send_json(200, {"success": True, "message": "询盘记录已删除"})
            except Exception as e:
                self.send_json(500, {"success": False, "message": f"删除失败: {str(e)}"})
            return

        # 其他未匹配的 POST 请求
        self.send_json(404, {"success": False, "message": "API endpoint not found"})

    def guess_type(self, path):
        """根据文件扩展名返回正确的 MIME 类型"""
        ext = pathlib.Path(path).suffix.lower()
        if ext in MIME_TYPES:
            return MIME_TYPES[ext]
        return super().guess_type(path)


def main():
    socket.setdefaulttimeout(20)  # 20秒超时保护，杜绝慢速爬虫挂起
    port = PORT

    # 从命令行参数获取端口
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"错误: 无效的端口号 '{sys.argv[1]}'")
            print(f"用法: python {sys.argv[0]} [端口号]")
            sys.exit(1)

    # 严格绑定指定端口（带重试机制，绝不漂移端口）
    httpd = None
    for attempt in range(10):
        try:
            httpd = ThreadingServer(("", port), CustomHandler)
            break
        except OSError as e:
            if attempt < 9:
                print(f"端口 {port} 暂时繁忙 (处于 TIME_WAIT)，等待 1 秒后重试... ({attempt + 1}/10)")
                time.sleep(1)
            else:
                print(f"错误: 无法绑定端口 {port}: {e}")
                sys.exit(1)

    url = f"http://localhost:{port}"
    print("=" * 55)
    print(f"  🌟 迈德瑞智能装备官网高并发生产服务器已启动")
    print(f"  👉 监听端口: {port} (多线程并发 + 防爬虫慢连接超时保护)")
    print(f"  👉 网站前台: {url}")
    print(f"  👉 管理后台: {url}/admin.html")
    print(f"  👉 本地持久化 API: 已就绪 (直接写入 content.csv & images/)")
    print(f"  按 Ctrl+C 停止服务器")
    print("=" * 55)

    if sys.stdout.isatty():
        try:
            webbrowser.open(url)
        except Exception:
            pass

    try:
        httpd.serve_forever()
    finally:
        httpd.server_close()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n服务器已停止。")
        sys.exit(0)
