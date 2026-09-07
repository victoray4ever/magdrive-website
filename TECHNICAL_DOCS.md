# 🛠️ 迈德瑞智能装备科技 - 官方网站系统技术文档

> **项目名称**：面向熔盐与液态金属输送的高温磁力泵关键装备官方展示与工况定制系统  
> **技术架构**：Zero-Build 原生现代化技术栈（HTML5 + CSS3 + Vanilla ES6 + Python 3 高并发微服务）  
> **文档版本**：v2.0 (2026 生产级)

---

## 📑 目录

1. [系统总体架构设计](#1-系统总体架构设计)
2. [数据层与驱动核心 (DataManager)](#2-数据层与驱动核心-datamanager)
3. [前端表现与交互引擎 (main.js)](#3-前端表现与交互引擎-mainjs)
4. [可视化内容管理后台 (admin.js)](#4-可视化内容管理后台-adminjs)
5. [高并发后端微服务设计 (server.py)](#5-高并发后端微服务设计-serverpy)
6. [RESTful API 接口规范](#6-restful-api-接口规范)
7. [安全性与高可用容错机制](#7-安全性与高可用容错机制)
8. [生产环境部署与运维手册](#8-生产环境部署与运维手册)

---

## 1. 系统总体架构设计

### 1.1 Zero-Build（免构建）架构哲学
传统的现代前端框架（如 React/Vue）严重依赖 Node.js 工具链、庞大的 `node_modules` 依赖以及复杂的构建命令。为追求**工业级的超长稳定周期、极简运维和跨平台直接拷贝即用**，本项目采用了现代标准的 Zero-Build 架构：

- **表现层 (HTML5)**：语义化标签与自适应视口结构。
- **样式层 (CSS3)**：基于 CSS 自定义属性（Variables）、Flexbox 及 CSS Grid 构建自适应响应式栅格，结合玻璃拟态（Glassmorphism）打造深空科技蓝视觉体验。
- **逻辑层 (Vanilla ES6+)**：无任何第三方打包器转译，全平台主流浏览器原生支持异步（async/await）、模块化调度与动态 DOM 渲染。
- **服务层 (Python 3 标准库)**：零第三方依赖（无需 pip install），开箱即用，原生支持多线程高并发请求处理与持久化落盘。

### 1.2 整体架构拓扑图

```text
+-------------------------------------------------------------------------+
|                  Web 客户端 (PC浏览器 / 平板 / 智能手机)                    |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                 前端轻量化交互层 (Vanilla Web Standards)                  |
|  - 视图渲染 (index.html / admin.html)                                    |
|  - 现代样式与动效 (css/style.css)                                         |
|  - 业务控制器 (js/main.js / js/admin.js)                                  |
|  - 数据引擎核心 (js/data.js -> DataManager)                              |
|  - 图像处理引擎 (Cropper.js)                                              |
+-------------------------------------------------------------------------+
             |                                             |
             v                                             v
+-----------------------------+               +---------------------------+
|       数据与离线缓存层        |               |      后端微服务层 (Python)  |
| - localStorage 浏览器缓存    |               | - server.py 零依赖轻量服务  |
| - 内存响应式字典 (_csvContent)| <---(HTTP API)---> - POST /api/save-content   |
| - 内置默认数据字典 (_defaults)|               | - POST /api/save-image    |
+-----------------------------+               | - POST /api/submit-inquiry|
                                              | - GET  /api/inquiries     |
                                              +---------------------------+
                                                           |
                                                           v
                                              +---------------------------+
                                              |      本地磁盘持久化存储     |
                                              | - data/content.csv (主配置)|
                                              | - data/inquiries.json(询盘)|
                                              | - images/ (高清装备资产)   |
                                              +---------------------------+
```

---

## 2. 数据层与驱动核心 (DataManager)

`js/data.js` 中的 `DataManager` 对象是全站的核心数据引擎，封装了数据获取、格式解析、双向同步与容错降级逻辑。

### 2.1 数据格式标准化
全站所有文本、配置与参数均存储于 `data/content.csv` 中，格式规范为：
```csv
section,field,value
```
- `section`：板块命名空间（例如：`meta`, `product`, `performance`, `usage`, `application`, `contact`）。
- `field`：配置项名称（例如：`section_title`, `image1_caption`, `image1_description`）。
- `value`：具体内容（支持换行与逗号转义）。

### 2.2 UTF-8 BOM 自动清洗与 RFC 4180 解析算法
在 Windows Excel 下保存 CSV 会自动添加 UTF-8 BOM 标识符（`\ufeff`），会导致首个字段解析错位。`DataManager.parseCSV` 实现了高效的流式字符解析算法：
```javascript
text = text.replace(/^\ufeff/, ""); // 自动清洗 BOM 头
```
并支持成对双引号转义解析（`""` -> `"`），保障复杂工程描述文本的精确还原。

### 2.3 三级数据容错降级机制
系统保证在任何网络条件、断网或直接打开本地静态文件时**零白屏**：

$$\text{优先级} = \text{localStorage(本地覆盖)} \longrightarrow \text{content.csv(服务端真实数据)} \longrightarrow \text{\_loadDefaults(内置默认数据字典)}$$

- **版本自愈淘汰**：内置 `VERSION: "v3_magdrive_elite"`，当代码版本更新时自动识别并清除浏览器中的旧版垃圾缓存，防止脏数据干扰。

---

## 3. 前端表现与交互引擎 (main.js)

`js/main.js` 负责动态 DOM 构建与丰富的交互功能：

### 3.1 核心组件
1. **Hero 科技看板与 KPI 数据带**：
   - 动态装载五大关键工程指标（850℃、0泄漏、10倍+寿命、80%合金节约、23台交付）；
   - 3D 剖面展示卡片，支持悬浮光晕动效与全屏放大查看。
2. **多维竞品与传统长轴泵对标矩阵**：
   - 结构化对比迈德瑞 1.5m 紧凑泵、传统 20m 熔盐长轴泵与国际巨头（Flowserve/Sulzer/KSB）的技术参数。
3. **Lightbox 全屏画廊**：
   - 支持键盘方向键切换（← / →）与 ESC 退出，响应移动端手势。
4. **移动端自适应抽屉导航**：
   - 监听汉堡按钮状态，自动锁定页面滚动，提供顺滑的滑动菜单。
5. **智能工况选型表单与营业执照认证**：
   - 支持输送介质（熔盐、LBE铅铋、强酸碱等）与温区（350℃~850℃）下拉选型；
   - 营业执照资质缩略图直接绑定 Lightbox 全屏预览。

---

## 4. 可视化内容管理后台 (admin.js)

访问 `/admin.html` 即可进入可视化管理后台：

### 4.1 认证与权限控制
- 简易 Session Token 控制，支持一键登出与会话维持。

### 4.2 可视化编辑与 Cropper.js 图片裁剪
- **板块文字热修改**：支持在界面上直接调整标题、描述、各产品型号说明；
- **图片即时替换与裁剪**：内置 `Cropper.js`，支持 16:9、4:3、1:1 等比例裁剪并实时预览。

### 4.3 双轨落盘机制
- **服务端直接持久化**：点击保存时，将 CSV 数据 POST 至 `/api/save-content` 直接覆写服务器磁盘；将裁剪图片以 base64 发送至 `/api/save-image` 自动解码保存为物理图片。
- **本地 CSV 导出**：无后端时可直接下载生成的标准 `content.csv`。

---

## 5. 高并发后端微服务设计 (server.py)

`server.py` 是专为本项目定制的轻量级微服务：

### 5.1 多线程并发架构 (`ThreadingServer`)
继承 `socketserver.ThreadingMixIn` 和 `http.server.HTTPServer`，设置 `daemon_threads = True`，为每一个到来的 TCP 请求创建独立工作线程，避免任何排队挂起。

### 5.2 慢连接与公网爬虫防护 (`socket.setdefaulttimeout(20)`)
公网扫描爬虫经常建立长连接不发送数据导致阻塞。通过全局设置 20 秒套接字超时，超时的恶意或死连接将被强行关闭，保障正常用户和 NPM 反代的毫秒级响应。

### 5.3 端口锁定与快速复用 (`allow_reuse_address = True`)
- 开启 `SO_REUSEADDR`，避免服务重启时因 `TIME_WAIT` 导致端口绑定失败；
- 移除端口漂移逻辑，锁定在指定端口（如 8090），若端口暂时被占则自动等待重试，绝不擅自更改端口。

---

## 6. RESTful API 接口规范

| 接口地址 | 请求方式 | 请求体 / 参数 | 返回格式 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `/api/status` | `GET` | 无 | `{"has_backend": true}` | 探测服务端连通性 |
| `/api/save-content` | `POST` | `{"csv": "CSV文本内容"}` | `{"success": true, "message": "..."}` | 覆盖保存全站 content.csv |
| `/api/save-image` | `POST` | `{"filename": "...", "base64": "..."}` | `{"success": true, "url": "images/..."}` | 解码并落盘保存图片文件 |
| `/api/submit-inquiry`| `POST` | `{"name": "...", "contact": "...", ...}` | `{"success": true, "message": "..."}` | 接收并追加客户询盘至 JSON |
| `/api/inquiries` | `GET` | 无 | `{"success": true, "data": [...]}` | 获取历史询盘列表（后台使用） |
| `/api/delete-inquiry`| `POST` | `{"id": "inq_xxxx"}` | `{"success": true, "message": "..."}` | 删除指定询盘记录 |

---

## 7. 安全性与高可用容错机制

1. **路径遍历攻击防护**：所有文件名通过 `os.path.basename` 严格过滤，杜绝 `../` 越权写入风险。
2. **CORS 与缓存头控制**：API 与静态文件统一注入 `Access-Control-Allow-Origin: *` 与 `Cache-Control: no-cache`，保障动态更新实时生效。
3. **数据原子性备份**：在覆盖 `content.csv` 前，可配置自动保留 `.bak` 副本，防止异常断电导致数据丢失。

---

## 8. 生产环境部署与运维手册

### 8.1 快速启动命令
```bash
# 本地测试
python3 server.py 8080

# 生产环境指定端口 (如 8090)
python3 server.py 8090
```

### 8.2 Systemd 守护进程常用维护命令
```bash
# 查看服务状态
sudo systemctl status magdrive

# 重启服务
sudo systemctl restart magdrive

# 停止服务
sudo systemctl stop magdrive

# 查看实时日志
sudo journalctl -u magdrive -f
```

### 8.3 Nginx / Nginx Proxy Manager 反向代理推荐配置
```nginx
location / {
    proxy_pass http://127.0.0.1:8090;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 20M; # 支持大图上传
}
```
