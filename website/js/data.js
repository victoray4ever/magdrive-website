/**
 * DataManager - 核心数据管理模块
 * 负责 CSV 解析、后端 API 同步、localStorage 存取、图片管理、管理员认证与询盘处理
 */
const DataManager = {
  VERSION: "v4_all_texts_editable",
  _csvContent: {},   // 从 CSV 文件加载的原始内容
  _overrides: {},   // localStorage 中的文字覆盖
  _imgOverrides: {}, // localStorage 中的图片覆盖 (base64 或 文件路径)
  _imgCounts: {},    // localStorage 中的图片数量覆盖
  _loaded: false,
  _hasBackend: false, // 是否连接到 Python 本地后端

  // 图片文件名前缀映射
  imagePrefix: {
    product: "product",
    performance: "perf",
    usage: "usage",
    application: "app"
  },

  // 默认精选高清装备与仿真图库
  defaultImages: {
    product: [
      "images/hero_pump_3d.png",
      "images/bearing_assembly.jpg",
      "images/pump_prototype_real.jpg",
      "images/pump_schematic.png"
    ],
    performance: [
      "images/rotor_magnetic_sim.png",
      "images/fan_cooling_cfd.jpg",
      "images/painpoint_long_shaft.png"
    ],
    usage: [
      "images/fan_cooling_structure.png",
      "images/rotor_structure.png",
      "images/bearing_outer.jpg"
    ],
    application: [
      "images/app-2.svg",
      "images/app-1.svg",
      "images/app-4.svg",
      "images/app-5.svg"
    ]
  },

  // 管理员凭据
  ADMIN_USER: "admin",
  ADMIN_PASS: "123",

  // localStorage 键名
  KEYS: {
    version: "bearing_data_ver",
    content: "bearing_content_overrides",
    images: "bearing_image_overrides",
    counts: "bearing_image_counts",
    session: "bearing_admin_session",
    inquiries: "bearing_offline_inquiries"
  },

  // 核心展示板块
  sections: ["product", "performance", "usage", "application"],

  sectionLabels: {
    product: "产品展示",
    performance: "性能参数",
    usage: "使用方法",
    application: "应用工况"
  },

  // ===== 全站可编辑文案目录 =====
  // 条目格式: [group, key, 后台显示名, 默认文案, 类型(text|textarea)]
  // group 与后台编辑位置的对应：
  //   hero / hero_stats / section_tags / cards / misc -> 「首页与通用文案」Tab
  //   （已废弃：原 compare 竞品对标表组、showcase 客户实绩墙组均已删除，
  //     表格与展示内容一律改由板块「内容块」承载，系统不再内置任何展示模板）
  //   contact_info / contact_form -> 联系信息 Tab
  _TEXTS_RAW: [
    // ---------- Hero 区 ----------
    ["hero", "hero_pre_title", "顶部小标语（脉冲圆点右侧）", "2026 淮安市高端人才精英赛答辩项目 · 能源核心装备国产替代"],
    ["hero", "hero_title", "主标题（换行直接回车，**文字** 表示渐变高亮）", "面向熔盐与液态金属输送的\n**高温磁力泵关键装备**研发及产业化", "textarea"],
    ["hero", "hero_desc", "主标题下技术说明段", "攻克 850℃ 超高温无磁钢驱动、金属-陶瓷复合轴承（国家发明专利 CN121382800A）与全静密封零泄漏核心技术，为光热储能、先进核能及高端化工提供本质安全动力保障。"],
    ["hero", "hero_badge_1", "亮点徽章 1", "🔥 突破 850℃ 耐温极限"],
    ["hero", "hero_badge_2", "亮点徽章 2", "🛡️ 全静密封 零泄漏"],
    ["hero", "hero_badge_3", "亮点徽章 3", "📜 发明专利复合轴承"],
    ["hero", "hero_badge_4", "亮点徽章 4", "⚡ 轴长 1.5m 替代 20m"],
    ["hero", "hero_btn_1", "行动按钮 1 文字（跳转：产品展示）", "🌟 探索核心技术"],
    ["hero", "hero_btn_2", "行动按钮 2 文字（跳转：参数对标表）", "📊 参数对标国际巨头"],
    ["hero", "hero_btn_3", "行动按钮 3 文字（跳转：联系我们）", "📋 工况在线选型"],
    ["hero", "hero_tag_top", "右侧装备卡片 · 上方浮动标签", "轴长仅 1.5m · 告别 20m 传统长轴"],
    ["hero", "hero_tag_bottom", "右侧装备卡片 · 下方浮动标签", "金属-陶瓷复合轴承 · 寿命提升 10 倍"],
    ["hero", "hero_card_hint", "右侧装备卡片悬浮提示", "点击查看高清装备模型大图"],

    // ---------- Hero 五大核心指标看板 ----------
    ["hero_stats", "stat_1_val", "指标1 数值", "850"],
    ["hero_stats", "stat_1_unit", "指标1 单位", "℃"],
    ["hero_stats", "stat_1_label", "指标1 名称", "突破行业耐温极限"],
    ["hero_stats", "stat_1_sub", "指标1 说明", "传统磁力泵极限≤350℃"],
    ["hero_stats", "stat_2_val", "指标2 数值", "0"],
    ["hero_stats", "stat_2_unit", "指标2 单位", "泄漏"],
    ["hero_stats", "stat_2_label", "指标2 名称", "全静密封本质安全"],
    ["hero_stats", "stat_2_sub", "指标2 说明", "从源头杜绝高温介质起火"],
    ["hero_stats", "stat_3_val", "指标3 数值", "10"],
    ["hero_stats", "stat_3_unit", "指标3 单位", "倍+"],
    ["hero_stats", "stat_3_label", "指标3 名称", "复合轴承耐磨寿命"],
    ["hero_stats", "stat_3_sub", "指标3 说明", "发明专利 CN121382800A"],
    ["hero_stats", "stat_4_val", "指标4 数值", "80"],
    ["hero_stats", "stat_4_unit", "指标4 单位", "%↓"],
    ["hero_stats", "stat_4_label", "指标4 名称", "高温合金用量节约"],
    ["hero_stats", "stat_4_sub", "指标4 说明", "整机造价降低 50% 以上"],
    ["hero_stats", "stat_5_val", "指标5 数值", "23"],
    ["hero_stats", "stat_5_unit", "指标5 单位", "台+"],
    ["hero_stats", "stat_5_label", "指标5 名称", "国家级院所供货实绩"],
    ["hero_stats", "stat_5_sub", "指标5 说明", "中国原子能院/中科院/中广核"],

    // ---------- 各板块顶部小标签 ----------
    ["section_tags", "section_tag_product", "产品展示 · 板块小标签", "PRODUCT PORTFOLIO · 核心特种流体装备"],
    ["section_tags", "section_tag_performance", "性能参数 · 板块小标签", "TECHNICAL SPECIFICATIONS · 性能指标与参数对标"],
    ["section_tags", "section_tag_usage", "使用方法 · 板块小标签", "INSTALLATION & O&M · 标准安装与全生命周期运维"],
    ["section_tags", "section_tag_application", "应用工况 · 板块小标签", "STRATEGIC SCENARIOS · 四大战略应用场景与实绩"],
    ["section_tags", "contact_tag", "联系我们 · 板块小标签", "GET IN TOUCH & ENGINEERING SUPPORT"],

    // ---------- 卡片通用文字 ----------
    ["cards", "zoom_hint", "卡片悬浮角标提示", "🔍 点击全屏预览"],
    ["cards", "card_click_hint", "卡片悬浮提示（title 属性）", "点击查看高清大图及结构细节"],

    // ---------- 杂项 ----------
    ["misc", "title_suffix", "浏览器标签页标题后缀", " - MagDrive 高温磁力泵与关键装备"],
    ["misc", "admin_link", "顶部「管理后台」链接文字", "管理后台"],
    ["misc", "mobile_nav_title", "移动端抽屉导航标题", "网站导航"],
    ["misc", "mobile_admin_link", "移动端「进入管理后台」链接文字", "进入管理后台"],

    // ---------- 联系板块附加文字 ----------
    ["contact_info", "contact_phone_label", "联系条目1 标题（电话）", "技术咨询 / 销售热线"],
    ["contact_info", "contact_email_label", "联系条目2 标题（邮箱）", "技术选型与商务邮箱"],
    ["contact_info", "contact_email_extra", "邮箱附加展示（可留空）", "djw@neu.edu.cn"],
    ["contact_info", "contact_address_label", "联系条目3 标题（地址）", "产业化核心基地"],
    ["contact_info", "contact_hours_label", "联系条目4 标题（时间）", "技术支持响应时间"],
    ["contact_info", "contact_hours_note", "服务时间附加说明（可留空）", "(紧急工况2小时极速响应)"],
    ["contact_info", "contact_credit_label", "联系条目5 标题（信用代码）", "统一社会信用代码"],
    ["contact_info", "license_title", "营业执照卡片标题", "国家市场监督管理总局监制 · 正规营业执照"],
    ["contact_info", "license_sub_template", "营业执照卡片说明（支持 {legal_person} {registered_capital} 占位符）", "法定代表人: {legal_person} · 注册资本: {registered_capital} (点击查看原件)"],
    ["contact_info", "license_caption_template", "执照大图标题（支持 {company} 占位符）", "{company} - 营业执照官方资质认证"],
    ["contact_info", "license_desc_template", "执照大图说明（支持 {credit_code} {legal_person} {registered_capital} 占位符）", "统一社会信用代码: {credit_code} | 法定代表人: {legal_person} | 注册资本: {registered_capital} | 发证机关: 淮安经济技术开发区行政审批局"],

    // ---------- 选型表单文字 ----------
    ["contact_form", "form_label_name", "表单 · 姓名字段标签", "您的姓名 / 称呼"],
    ["contact_form", "form_ph_name", "表单 · 姓名占位提示", "例如：张总 / 李总工"],
    ["contact_form", "form_label_contact", "表单 · 联系方式字段标签", "联系电话 / 微信"],
    ["contact_form", "form_ph_contact", "表单 · 联系方式占位提示", "例如：13800000000"],
    ["contact_form", "form_label_email", "表单 · 邮箱字段标签", "电子邮箱"],
    ["contact_form", "form_ph_email", "表单 · 邮箱占位提示", "例如：engineer@company.com"],
    ["contact_form", "form_label_company", "表单 · 单位字段标签", "单位 / 企业名称"],
    ["contact_form", "form_ph_company", "表单 · 单位占位提示", "例如：某某能源装备 / 化工研究院"],
    ["contact_form", "form_label_product", "表单 · 介质类型字段标签", "输送介质类型"],
    ["contact_form", "form_label_temp", "表单 · 温度区间字段标签", "运行温度区间"],
    ["contact_form", "form_label_message", "表单 · 需求描述字段标签", "工况参数与技术要求 (流量 m³/h、扬程 m、耐压、介质密度等)"],
    ["contact_form", "form_ph_message", "表单 · 需求描述占位提示", "请简要描述您的工程需求，例如：需要565℃二元熔盐主循环泵，流量150m³/h，扬程60m，要求全静密封零泄漏..."],
    ["contact_form", "form_product_options", "表单 · 介质类型下拉选项（每行一个）", "高温二元熔盐 (565℃ 光热/储能)\n液态铅铋合金 (LBE 480~550℃ 先进核能)\n液态锂铅合金 (聚变堆包层回路)\n高温强酸强碱 / 腐蚀性介质 (化工)\n高温熔融金属 / 熔渣 (冶金)\n耐高温金属-陶瓷复合轴承配套 (专利)\n其他极端工况定制", "textarea"],
    ["contact_form", "form_temp_options", "表单 · 温度区间下拉选项（每行一个，* 开头为默认选中）", "350℃ ~ 500℃ (中高温工况)\n*500℃ ~ 650℃ (典型熔盐/铅铋工况)\n650℃ ~ 850℃ (极限超高温工况)\n350℃ 以下 (常规特种流体)", "textarea"],
    ["contact_form", "form_submit_text", "提交按钮文字", "🚀 提交工况选型需求，获取技术方案与报价"],
    ["contact_form", "form_submitting_text", "提交中按钮文字", "⏳ 正在提交需求..."],
    ["contact_form", "form_success_msg", "提交成功提示", "🎉 需求已成功提交！我们的技术专家将在2小时内与您联系对接技术方案。"],
    ["contact_form", "form_error_msg", "提交失败提示（支持 {phone} 占位符）", "提交失败，请重试或直接致电 {phone}: "]
  ],

  // 文案分组在后台的显示名称
  textGroupLabels: {
    hero: "Hero 首屏文案",
    hero_stats: "Hero 五大核心指标看板",
    section_tags: "各板块顶部小标签",
    cards: "图片卡片通用文字",
    misc: "页面杂项文字",
    contact_info: "联系板块附加文字",
    contact_form: "在线选型表单文字"
  },

  // ===== CSV 解析（完整状态机，支持带引号的多行字段） =====
  parseCSV(text) {
    if (!text) return [];
    text = String(text).replace(/^\ufeff/, ""); // 移除 UTF-8 BOM
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } // 转义的引号
          else { inQuotes = false; }
        } else {
          field += ch; // 引号内的换行、逗号均视为字段内容
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          row.push(field); field = "";
        } else if (ch === "\n") {
          row.push(field); field = "";
          rows.push(row); row = [];
        } else if (ch === "\r") {
          // 忽略回车符
        } else {
          field += ch;
        }
      }
    }
    // 收尾：处理最后一行
    if (field !== "" || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    // 过滤空行与注释行
    return rows.filter(r => r.length > 0 && r.join("").trim() !== "" && !String(r[0] || "").startsWith("#"));
  },

  // CSV 转文本（用于导出或保存）
  toCSV(rows) {
    return rows.map(row =>
      row.map(cell => {
        const str = String(cell ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(",")
    ).join("\n");
  },

  // 生成当前所有配置的 CSV 文本
  getCSVString() {
    const rows = [];
    rows.push(["section", "field", "value"]);
    // meta
    rows.push(["meta", "site_title", this.getValue("meta", "site_title")]);
    rows.push(["meta", "site_subtitle", this.getValue("meta", "site_subtitle")]);
    rows.push(["meta", "header_bg_color", this.getValue("meta", "header_bg_color")]);
    rows.push(["meta", "hero_bg_color", this.getValue("meta", "hero_bg_color")]);
    rows.push(["meta", "hero_title_color", this.getValue("meta", "hero_title_color")]);
    rows.push(["meta", "nav_text", this.getValue("meta", "nav_text")]);
    rows.push(["meta", "footer_text", this.getValue("meta", "footer_text")]);
    // meta 图片字段（logo / 首页背景图 / 首页装备主图 / license / 各板块背景图）
    // 仅导出已落盘的路径形式；base64 由 saveToServer 的 /api/save-image 落盘后再写入 CSV
    const metaImageDefaults = this.META_IMAGE_DEFAULTS || {};
    this.META_IMAGE_KEYS.forEach(k => {
      const v = this.getMetaImage(k);
      if (v && !String(v).startsWith("data:image/") && v !== metaImageDefaults[k]) {
        rows.push(["meta", k, String(v).split("?t=")[0]]);
      }
    });
    // 后台标签栏名称：仅导出被自定义过的项（保持默认的标签不写入 CSV，避免污染配置文件）
    const adminTabDefaults = this.ADMIN_TAB_DEFAULTS || {};
    (this.ADMIN_TAB_ORDER || []).forEach(tabId => {
      const v = this.getValue("meta", "admin_tab_" + tabId);
      if (v && v !== adminTabDefaults[tabId]) {
        rows.push(["meta", "admin_tab_" + tabId, v]);
      }
    });
    // 各板块（内容块为唯一数据源；image_count 仅为兼容保留，等于图片块数量）
    this.sections.forEach(section => {
      const blocks = this.getBlocks(section);
      rows.push([section, "section_title", this.getValue(section, "section_title")]);
      rows.push([section, "section_description", this.getValue(section, "section_description")]);
      rows.push([section, "text_position", this.getValue(section, "text_position") || "above"]);
      rows.push([section, "image_count", String(blocks.filter(b => b.t === "image").length)]);
      rows.push([section, "blocks", JSON.stringify(blocks)]);
    });
    // contact
    rows.push(["contact", "section_title", this.getValue("contact", "section_title")]);
    rows.push(["contact", "section_description", this.getValue("contact", "section_description")]);
    rows.push(["contact", "company_name", this.getValue("contact", "company_name")]);
    rows.push(["contact", "phone", this.getValue("contact", "phone")]);
    rows.push(["contact", "email", this.getValue("contact", "email")]);
    rows.push(["contact", "address", this.getValue("contact", "address")]);
    rows.push(["contact", "hours", this.getValue("contact", "hours")]);
    rows.push(["contact", "form_title", this.getValue("contact", "form_title")]);
    rows.push(["contact", "form_subtitle", this.getValue("contact", "form_subtitle")]);
    rows.push(["contact", "credit_code", this.getValue("contact", "credit_code")]);
    rows.push(["contact", "legal_person", this.getValue("contact", "legal_person")]);
    rows.push(["contact", "registered_capital", this.getValue("contact", "registered_capital")]);

    // 全站可编辑文案
    this.TEXTS.forEach(t => {
      rows.push(["texts", t.key, this.getValue("texts", t.key)]);
    });

    return this.toCSV(rows);
  },

  // ===== 导出 CSV 文件（浏览器下载，带 UTF-8 BOM 以兼容 Excel）=====
  exportCSV(filenamePrefix) {
    const csvText = this.getCSVString();
    const blob = new Blob(["\ufeff" + csvText], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = (filenamePrefix || "content") + "_" + dateStr + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return { success: true, message: "CSV 文件已导出下载" };
  },

  // ===== 探测后端状态 =====
  async checkBackend() {
    try {
      const res = await fetch("/api/status", { method: "GET", cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        this._hasBackend = !!json.has_backend;
      } else {
        this._hasBackend = false;
      }
    } catch {
      this._hasBackend = false;
    }
    return this._hasBackend;
  },

  // ===== 加载内容 =====
  async init() {
    if (this._loaded) return;
    await this.checkBackend();

    // 检查缓存版本，若为旧版本则主动清理过期覆盖
    const localVer = localStorage.getItem(this.KEYS.version);
    if (localVer !== this.VERSION) {
      localStorage.removeItem(this.KEYS.content);
      localStorage.removeItem(this.KEYS.counts);
      localStorage.setItem(this.KEYS.version, this.VERSION);
    }

    // 1. 先载入内置完整默认值
    this._loadDefaults();

    // 2. 尝试从 CSV 文件加载
    try {
      const resp = await fetch("data/content.csv?t=" + Date.now());
      if (resp.ok) {
        const text = await resp.text();
        const rows = this.parseCSV(text);
        rows.forEach(row => {
          if (row.length >= 3) {
            const [section, field, value] = row;
            if (!this._csvContent[section]) this._csvContent[section] = {};
            this._csvContent[section][field] = value;
          }
        });
      }
    } catch (e) {
      console.warn("CSV 加载失败，使用内置默认值", e);
    }

    // 3. 加载 localStorage 覆盖
    try {
      this._overrides = JSON.parse(localStorage.getItem(this.KEYS.content) || "{}");
      this._imgOverrides = JSON.parse(localStorage.getItem(this.KEYS.images) || "{}");
      this._imgCounts = JSON.parse(localStorage.getItem(this.KEYS.counts) || "{}");
    } catch (e) {
      this._overrides = {}; this._imgOverrides = {}; this._imgCounts = {};
    }

    // 注：原「竞品参数对标表」内置模板与它的一次性迁移均已移除。
    // 表格一律由后台内容块自行添加，系统不再自动向任何板块注入表格。

    this._loaded = true;
  },

  _loadDefaults() {
    // 全站可编辑文案默认值（来自 TEXTS 目录）
    const texts = {};
    this.TEXTS.forEach(t => { texts[t.key] = t.def; });

    this._csvContent = {
      texts: texts,
      meta: {
        site_title: "迈德瑞（淮安）智能装备科技有限公司",
        site_subtitle: "MagDrive · 面向熔盐与液态金属输送的高温磁力泵关键装备研发与产业化",
        header_bg_color: "#0a2540",
        hero_bg_color: "#0d3880",
        hero_title_color: "#ffffff",
        nav_text: "产品展示,性能参数,使用方法,应用工况,联系我们",
        footer_text: "© 2026 迈德瑞（淮安）智能装备科技有限公司. All Rights Reserved. 统一社会信用代码: 91320891MAKML1457M"
      },
      product: {
        section_title: "核心特种流体装备与专利技术产品",
        section_description: "攻克超高温、全静密封、耐磨陶瓷轴承等“卡脖子”技术，专注于为光热储能、先进核能、高端化工及特种冶金提供本质安全关键装备",
        text_position: "above",
        image_count: "4",
        image1_caption: "超高温熔盐磁力泵 (最高耐温 850℃)",
        image1_description: "全静密封零泄漏设计，从源头杜绝高温退磁与火灾风险，轴长仅1.5米替代传统20米长轴泵，合金用量减少80%，单台造价降本50%+",
        image1_badge: "🔥 耐温 850℃",
        image2_caption: "金属-陶瓷复合轴承 (发明专利号: CN121382800A)",
        image2_description: "独家发明专利王牌产品，通过结构性复合攻克金属与陶瓷膨胀系数差异，500℃高温硬度达2400~2700 HV，耐磨寿命提升10倍以上",
        image2_badge: "📜 发明专利 CN121382800A",
        image3_caption: "先进核能高温铅铋泵 / 锂铅合金泵",
        image3_description: "专用于加速器次临界堆 (CiADS) 与第四代铅冷快堆回路，耐受480℃~550℃强辐射与高腐蚀，已批量交付中国原子能研究院",
        image3_badge: "⚛️ 核能重大工程",
        image4_caption: "特种工况超高温阀门与流体测控集成",
        image4_description: "超高温盲板阀、高温高压烟道挡板及传感器智能化测控系统，提供高温特种流体输送成套工程解决方案",
        image4_badge: "⚙️ 智能化测控"
      },
      performance: {
        section_title: "核心技术指标与国内外主流竞品综合对标",
        section_description: "三大关键技术突破：内外转子无磁钢驱动、金属-陶瓷复合轴承、全静密封+CFD自循环风冷，在耐温、安全与经济性上全面超越国内外竞品",
        text_position: "above",
        image_count: "3",
        image1_caption: "内外转子无磁钢驱动磁仿真与耐温特性",
        image1_description: "外转子交替磁路与铁磁内转子相位差扭矩传递，突破行业350℃退磁瓶颈，实现850℃超高温稳定连续运转",
        image1_badge: "⚡ 无磁钢内转子",
        image2_caption: "CFD 热流耦合与外转子风扇轮毂自散热",
        image2_description: "电机带动外转子顶端风扇轮毂高速自旋转，小气隙大流速强制风冷，摆脱复杂外部冷却水系统与水处理成本",
        image2_badge: "💨 CFD 自循环风冷",
        image3_caption: "传统长轴泵轴系共振与轴承磨损痛点对比",
        image3_description: "传统熔盐泵长达20米、9个导轴承极易热变形振动超标与烧瓦；迈德瑞仅1.5米紧凑轴长与2个复合轴承，振动极小",
        image3_badge: "⚠️ 传统长轴痛点解决"
      },
      usage: {
        section_title: "标准安装指引、免水冷运行与全生命周期运维",
        section_description: "颠覆性紧凑结构大幅简化现场吊装与管路对接，全静密封与自循环风冷实现免日常维护，显著降低全生命周期综合成本",
        text_position: "above",
        image_count: "3",
        image1_caption: "紧凑型模块化安装与空间节省指引",
        image1_description: "整机轴长仅1.5米，无需传统20米长轴泵的高耸钢构支架与大型吊装作业，大幅减少占地面积与土建安装工程量",
        image1_badge: "📐 轴长仅 1.5m 紧凑安装",
        image2_caption: "自循环风冷无水运行与环境适应规范",
        image2_description: "启动即自散热，无需外接冷却水泵、冷却塔与水处理管路，避免北方严寒结冰与缺水地区冷却受限，可靠性极高",
        image2_badge: "💧 免外部冷却水",
        image3_caption: "静密封隔离套与复合轴承长效巡检规范",
        image3_description: "隔离套静态密封承压可靠，金属-陶瓷复合轴承硬度高达HV 2700且间隙恒定，理论实现无限运行寿命与极低故障率",
        image3_badge: "🛡️ 理论无限寿命"
      },
      application: {
        section_title: "四大战略应用场景与国家重大项目供货实绩",
        section_description: "深度契合国家“双碳”战略与新质生产力，核心装备已在光热储能、先进核能、高端化工及特种冶金等重大工程中批量稳定运行",
        text_position: "above",
        image_count: "4",
        image1_caption: "光热储能 (CSP) —— 565℃ 熔盐吸热与储能主循环",
        image1_description: "适配塔式/槽式光热电站565℃高温二元熔盐主循环回路，解决传统泵低效易漏短板，保障储能电站连续安全运转",
        image1_badge: "☀️ 光热储能 565℃",
        image2_caption: "先进核能 (Nuclear) —— CiADS 次临界铅铋堆与聚变回路",
        image2_description: "中国原子能院已供货12台高温铅铋泵、中科院合肥院供货2台，适配480℃~550℃核反应堆一/二回路冷却剂循环",
        image2_badge: "⚛️ 先进核能 (已供12台)",
        image3_caption: "高端化工 (Chemical) —— 350~400℃ 强腐蚀工艺输送",
        image3_description: "适用于有机合成与精细化工高温熔盐换热及强酸强碱介质输送，全静密封杜绝危化品挥发与介质污染",
        image3_badge: "🧪 精细化工强腐蚀",
        image4_caption: "特种冶金 (Metallurgy) —— 高温熔体与熔渣特种转移",
        image4_description: "耐受高温熔液磨损与严苛腐蚀，在山东豪迈集团已供货7台并批量稳定运行，大幅提高产线连续作业率",
        image4_badge: "🏭 冶金熔渣 (已供7台)"
      },
      contact: {
        section_title: "联系我们 & 工况参数在线选型定制",
        section_description: "迈德瑞技术专家团队为您提供 850℃ 超高温磁力泵与金属-陶瓷复合轴承选型支持、图纸对接与极速技术方案定制",
        company_name: "迈德瑞（淮安）智能装备科技有限公司",
        phone: "400-888-9999 / 0517-88886666",
        email: "sales@magdrive-tech.com",
        address: "江苏省淮安经济技术开发区南马厂街道内湖路82号经管站103室",
        hours: "周一至周五 08:30 - 18:00",
        form_title: "在线技术咨询与工况参数选型定制",
        form_subtitle: "请提交您的介质类型 (熔盐/液态金属/强酸碱)、运行温区、流量扬程或技术要求，工程师团队2小时内对接",
        credit_code: "91320891MAKML1457M",
        legal_person: "张剑",
        registered_capital: "450万元整"
      }
    };
  },

  // ===== 获取/设置值 =====
  // 取值优先级设计：
  //  - 已连接 Python 后端时：磁盘 data/content.csv 为权威来源。手动用记事本/VS Code 编辑
  //    content.csv 后，刷新页面立即生效，不会被浏览器里陈旧的 localStorage 覆盖遮蔽。
  //  - 纯静态 / 离线模式：浏览器 localStorage 覆盖优先（此时它是唯一的持久化载体）。
  getValue(section, field) {
    const key = section + "." + field;
    const csvVal = this._csvContent[section] ? this._csvContent[section][field] : undefined;
    const overrideVal = this._overrides[key];
    const hasCSV = csvVal !== undefined && csvVal !== null && csvVal !== "";
    const hasOverride = overrideVal !== undefined && overrideVal !== null && overrideVal !== "";

    if (this._hasBackend) {
      if (hasCSV) return csvVal;
      if (hasOverride) return overrideVal;
      return "";
    }
    if (hasOverride) return overrideVal;
    if (hasCSV) return csvVal;
    return "";
  },

  // 与 getValue 完全相同的取值优先级，但**不做空值归一**：
  //  - 字段从未配置过 → 返回 undefined（调用方可以据此兜默认值）
  //  - 字段被显式留空（CSV 里是空串）→ 返回 ""（调用方必须原样保留，不能兜默认值）
  // 用途：后台编辑器渲染输入框时区分这两种情况。若一律用 `getValue(...) || 默认值`，
  //      用户把某字段清空后一保存，默认值又会被写回去，表现为「怎么删都删不掉」。
  getStoredValue(section, field) {
    const key = section + "." + field;
    const csvVal = this._csvContent[section] ? this._csvContent[section][field] : undefined;
    const overrideVal = this._overrides[key];
    const hasCSV = csvVal !== undefined && csvVal !== null;
    const hasOverride = overrideVal !== undefined && overrideVal !== null;

    if (this._hasBackend) {
      if (hasCSV) return csvVal;
      return hasOverride ? overrideVal : undefined;
    }
    if (hasOverride) return overrideVal;
    return hasCSV ? csvVal : undefined;
  },

  setValue(section, field, value) {
    const key = section + "." + field;
    this._overrides[key] = value;
    // 同步写入运行时内存字典，确保「后端模式下以 CSV 优先」时能立刻读到刚修改的值
    if (!this._csvContent[section]) this._csvContent[section] = {};
    this._csvContent[section][field] = value;
    this._saveOverrides();
  },

  _saveOverrides() {
    try {
      localStorage.setItem(this.KEYS.content, JSON.stringify(this._overrides));
    } catch (e) {
      console.error("保存覆盖配置失败:", e);
    }
  },

  // ===== 板块内容块（图片块 / 表格块，可自由增删与排序）=====
  // 存储格式：CSV 中一行 `section,blocks,<JSON 数组>`（JSON.stringify 不产生真实换行，CSV 安全）。
  // 块结构：
  //   图片块 { t:'image', id, slot, src, caption, desc, badge, w, h, fit }
  //     w/h 显示宽高（纯数字自动补 px，支持 %）；fit = cover|contain（裁切填满 / 完整缩放）
  //   表格块 { t:'table', id, title, subtitle, head:[...], rows:[[...]], hl:高亮列索引 }
  // 兼容：若 CSV 尚无 blocks 字段，则按旧的 image_count + imageN_* 字段就地迁移为图片块，
  //      迁移结果写回内存字典，下次保存即以 blocks 结构落盘（旧字段自然淘汰）。

  // 规范化自定义尺寸：纯数字补 px（浏览器不认无单位长度，填「200」等价于 200px）；
  // 空值 / auto 返回 ""（表示不限制，走默认自适应）
  normalizeCssSize(v) {
    const s = String(v == null ? "" : v).trim();
    if (!s || s === "auto" || s === "0") return "";
    if (/^-?\d+(\.\d+)?$/.test(s)) return s + "px";
    return s;
  },

  // 生成一个板块内唯一 id（同一板块内不重复即可）
  // ★ 必须传入「当前正在编辑的块列表」：连续添加多个块时新块尚未写回 DataManager，
  //   若只按磁盘/内存状态计算，多次添加会得到同一个 id，进而导致
  //   「上传一张图，同 id 的其它块全部跟着变」（图片覆盖字典以 section.bk<id> 为 key）
  newBlockId(section, existingList) {
    const list = Array.isArray(existingList) ? existingList : this.getBlocks(section);
    return this._uniqueBlockId(list);
  },

  // 依据已用 id 集合生成下一个可用 id（只在 list 内部查重，不触碰 DataManager 状态）
  _uniqueBlockId(list) {
    const used = {};
    (Array.isArray(list) ? list : []).forEach(b => { if (b && b.id) used[String(b.id)] = 1; });
    let n = 1;
    while (used["b" + n]) n++;
    return "b" + n;
  },

  // 保证块 id 在同一板块内唯一：历史数据可能出现重复 id（早期连续添加块的缺陷产物），
  // 重复 id 会让图片覆盖字典 / 落盘路径相互串号，这里在读取时就地校正（只改 id，不动 src 等数据）
  _ensureUniqueIds(list) {
    if (!Array.isArray(list)) return list;
    const used = {};
    list.forEach(b => {
      if (b && (!b.id || used[String(b.id)])) b.id = this._uniqueBlockId(list);
      if (b && b.id) used[String(b.id)] = 1;
    });
    return list;
  },

  _normalizeBlock(b) {
    const blk = b && typeof b === "object" ? b : {};
    const type = blk.t === "table" ? "table" : "image";
    const base = { t: type, id: blk.id || "" };
    if (type === "image") {
      return {
        t: "image",
        id: base.id,
        slot: blk.slot || 0,
        src: blk.src || "",
        caption: blk.caption || "",
        desc: blk.desc || "",
        badge: blk.badge || "",
        w: blk.w || "",
        h: blk.h || "",
        fit: blk.fit === "contain" ? "contain" : "cover"
      };
    }
    return {
      t: "table",
      id: base.id,
      title: blk.title || "",
      subtitle: blk.subtitle || "",
      head: Array.isArray(blk.head) ? blk.head.map(v => String(v || "")) : [],
      rows: Array.isArray(blk.rows) ? blk.rows.map(r => (Array.isArray(r) ? r.map(v => String(v || "")) : [])) : [],
      // hl = 高亮列索引（0 起）；-1 表示「不高亮」。缺省才回落到 1，避免强制套用模板样式
      hl: (parseInt(blk.hl, 10) === 0 || parseInt(blk.hl, 10) > 0 || parseInt(blk.hl, 10) === -1) ? parseInt(blk.hl, 10) : 1,
      from: blk.from || ""
    };
  },

  // 旧结构（image_count + imageN_*）迁移为图片块数组
  _migrateLegacyBlocks(section) {
    const count = this.getImageCount(section);
    const blocks = [];
    for (let i = 1; i <= count; i++) {
      blocks.push({
        t: "image",
        id: "m" + i,
        slot: i,
        src: "",
        caption: this.getValue(section, "image" + i + "_caption") || "",
        desc: this.getValue(section, "image" + i + "_description") || "",
        badge: this.getValue(section, "image" + i + "_badge") || "",
        w: "",
        h: "",
        fit: "cover"
      });
    }
    return blocks;
  },

  // 读取某板块的内容块（无 blocks 字段时自动迁移并缓存到内存，供本次渲染与保存使用）
  getBlocks(section) {
    const raw = this.getValue(section, "blocks");
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        // 读取时就地校正重复 id，避免历史数据里同 id 的块互相串图
        if (Array.isArray(arr)) return this._ensureUniqueIds(arr.map(b => this._normalizeBlock(b)));
      } catch (e) {
        console.warn("[" + section + "] blocks 解析失败，回退旧图片结构:", e);
      }
    }
    const migrated = this._ensureUniqueIds(this._migrateLegacyBlocks(section));
    if (!this._csvContent[section]) this._csvContent[section] = {};
    this._csvContent[section]["blocks"] = JSON.stringify(migrated);
    return migrated;
  },

  setBlocks(section, blocks) {
    const list = this._ensureUniqueIds(Array.isArray(blocks) ? blocks.map(b => this._normalizeBlock(b)) : []);
    this.setValue(section, "blocks", JSON.stringify(list));
  },

  // 图片块的实际展示地址：
  //   1) 刚上传尚未落盘（纯静态模式）时在 _imgOverrides 中的 base64 / 路径
  //   2) 块上显式记录的 src（已落盘路径）
  //   3) 旧槽位图（保证历史图片不丢）
  getBlockImageUrl(section, block) {
    if (block && block.id) {
      const ov = this._imgOverrides[section + ".bk" + block.id];
      if (ov && String(ov).startsWith("data:image/")) return ov;
      // 已落盘的覆盖路径：块自身 src 丢失时（历史缺陷产物）也能把图显示出来
      if (ov && !block.src && String(ov).startsWith("images/")) return String(ov).split("?t=")[0];
    }
    if (block && block.src) return block.src;
    if (block && block.slot) return this.getImageUrl(section, block.slot);
    return this.getImageUrl(section, 1);
  },

  // 图片落盘后把路径写回对应内容块（key 形如 section.bk<id>）
  _setBlockImagePath(section, subKey, path) {
    if (!String(subKey).startsWith("bk")) return;
    const id = String(subKey).slice(2);
    const blocks = this.getBlocks(section);
    let hit = false;
    // 只回填第一个匹配项：万一出现重复 id，也不会把同一路径写进多个块
    for (const b of blocks) {
      if (b.t === "image" && b.id === id) { b.src = path; hit = true; break; }
    }
    if (hit) {
      if (!this._csvContent[section]) this._csvContent[section] = {};
      this._csvContent[section]["blocks"] = JSON.stringify(blocks);
    }
  },

  // ===== 图片数量管理 =====
  getImageCount(section) {
    const fromCSV = this.getValue(section, "image_count");
    const csvCount = (fromCSV !== "" && !isNaN(parseInt(fromCSV))) ? parseInt(fromCSV) : null;
    const localRaw = this._imgCounts[section];
    const localCount = (localRaw !== undefined && localRaw !== "") ? parseInt(localRaw) : null;

    if (this._hasBackend && csvCount !== null) return csvCount;
    if (localCount !== null && !isNaN(localCount)) return localCount;
    if (csvCount !== null) return csvCount;
    if (this.defaultImages[section]) return this.defaultImages[section].length;
    return 0;
  },

  setImageCount(section, count) {
    this._imgCounts[section] = count;
    // 同步内存字典中的 image_count，保证导出的 CSV 与页面读取一致
    if (!this._csvContent[section]) this._csvContent[section] = {};
    this._csvContent[section]["image_count"] = String(count);
    try {
      localStorage.setItem(this.KEYS.counts, JSON.stringify(this._imgCounts));
    } catch (e) {
      console.error("保存图片数量失败:", e);
    }
  },

  // ===== 图片 URL 管理 =====
  getImageUrl(section, index) {
    const key = section + "." + index;
    if (this._imgOverrides[key]) return this._imgOverrides[key];
    if (this.defaultImages[section] && this.defaultImages[section][index - 1]) {
      return this.defaultImages[section][index - 1];
    }
    const prefix = this.imagePrefix[section] || section;
    return "images/" + prefix + "-" + index + ".svg";
  },

  saveImage(section, index, base64) {
    const key = section + "." + index;
    this._imgOverrides[key] = base64;
    try {
      localStorage.setItem(this.KEYS.images, JSON.stringify(this._imgOverrides));
    } catch (e) {
      console.warn("localStorage 存储失败，尝试清理旧图片数据", e);
      try {
        this._imgOverrides = {};
        this._imgOverrides[key] = base64;
        localStorage.setItem(this.KEYS.images, JSON.stringify(this._imgOverrides));
      } catch (e2) {
        console.error("localStorage 存储仍然失败", e2);
      }
    }
  },

  removeImage(section, index) {
    const key = section + "." + index;
    delete this._imgOverrides[key];
    try {
      localStorage.setItem(this.KEYS.images, JSON.stringify(this._imgOverrides));
    } catch (e) {
      console.error("移除图片失败:", e);
    }
  },

  // ===== 全局图片管理（logo、hero背景图、板块背景图）=====
  // 取值优先级与 getValue 保持一致：
  //  - 后端模式：磁盘 CSV 权威（记事本改 content.csv 刷新即生效）→ localStorage 覆盖 → 内置默认
  //  - 纯静态模式：localStorage 覆盖（唯一持久化载体）→ CSV → 内置默认
  getMetaImage(key) {
    const imgKey = "meta." + key;
    const ov = this._imgOverrides[imgKey];
    const csvVal = this.getValue("meta", key);
    if (this._hasBackend) {
      if (csvVal) return csvVal;
      if (ov) return ov;
    } else {
      if (ov) return ov;
      if (csvVal) return csvVal;
    }
    if (key === "logo") return "images/logo.png";
    if (key === "hero_image") return "images/hero_pump_3d.png";
    // license 不再内置默认值：未上传营业执照时返回 null，前台对应卡片自动隐藏
    return null;
  },

  saveMetaImage(key, base64) {
    this.saveImage("meta", key, base64);
  },

  removeMetaImage(key) {
    this.removeImage("meta", key);
    // 同步清空 CSV / 覆盖字典中的持久化引用，否则磁盘值会一直生效导致"删除无效"
    this.setValue("meta", key, "");
  },

  // ===== 服务端保存与落盘 =====
  async saveToServer() {
    if (this._hasBackend) {
      // 1. 先将 base64 图片落盘到 images 目录，把覆盖字典中的引用替换为磁盘路径
      //    （顺序很重要：CSV 导出的 meta 图片字段依赖这里得到的路径，必须先落盘再生成 CSV）
      for (const [key, val] of Object.entries(this._imgOverrides)) {
        if (typeof val !== "string" || !val) continue;
        const parts = key.split(".");
        // 内容块图片的键形如 section.bk<id>；旧槽位图（section.1）与 meta 图片不属于此列
        const isBlockImg = parts.length > 1 && String(parts[1]).indexOf("bk") === 0;
        if (val.startsWith("data:image/")) {
          let filename = "";
          if (parts[0] === "meta") {
            filename = parts[1] + ".jpg";
          } else {
            const prefix = this.imagePrefix[parts[0]] || parts[0];
            filename = prefix + "-" + parts[1] + ".jpg";
          }
          try {
            const imgRes = await fetch("/api/save-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ filename, base64: val })
            });
            const imgData = await imgRes.json();
            if (imgData.success) {
              this._imgOverrides[key] = "images/" + filename + "?t=" + Date.now();
              // 内容块图片：把落盘路径写回块本身，随后生成的 CSV 即为最终路径（无需二次保存）
              this._setBlockImagePath(parts[0], parts[1], "images/" + filename);
            }
          } catch (e) {
            console.warn("上传图片落盘失败:", filename, e);
          }
        } else if (isBlockImg && val.startsWith("images/")) {
          // ★ 已落盘的块图：每次保存都以覆盖字典中的路径为准再次回填到块。
          //   必要性：collectBlocks 以编辑区 DOM 为唯一来源，而 DOM 里的隐藏 src 可能停留在
          //   「上传前的空值」——用户上传完图片后「改别的地方再点一次保存」时，块 src 会被
          //   覆盖成空，导致前台回落到默认图。这里做一次自愈，保证已落盘的图片永远不会被抹掉。
          this._setBlockImagePath(parts[0], parts[1], val.split("?t=")[0]);
        }
      }

      // 2. 再生成并保存 CSV（此时 meta 图片字段已是落盘路径，会一并写入磁盘持久化）
      const csvString = this.getCSVString();
      const res = await fetch("/api/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvString })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "服务端保存 CSV 失败");
      }

      // 重新保存更新后的 overrides
      localStorage.setItem(this.KEYS.images, JSON.stringify(this._imgOverrides));
      return { success: true, message: "所有内容已直接写入磁盘 (data/content.csv & images/)" };
    } else {
      // 无 Python 后端时的纯静态保存
      return { success: true, message: "更改已保存至本地浏览器缓存（建议启动 server.py 获得完整落盘功能）" };
    }
  },

  // ===== 客户询盘处理 =====
  async submitInquiry(inquiry) {
    const payload = {
      ...inquiry,
      timestamp: new Date().toISOString(),
      id: "inq_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6)
    };

    if (this._hasBackend) {
      const res = await fetch("/api/submit-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "服务端提交询盘失败");
      }
      return data;
    } else {
      // 离线模式保存在 localStorage
      try {
        const localList = JSON.parse(localStorage.getItem(this.KEYS.inquiries) || "[]");
        localList.unshift(payload);
        localStorage.setItem(this.KEYS.inquiries, JSON.stringify(localList));
        return { success: true, message: "您的需求已成功提交，工程师将尽快与您对接！" };
      } catch (e) {
        throw new Error("存储询盘记录失败: " + e.message);
      }
    }
  },

  // ===== 获取询盘列表 =====
  async getInquiries() {
    if (this._hasBackend) {
      const res = await fetch("/api/inquiries", { method: "GET", cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        return data.data || [];
      }
    }
    // 离线读取
    return JSON.parse(localStorage.getItem(this.KEYS.inquiries) || "[]");
  },

  // ===== 删除询盘记录 =====
  async deleteInquiry(id) {
    if (this._hasBackend) {
      const res = await fetch("/api/delete-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      return await res.json();
    } else {
      let list = JSON.parse(localStorage.getItem(this.KEYS.inquiries) || "[]");
      list = list.filter(item => item.id !== id);
      localStorage.setItem(this.KEYS.inquiries, JSON.stringify(list));
      return { success: true, message: "询盘记录已删除" };
    }
  },

  // ===== 恢复默认设置 =====
  async resetDefaults() {
    localStorage.removeItem(this.KEYS.content);
    localStorage.removeItem(this.KEYS.images);
    localStorage.removeItem(this.KEYS.counts);
    localStorage.setItem(this.KEYS.version, this.VERSION);
    this._overrides = {};
    this._imgOverrides = {};
    this._imgCounts = {};
    this._loadDefaults();
    if (this._hasBackend) {
      await this.saveToServer();
    }
    return { success: true, message: "已恢复出厂默认设置" };
  },

  // ===== 管理员认证 =====
  async login(username, password) {
    // 优先尝试后端服务端认证
    if (this._hasBackend) {
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username, password: password })
        });
        const data = await res.json();
        if (data.success) {
          const token = data.token || ("token_" + Date.now() + "_" + Math.random().toString(36).substr(2));
          sessionStorage.setItem(this.KEYS.session, token);
          return { success: true, token: token, message: data.message || "登录成功" };
        } else {
          return { success: false, message: data.message || "用户名或密码错误，请重试" };
        }
      } catch (e) {
        console.warn("[DataManager] 后端认证请求失败，降级本地校验:", e);
      }
    }

    // 本地离线 fallback 校验
    const localPass = localStorage.getItem("magdrive_admin_pwd") || this.ADMIN_PASS;
    if (username === this.ADMIN_USER && password === localPass) {
      const token = "token_" + Date.now() + "_" + Math.random().toString(36).substr(2);
      sessionStorage.setItem(this.KEYS.session, token);
      return { success: true, token: token, message: "登录成功" };
    }
    return { success: false, message: "用户名或密码错误，请重试" };
  },

  async changePassword(oldPassword, newPassword) {
    // 优先向后端服务提交修改密码
    if (this._hasBackend) {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "修改密码失败");
      }
      return data;
    }

    // 本地离线 fallback 保存
    const current = localStorage.getItem("magdrive_admin_pwd") || this.ADMIN_PASS;
    if (oldPassword !== current) {
      throw new Error("当前原密码不正确，请重新输入");
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error("新密码长度不能少于6位");
    }
    localStorage.setItem("magdrive_admin_pwd", newPassword);
    return { success: true, message: "密码修改成功！请使用新密码重新登录" };
  },

  isLoggedIn() {
    return !!sessionStorage.getItem(this.KEYS.session);
  },

  logout() {
    sessionStorage.removeItem(this.KEYS.session);
  }
};

