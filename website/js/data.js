/**
 * DataManager - 核心数据管理模块
 * 负责 CSV 解析、后端 API 同步、localStorage 存取、图片管理、管理员认证与询盘处理
 */
const DataManager = {
  VERSION: "v3_magdrive_elite",
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

  KEYS: {
    version: "bearing_data_ver",
    content: "bearing_content_overrides",
    images: "bearing_image_overrides",
    counts: "bearing_image_counts",
    session: "bearing_admin_session",
    inquiries: "bearing_offline_inquiries",
    password: "bearing_admin_password"
  },

  // 核心展示板块
  sections: ["product", "performance", "usage", "application"],

  sectionLabels: {
    product: "产品展示",
    performance: "性能参数",
    usage: "使用方法",
    application: "应用工况"
  },

  // ===== CSV 解析 =====
  parseCSV(text) {
    if (!text) return [];
    text = text.replace(/^\ufeff/, ""); // 移除 UTF-8 BOM
    const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.startsWith("#"));
    return lines.map(line => {
      const fields = [];
      let field = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const next = line[i + 1];
        if (char === '"') {
          if (inQuotes && next === '"') { field += '"'; i++; }
          else { inQuotes = !inQuotes; }
        } else if (char === "," && !inQuotes) {
          fields.push(field); field = "";
        } else { field += char; }
      }
      fields.push(field);
      return fields;
    });
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
    // 各板块
    this.sections.forEach(section => {
      const count = this.getImageCount(section);
      rows.push([section, "section_title", this.getValue(section, "section_title")]);
      rows.push([section, "section_description", this.getValue(section, "section_description")]);
      rows.push([section, "text_position", this.getValue(section, "text_position") || "above"]);
      rows.push([section, "image_count", String(count)]);
      for (let i = 1; i <= count; i++) {
        rows.push([section, "image" + i + "_caption", this.getValue(section, "image" + i + "_caption")]);
        rows.push([section, "image" + i + "_description", this.getValue(section, "image" + i + "_description")]);
      }
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

    return this.toCSV(rows);
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
    this._loaded = true;
  },

  _loadDefaults() {
    this._csvContent = {
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
        image2_caption: "金属-陶瓷复合轴承 (发明专利号: CN121382800A)",
        image2_description: "独家发明专利王牌产品，通过结构性复合攻克金属与陶瓷膨胀系数差异，500℃高温硬度达2400~2700 HV，耐磨寿命提升10倍以上",
        image3_caption: "先进核能高温铅铋泵 / 锂铅合金泵",
        image3_description: "专用于加速器次临界堆 (CiADS) 与第四代铅冷快堆回路，耐受480℃~550℃强辐射与高腐蚀，已批量交付中国原子能研究院",
        image4_caption: "特种工况超高温阀门与流体测控集成",
        image4_description: "超高温盲板阀、高温高压烟道挡板及传感器智能化测控系统，提供高温特种流体输送成套工程解决方案"
      },
      performance: {
        section_title: "核心技术指标与国内外主流竞品综合对标",
        section_description: "三大关键技术突破：内外转子无磁钢驱动、金属-陶瓷复合轴承、全静密封+CFD自循环风冷，在耐温、安全与经济性上全面超越国内外竞品",
        text_position: "above",
        image_count: "3",
        image1_caption: "内外转子无磁钢驱动磁仿真与耐温特性",
        image1_description: "外转子交替磁路与铁磁内转子相位差扭矩传递，突破行业350℃退磁瓶颈，实现850℃超高温稳定连续运转",
        image2_caption: "CFD 热流耦合与外转子风扇轮毂自散热",
        image2_description: "电机带动外转子顶端风扇轮毂高速自旋转，小气隙大流速强制风冷，摆脱复杂外部冷却水系统与水处理成本",
        image3_caption: "传统长轴泵轴系共振与轴承磨损痛点对比",
        image3_description: "传统熔盐泵长达20米、9个导轴承极易热变形振动超标与烧瓦；迈德瑞仅1.5米紧凑轴长与2个复合轴承，振动极小"
      },
      usage: {
        section_title: "标准安装指引、免水冷运行与全生命周期运维",
        section_description: "颠覆性紧凑结构大幅简化现场吊装与管路对接，全静密封与自循环风冷实现免日常维护，显著降低全生命周期综合成本",
        text_position: "above",
        image_count: "3",
        image1_caption: "紧凑型模块化安装与空间节省指引",
        image1_description: "整机轴长仅1.5米，无需传统20米长轴泵的高耸钢构支架与大型吊装作业，大幅减少占地面积与土建安装工程量",
        image2_caption: "自循环风冷无水运行与环境适应规范",
        image2_description: "启动即自散热，无需外接冷却水泵、冷却塔与水处理管路，避免北方严寒结冰与缺水地区冷却受限，可靠性极高",
        image3_caption: "静密封隔离套与复合轴承长效巡检规范",
        image3_description: "隔离套静态密封承压可靠，金属-陶瓷复合轴承硬度高达HV 2700且间隙恒定，理论实现无限运行寿命与极低故障率"
      },
      application: {
        section_title: "四大战略应用场景与国家重大项目供货实绩",
        section_description: "深度契合国家“双碳”战略与新质生产力，核心装备已在光热储能、先进核能、高端化工及特种冶金等重大工程中批量稳定运行",
        text_position: "above",
        image_count: "4",
        image1_caption: "光热储能 (CSP) —— 565℃ 熔盐吸热与储能主循环",
        image1_description: "适配塔式/槽式光热电站565℃高温二元熔盐主循环回路，解决传统泵低效易漏短板，保障储能电站连续安全运转",
        image2_caption: "先进核能 (Nuclear) —— CiADS 次临界铅铋堆与聚变回路",
        image2_description: "中国原子能院已供货12台高温铅铋泵、中科院合肥院供货2台，适配480℃~550℃核反应堆一/二回路冷却剂循环",
        image3_caption: "高端化工 (Chemical) —— 350~400℃ 强腐蚀工艺输送",
        image3_description: "适用于有机合成与精细化工高温熔盐换热及强酸强碱介质输送，全静密封杜绝危化品挥发与介质污染",
        image4_caption: "特种冶金 (Metallurgy) —— 高温熔体与熔渣特种转移",
        image4_description: "耐受高温熔液磨损与严苛腐蚀，在山东豪迈集团已供货7台并批量稳定运行，大幅提高产线连续作业率"
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
  getValue(section, field) {
    const key = section + "." + field;
    if (this._overrides[key] !== undefined && this._overrides[key] !== "") {
      return this._overrides[key];
    }
    if (this._csvContent[section] && this._csvContent[section][field] !== undefined && this._csvContent[section][field] !== "") {
      return this._csvContent[section][field];
    }
    return "";
  },

  setValue(section, field, value) {
    const key = section + "." + field;
    this._overrides[key] = value;
    this._saveOverrides();
  },

  _saveOverrides() {
    try {
      localStorage.setItem(this.KEYS.content, JSON.stringify(this._overrides));
    } catch (e) {
      console.error("保存覆盖配置失败:", e);
    }
  },

  // ===== 图片数量管理 =====
  getImageCount(section) {
    if (this._imgCounts[section] !== undefined && this._imgCounts[section] !== "") {
      return parseInt(this._imgCounts[section]);
    }
    const fromCSV = this.getValue(section, "image_count");
    if (fromCSV) return parseInt(fromCSV);
    if (this.defaultImages[section]) return this.defaultImages[section].length;
    return 0;
  },

  setImageCount(section, count) {
    this._imgCounts[section] = count;
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

  // ===== 全局图片管理（logo、hero背景图）=====
  getMetaImage(key) {
    const imgKey = "meta." + key;
    if (this._imgOverrides[imgKey]) return this._imgOverrides[imgKey];
    if (key === "logo") return "images/logo.png";
    if (key === "license") return "images/business_license.jpg";
    return null;
  },

  saveMetaImage(key, base64) {
    this.saveImage("meta", key, base64);
  },

  removeMetaImage(key) {
    this.removeImage("meta", key);
  },

  // ===== 服务端保存与落盘 =====
  async saveToServer() {
    const csvString = this.getCSVString();
    if (this._hasBackend) {
      // 1. 保存 CSV
      const res = await fetch("/api/save-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvString })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "服务端保存 CSV 失败");
      }

      // 2. 将 base64 图片落盘到 images 目录
      for (const [key, val] of Object.entries(this._imgOverrides)) {
        if (typeof val === "string" && val.startsWith("data:image/")) {
          const parts = key.split(".");
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
            }
          } catch (e) {
            console.warn("上传图片落盘失败:", filename, e);
          }
        }
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

  // ===== 管理员认证与登录 =====
  async login(username, password) {
    if (this._hasBackend) {
      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success && data.token) {
          sessionStorage.setItem(this.KEYS.session, data.token);
          return { success: true, message: data.message };
        }
        return { success: false, message: data.message || "用户名或密码错误" };
      } catch (e) {
        console.warn("服务端登录接口异常，尝试本地凭据", e);
      }
    }

    // 离线/纯静态环境登录校验
    const localPass = localStorage.getItem(this.KEYS.password) || this.ADMIN_PASS;
    if (username === this.ADMIN_USER && password === localPass) {
      const token = "token_" + Date.now() + "_" + Math.random().toString(36).substr(2);
      sessionStorage.setItem(this.KEYS.session, token);
      return { success: true, message: "登录成功" };
    }
    return { success: false, message: "用户名或密码错误，请重试" };
  },

  // ===== 修改管理员密码 =====
  async changePassword(oldPassword, newPassword) {
    if (this._hasBackend) {
      try {
        const res = await fetch("/api/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "修改密码失败");
        }
        localStorage.setItem(this.KEYS.password, newPassword);
        return data;
      } catch (e) {
        throw e;
      }
    } else {
      // 离线静态模式
      const currentPass = localStorage.getItem(this.KEYS.password) || this.ADMIN_PASS;
      if (oldPassword !== currentPass) {
        throw new Error("当前原密码不正确，请重新输入");
      }
      if (!newPassword || newPassword.length < 6) {
        throw new Error("新密码长度不能少于6位");
      }
      localStorage.setItem(this.KEYS.password, newPassword);
      return { success: true, message: "密码修改成功！请使用新密码重新登录" };
    }
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
