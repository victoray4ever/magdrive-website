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

## 4. 可视化内容管理后台体系 (admin.html & admin.js)

访问 `/admin.html` 即可进入 Zero-Build 架构下的企业级管理后台，无需任何前端构建工具即可完成全站内容调优与运维监控：

### 4.1 身份认证与密码生命周期管理
- **服务端持久化认证**：登录通过 `POST /api/login` 校验，凭据读取自服务器磁盘 `data/admin.json`。认证成功后颁发带时效的随机 Session Token 并存入浏览器的 `sessionStorage`。
- **在线密码热修改**：在后台顶栏集成「🔑 修改密码」模态弹窗，通过 `POST /api/change-password` 进行原子化修改。
- **离线降级与隔离安全**：若在纯静态环境（无 Python 后端）下运行，系统平滑降级至 `localStorage` 本地验证；生产环境下凭证文件 `data/admin.json` 被 `.gitignore` 严密保护，公开仓库绝无泄漏风险。

### 4.2 内容块（Content Blocks）动态编排架构
为摆脱传统固定字段对页面的死板限制，各核心展示板块（产品展示、性能参数、使用方法、应用工况）全面重构为**内容块驱动引擎**：
- **块类型支持**：
  - **图片块**：支持标题、详细技术描述、自定义显示宽度/高度比例，以及填充模式（`contain` 适合机械图纸/图表，`cover` 适合高清实拍实物）；
  - **表格块**：支持在后台自由增删行列，在线填写参数对标表、物料清单（BOM）等结构化数据。
- **动态序列与防回退设计**：
  - 支持块的上移、下移与删除操作，自动维护内部唯一 Block ID；
  - 彻底重构了数据保存管道，彻底杜绝多板块联动保存时因 ID 重号或字段留空引发的“串图”与“默认值暴力回填”现象。

### 4.3 首页与全局通用文案定制（`texts` Tab）
- **标签自定义引擎**：通过 `DataManager.ADMIN_TAB_ORDER` 与 `getAdminTabLabel()`，允许管理员自由修改前台导航栏文本以及后台顶部 Tab 按钮名称。
- **微文案配置**：集中管理页首副标、技术亮点卡片、CTA 按钮文字等微文案，无需修改任何 HTML 代码。

### 4.4 图像工程管线与 Cropper.js 原生集成
- **专业画幅裁剪**：集成原生 `Cropper.js`，提供自由比例、3:2、1:1、3:4、5:2 等工业装备展示专属长宽比。
- **Base64 二进制解码服务端落盘**：裁剪后生成的 Base64 编码直接通过 `POST /api/save-image` 传至后端，服务端自动过滤非法字符并物理写入 `images/` 资产目录。

### 4.5 询盘数据管理与隐私安全隔离（`inquiries` Tab）
- **实时数据呈现**：通过 `GET /api/inquiries` 获取客户意向工况提交记录（包含联系电话、工况介质、设计温区等）。
- **商机运维**：支持一键导出标准 CSV 表格供商务团队录入 CRM，支持调用 `POST /api/delete-inquiry` 清理过期测试数据。
- **数据隐私保护**：生产数据落盘至 `data/inquiries.json` 并被 `.gitignore` 严密屏蔽，仓库中仅保留 `inquiries.example.json` 模板。

### 4.6 GitHub Webhook 持续交付仪表盘（`webhook` Tab）
- **运维可视化**：将 CI/CD 状态直接内嵌在管理后台中，无需登录 SSH 服务器即可掌握部署状态。
- **智能参数识别**：自适应提取 `window.location` 组装正确的 Payload URL，并提供一键剪贴板复制。
- **实时终端日志**：定时或手动触发 `GET /api/webhook-status` 抓取 `/var/log/magdrive_deploy.log`，黑客风控制台直观呈现触发时间、最新 Commit 信息及同步结果。

### 4.7 双轨落盘持久化机制
- **服务端直接物理落盘**：将最新配置序列化为标准 UTF-8 带 BOM 的 CSV，经 `POST /api/save-content` 直接覆写 `data/content.csv`。
- **本地 CSV 导出**：支持一键生成并下载纯客户端 `content.csv`，方便本地离线备份或导入 Excel 批量修改。

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
| `/api/login` | `POST` | `{"username": "...", "password": "..."}` | `{"success": true, "token": "..."}` | 管理员登录认证与获取会话令牌 |
| `/api/change-password` | `POST` | `{"old_password": "...", "new_password": "..."}` | `{"success": true, "message": "..."}` | 校验原密码并持久化更新管理员密码 |
| `/api/status` | `GET` | 无 | `{"has_backend": true}` | 探测服务端连通性 |
| `/api/save-content` | `POST` | `{"csv": "CSV文本内容"}` | `{"success": true, "message": "..."}` | 覆盖保存全站 content.csv |
| `/api/save-image` | `POST` | `{"filename": "...", "base64": "..."}` | `{"success": true, "url": "images/..."}` | 解码并落盘保存图片文件 |
| `/api/submit-inquiry`| `POST` | `{"name": "...", "contact": "...", ...}` | `{"success": true, "message": "..."}` | 接收并追加客户询盘至 JSON |
| `/api/inquiries` | `GET` | 无 | `{"success": true, "data": [...]}` | 获取历史询盘列表（后台使用） |
| `/api/delete-inquiry`| `POST` | `{"id": "inq_xxxx"}` | `{"success": true, "message": "..."}` | 删除指定询盘记录 |
| `/api/webhook` | `POST` | GitHub Webhook JSON | `{"success": true, "message": "..."}` | 接收 GitHub push/ping 事件自动拉取更新 |
| `/api/webhook-status` | `GET` | 无 | `{"success": true, "recent_logs": "..."}` | 查看自动部署状态与最近部署日志 |

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

---

## 9. GitHub Webhook 自动化部署与安全机制

系统支持在代码推送到 GitHub 仓库时，服务器全自动拉取最新代码并即时热更新前台内容。

### 9.1 安全防护机制（公开仓库不泄漏密码）
- **绝不存储服务器密码**：Webhook 为纯 HTTP 接收端点，完全由服务器自发从 GitHub 拉取公开代码，代码库与服务器交互全过程无需任何 SSH 密码。
- **HMAC-SHA256 密文验签**：GitHub 发送的请求头包含 `X-Hub-Signature-256`。服务端通过标准库 `hmac` 和 `hashlib.sha256` 进行常数时间防时序攻击比对（`hmac.compare_digest`）。
- **Secret 物理隔离**：通信密钥自动保存于服务器本地 `data/webhook_secret.txt`（`chmod 600`），并在 `.gitignore` 中严密排除，绝不提交至公开 Git 仓库。
- **生产业务数据保护**：自动同步脚本采用 `rsync` 增量同步，严格排除 `data/admin.json`、`data/inquiries.json` 和 `data/webhook_secret.txt`，保证线上的管理员密码和客户真实询盘永远不会被 Git 覆盖或重置。

### 9.2 自动化部署脚本执行链
1. 监听端点：`POST /api/webhook`
2. 校验签名合法后，开启异步守护线程调用 `/var/www/magdrive/deploy/webhook_deploy.sh`。
3. 脚本执行：
   ```bash
   cd /var/www/magdrive-repo && git fetch origin main && git reset --hard origin/main
   rsync -av --exclude 'data/admin.json' --exclude 'data/inquiries.json' /var/www/magdrive-repo/website/ /var/www/magdrive/
   ```
4. 若检测到 `server.py` 发生改动，平滑重启 Systemd 服务（`systemctl restart magdrive`），前端静态资源与内容修改则直接秒级生效。