if (typeof window !== "undefined") window.DataManager = DataManager;
if (typeof global !== "undefined") global.DataManager = DataManager;

// ===== 将紧凑文案元组规范化为对象数组，并提供分组查询 =====
DataManager.TEXTS = DataManager._TEXTS_RAW.map(function (t) {
  return { group: t[0], key: t[1], label: t[2], def: t[3], type: t[4] || "text" };
});
DataManager.getTexts = function (group) {
  return DataManager.TEXTS.filter(function (t) { return t.group === group; });
};

// ===== meta 命名空间下的图片字段清单（getCSVString 导出 & 后台管理共用）=====
DataManager.META_IMAGE_KEYS = [
  "logo",
  "hero_bg",
  "hero_image",
  "license",
  "section_bg_product",
  "section_bg_performance",
  "section_bg_usage",
  "section_bg_application",
  "section_bg_contact"
];

// meta 图片字段的内置默认值：与默认值相同的值不写入 CSV（避免污染配置文件）
// 注：license（营业执照）已移出默认值表 —— 未上传时前台不显示执照卡片，
//     用户上传后路径会正常写入 CSV 持久化。
DataManager.META_IMAGE_DEFAULTS = {
  logo: "images/logo.png",
  hero_image: "images/hero_pump_3d.png"
};

// ===== 后台标签栏名称 =====
// 后台管理界面顶部那一排标签的文字，允许客户按自己的说法重命名（如「客户询盘管理」-> 「客户留言」）。
// 这些是「后台 UI 文案」，只影响管理界面，不影响网站前台；与默认值相同的值不写入 CSV。
DataManager.ADMIN_TAB_DEFAULTS = {
  texts: "首页与通用文案 ✏️",
  product: "产品展示",
  performance: "性能参数",
  usage: "使用方法",
  application: "应用工况",
  contact: "联系信息设置",
  inquiries: "客户询盘管理 📩",
  webhook: "GitHub 自动部署 🚀"
};

// 后台标签栏的 Tab 顺序（admin.js 的标签与内容面板均按此顺序渲染）
DataManager.ADMIN_TAB_ORDER = ["texts"].concat(DataManager.sections, ["contact", "inquiries", "webhook"]);

// 读取某个后台标签的名称：优先取后台自定义值，为空则回退内置默认名称
DataManager.getAdminTabLabel = function (tabId) {
  const custom = DataManager.getValue("meta", "admin_tab_" + tabId);
  if (custom) return custom;
  return DataManager.ADMIN_TAB_DEFAULTS[tabId] || tabId;
};
