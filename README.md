# 🚀 迈德瑞智能装备科技 - 高性能企业官网与智能工况定制系统

> **面向熔盐与液态金属输送的高温磁力泵关键装备研发及产业化**  
> 一套专为硬核高端装备企业打造的**轻量化、零构建依赖（No-Build）、数据驱动、自带可视化后台与持久化落盘能力**的现代化响应式开源官方网站系统。

---

## 📑 目录

- [🌟 项目特性](#-项目特性)
- [🏗️ 系统架构与核心工作原理](#️-系统架构与核心工作原理)
  - [1. 整体分层架构图](#1-整体分层架构图)
  - [2. 数据驱动核心原理 (Data Layer)](#2-数据驱动核心原理-data-layer)
  - [3. 前后端数据流向与落盘机制](#3-前后端数据流向与落盘机制)
  - [4. 多级高可用容错降级体系](#4-多级高可用容错降级体系)
- [📂 目录结构与文件说明](#-目录结构与文件说明)
- [⚡ 快速开始与本地运行](#-快速开始与本地运行)
- [⚙️ 管理后台与内容运维](#️-管理后台与内容运维)
- [🛠️ 二次开发与定制指引](#️-二次开发与定制指引)
  - [修改品牌标识与主视觉](#修改品牌标识与主视觉)
  - [调整核心板块与文案](#调整核心板块与文案)
  - [扩展工况选型表单字段](#扩展工况选型表单字段)
- [🚢 生产环境部署指南](#-生产环境部署指南)
  - [方式一：Systemd 服务守护 + Nginx / NPM（推荐）](#方式一systemd-服务守护--nginx--npm推荐)
  - [方式二：Docker 容器化部署](#方式二docker-容器化部署)
- [📄 开源协议](#-开源协议)

---

## 🌟 项目特性

1. **零构建依赖（No-Build Architecture）**：
   - 采用纯现代标准 Web 技术栈（HTML5 + CSS3 + 原生 ES6 + Python 3 标准库）。
   - 无需 npm install、无需 Webpack/Vite 编译打包，克隆即用，免除依赖地狱。
2. **硬核工业级科技美学**：
   - 深空科技蓝视觉基调、CSS 呼吸微光晕、3D 泵模型透视展示、关键指标数据带（KPI Strip）。
   - 响应式自适应布局，完美适配 PC 桌面端、平板电脑及智能手机（配备抽屉式移动导航）。
3. **数据解耦与 CSV 直接驱动**：
   - 页面全站文案、参数对标数据、企业资质、展示图片均由 `data/content.csv` 驱动，技术人员与非技术人员均可通过 Excel、记事本或管理后台随时编辑。
4. **开箱即用的可视化管理后台（`/admin.html`）**：
   - 内置可视化内容管理器，支持实时修改全站文本、调整展示图数量、拖拽裁剪图片（集成 Cropper.js）、主题色定制等。
   - 提供直接一键落盘保存到服务器磁盘或导出 CSV 功能。
5. **智能工况选型与询盘管理系统**：
   - 专为工业制造研发的工况参数表单，支持介质类型（熔盐、液态铅铋合金 LBE、强酸碱等）与温区（350℃~850℃）选型提交。
   - 询盘数据自动安全归档在 `data/inquiries.json`，并在后台提供可视化的询盘管理面板。
6. **国家级资质认证展示**：
   - 集成营业执照官方认证卡片与高精度原件 Lightbox 全屏放大画廊。

---

## 🏗️ 系统架构与核心工作原理

### 1. 整体分层架构图

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

### 2. 数据驱动核心原理 (Data Layer)

整个网站的数据流转由 `js/data.js` 中的 `DataManager` 单例对象统一调度：

- **数据统一格式**：所有配置采用 CSV 的三列标准结构：`section,field,value`。
  - `section`：板块命名空间（如 `meta`, `product`, `performance`, `usage`, `application`, `contact`）。
  - `field`：字段名（如 `section_title`, `image1_caption`, `image1_description`）。
  - `value`：字段值。
- **BOM 智能消除与解析**：`DataManager.parseCSV` 内置 UTF-8 BOM 自动剥离与转义引号解析，能够跨平台兼容 Windows Excel、Mac、Linux 生成的各种 CSV 格式。

### 3. 前后端数据流向与落盘机制

1. **前台页面初始化流程**：
   - 页面加载时，`DataManager.init()` 发起异步并发请求检查后端服务状态（`GET /api/status`）。
   - 若后端存在，立即获取最新的 `data/content.csv` 并解析到内存字典 `_csvContent`。
   - `renderPage()` 根据解析后的内容，动态生成产品矩阵、参数对标表格、客户案例墙及选型表单。
2. **后台修改与持久化落盘流程**：
   - 管理员在 `/admin.html` 中编辑文案或通过 Cropper.js 上传新图片。
   - 点击 **「保存所有更改 (直接落盘)」**：
     - 将配置序列化为标准 CSV 字符串，通过 `POST /api/save-content` 直接覆写服务器上的 `data/content.csv`。
     - 若包含 base64 裁剪图片，通过 `POST /api/save-image` 将二进制数据保存至 `images/` 目录，并自动替换为文件路径引用。
   - 彻底避免了纯前端静态页面“刷新后修改丢失”的痛点。

### 4. 多级高可用容错降级体系

网站设计了**三级数据降级机制**，确保在任何网络环境下均不会白屏：

> **读取优先级**：`localStorage (本地覆盖)` -> `content.csv (服务端最新)` -> `_loadDefaults (内置兜底字典)`

- **网络断网或纯静态环境**：当没有运行 Python 后端时，`DataManager` 会自动切换为离线模式，利用 `localStorage` 保存修改与离线询盘，页面依然完整可用。
- **缓存版本控制**：内置 `VERSION: "v3_magdrive_elite"` 机制，当系统升级时自动清理过期陈旧缓存，防止用户端出现样式或文案错乱。

---

## 📂 目录结构与文件说明

```text
magdrive-website/
├── website/                         # 网站源码根目录
│   ├── index.html                   # 官网前台入口页面
│   ├── admin.html                   # 网站可视化管理后台页面
│   ├── server.py                    # 轻量级 Python 后端服务（处理 API 与静态托管）
│   ├── README.md                    # 项目完整技术文档
│   ├── LICENSE                      # 开源许可证 (MIT)
│   ├── data/                        # 核心数据驱动目录
│   │   ├── content.csv              # 全站文本、板块与图片映射主数据文件 (UTF-8)
│   │   └── inquiries.json           # 在线工况选型表单提交记录
│   ├── css/                         # 样式文件目录
│   │   ├── style.css                # 核心样式（科技蓝主题、自适应网格、对标表等）
│   │   └── cropper.min.css          # 图片裁剪工具样式
│   ├── js/                          # 交互与数据逻辑目录
│   │   ├── data.js                  # 数据管理中心 (CSV解析、API交互、缓存控制)
│   │   ├── main.js                  # 前台渲染引擎 (DOM生成、画廊、抽屉导航、表单)
│   │   ├── admin.js                 # 管理后台控制器 (可视化编辑、Cropper集成、落盘)
│   │   └── cropper.min.js           # 轻量级图片裁剪库
│   ├── images/                      # 图像资产库
│   │   ├── logo.png                 # 官方矢量透明 Logo
│   │   ├── hero_pump_3d.png         # 3D 剖面高精度主泵展示图
│   │   ├── business_license.jpg     # 官方营业执照认证原件图
│   │   ├── client_*.png             # 权威客户 Logo (原子能院、中科院、中广核等)
│   │   └── *.svg / *.jpg            # 各板块产品、原理与工况示意图
│   └── deploy/                      # 生产环境部署辅助配置
│       ├── magdrive.service         # Linux Systemd 开机自启服务单元配置
│       ├── nginx-domain.conf        # Nginx 基于二级域名的 443 SSL 反代模版
│       ├── nginx-subpath.conf       # Nginx 基于子路径的反代模版
│       └── setup.sh                 # Linux 服务器一键自动化配置脚本
└── package.sh                       # 源码一键打包发布脚本
```

---

## ⚡ 快速开始与本地运行

本项目为零构建依赖架构，只需电脑安装了 **Python 3.6+** 即可一键运行：

### 1. 克隆或下载解压代码
```bash
git clone <仓库地址> magdrive-website
cd magdrive-website/website
```

### 2. 启动本地服务
```bash
# 默认监听 8080 端口（也可指定任意端口，例如 8090）
python3 server.py 8080
```
控制台将提示服务启动，并在浏览器中自动打开：
- 前台展示页：`http://localhost:8080`
- 后台管理页：`http://localhost:8080/admin.html`

---

## ⚙️ 管理后台与内容运维

- **访问路径**：`http://localhost:8080/admin.html`
- **默认凭据**：
  - 用户名：`admin`
  - 密　码：`123`
- **后台核心功能**：
  1. **网站全局设置**：快速修改网站主标题、副标题、导航栏项目、页脚版权声明、顶部导航栏背景色、Hero 区域主视觉背景等。
  2. **核心展示板块管理**：
     - **产品展示 (`product`)**：管理 850℃ 磁力泵、金属-陶瓷复合轴承、铅铋泵等产品图文，支持增加/删除卡片。
     - **性能参数 (`performance`)**：管理技术指标、CFD 自循环风冷与参数对标表。
     - **使用方法 (`usage`)**：管理安装规范、免水冷运行指引。
     - **应用工况 (`application`)**：管理四大应用场景、客户实绩墙与产学研体系。
  3. **联系信息与资质配置**：管理企业官方名称、统一社会信用代码、法定代表人、服务热线、邮箱及营业执照预览。
  4. **客户询盘管理（📩）**：查看所有通过前台表单提交的意向工况参数（包括客户姓名、电话、选型介质、温区及具体要求），支持按时间排序与一键导出。

---

## 🛠️ 二次开发与定制指引

### 修改品牌标识与主视觉
- **更换 Logo**：将您的透明背景 Logo 命名为 `logo.png` 并放置在 `images/` 目录下（或直接在 `/admin.html` 后台上传替换）。
- **更换 3D 主图**：将您的三维装备模型或核心产品图片放置在 `images/`，并在 `admin.html` 或 `data/content.csv` 中更新引用。

### 调整核心板块与文案
如需通过代码直接调整，可直接使用 VS Code、记事本等编辑器打开 `data/content.csv`，格式如下：
```csv
section,field,value
meta,site_title,您的公司名称
meta,site_subtitle,您的官方副标题与定位
product,section_title,您的核心产品系列
product,image1_caption,产品型号名称
product,image1_description,详细性能与技术优势介绍
```

### 扩展工况选型表单字段
如需增加新的表单字段（如“交货周期”、“预算区间”等）：
1. 在 `index.html` 或 `js/main.js` 的 `renderContactSection()` 中增加 `<input>` 或 `<select>`。
2. 在 `handleInquirySubmit(e)` 中提取字段并放入 `submitInquiry` 参数。
3. 后端 `server.py` 的 `/api/submit-inquiry` 会自动将所有接收到的 JSON 属性完整归档到 `data/inquiries.json`。

---

## 🚢 生产环境部署指南

### 方式一：Systemd 服务守护 + Nginx / NPM（推荐）

1. **部署文件到服务器**：
   ```bash
   sudo mkdir -p /var/www/magdrive
   sudo cp -r ./* /var/www/magdrive/
   ```
2. **注册开机自启守护进程**：
   ```bash
   sudo cp /var/www/magdrive/deploy/magdrive.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable magdrive
   sudo systemctl restart magdrive
   ```
3. **通过 Nginx Proxy Manager (NPM) 配置反向代理**：
   - 登录 NPM Web 控制台，添加 **Proxy Host**。
   - **Forward Hostname / IP**：填 `127.0.0.1`（或 Docker 网关 `172.17.0.1`）。
   - **Forward Port**：填 `8090`（与 `magdrive.service` 中配置一致）。
   - 在 **SSL** 标签页中申请 Let's Encrypt 证书并开启 **Force SSL**。

### 方式二：GitHub Webhook 全自动持续部署（CI/CD）

当您或协作成员将代码推送到 GitHub 仓库时，服务器将自动触发拉取并即时热更新前台：

1. **进入 GitHub 仓库后台**：
   依次点击 **Settings** -> **Webhooks** -> **Add webhook**。
2. **配置 Webhook 参数**：
   - **Payload URL**：`http://服务器IP:8090/api/webhook`（或您的自定义反代域名 `https://your-domain.com/api/webhook`）
   - **Content type**：选择 `application/json`
   - **Secret**：填写服务器端保存在 `data/webhook_secret.txt` 中的密钥（安全隔离，未提交至 Git）
   - **Which events would you like to trigger this webhook?**：选择 `Just the push event`
3. **完成配置**：点击 **Add webhook**，GitHub 将发送一次测试 ping，收到绿色对勾即表示连通！后续每次推送代码均会自动同步并在 `/admin.html` 的「GitHub 自动部署 🚀」面板中查看实时日志。

---

## 📄 开源协议

本项目基于 **[MIT 许可证](LICENSE)** 开源，您可以自由用于个人学习、商业公司官网展示、二次开发与项目分发。
