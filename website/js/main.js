/**
 * main.js - 迈德瑞（淮安）智能装备科技 前台交互逻辑
 * 支持五大核心板块渲染、参数对标表格、客户供货墙、Lightbox画廊、自适应抽屉导航、工况选型表单与Scrollspy
 */

let galleryItems = [];
let currentLightboxIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
  await DataManager.init();
  renderPage();
  initLightbox();
  initMobileNav();
  initBackToTop();
  initScrollspy();
  initHeroEvents();
});

// ===== 页面整体渲染 =====
function renderPage() {
  galleryItems = [];

  // 1. 网站标题与导航
  const siteTitle = DataManager.getValue("meta", "site_title") || "迈德瑞（淮安）智能装备科技有限公司";
  const siteTitleEl = document.getElementById("siteTitle");
  if (siteTitleEl) siteTitleEl.textContent = siteTitle;
  document.title = siteTitle + " - MagDrive 高温磁力泵与关键装备";

  // 2. 自定义导航文字
  renderNavigation();

  // 3. 自定义 Hero
  const heroBgImage = DataManager.getMetaImage("hero_bg");
  const heroBgColor = DataManager.getValue("meta", "hero_bg_color");
  const hero = document.getElementById("heroSection");
  if (hero) {
    if (heroBgImage) {
      hero.style.background = "linear-gradient(rgba(10,25,47,0.85), rgba(10,25,47,0.92)), url('" + heroBgImage + "') center/cover no-repeat";
    } else if (heroBgColor) {
      hero.style.background = "linear-gradient(135deg, " + heroBgColor + " 0%, #06152b 100%)";
    }
  }

  // 4. 自定义页脚文字
  const footerText = DataManager.getValue("meta", "footer_text");
  if (footerText) {
    const footerEl = document.getElementById("footerText");
    if (footerEl) footerEl.textContent = footerText;
  }

  // 5. 渲染四大核心内容板块 (产品展示, 性能参数, 使用方法, 应用工况)
  const main = document.getElementById("mainContent");
  main.innerHTML = "";
  DataManager.sections.forEach(section => {
    main.appendChild(renderSection(section));
  });

  // 6. 渲染「联系我们 / 在线工况选型」板块
  main.appendChild(renderContactSection());
}

// ===== 导航栏动态渲染 =====
function renderNavigation() {
  const navText = DataManager.getValue("meta", "nav_text") || "产品展示,性能参数,使用方法,应用工况,联系我们";
  const navLabels = navText.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  const desktopNav = document.getElementById("desktopNav");
  const mobileNavLinks = document.getElementById("mobileNavLinks");

  const sectionIds = [...DataManager.sections, "contact"];

  if (desktopNav && navLabels.length > 0) {
    desktopNav.innerHTML = "";
    navLabels.forEach((label, i) => {
      const a = document.createElement("a");
      a.textContent = label;
      a.href = "#" + (sectionIds[i] || ("section_" + i));
      desktopNav.appendChild(a);
    });
  }

  if (mobileNavLinks && navLabels.length > 0) {
    mobileNavLinks.innerHTML = "";
    navLabels.forEach((label, i) => {
      const a = document.createElement("a");
      a.textContent = label;
      a.href = "#" + (sectionIds[i] || ("section_" + i));
      a.addEventListener("click", () => closeMobileNav());
      mobileNavLinks.appendChild(a);
    });
  }
}

// ===== 渲染单个展示板块 =====
function renderSection(section) {
  const count = DataManager.getImageCount(section);
  const title = DataManager.getValue(section, "section_title") || DataManager.sectionLabels[section];
  const description = DataManager.getValue(section, "section_description") || "";
  const textPosition = DataManager.getValue(section, "text_position") || "above";

  const sec = document.createElement("section");
  sec.className = "content-section section-" + section;
  sec.id = section;

  // 标题与描述
  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div class="section-tag">${getSectionTag(section)}</div>
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(description)}</p>
  `;

  // 图片与卡片网格
  const grid = document.createElement("div");
  grid.className = "image-grid grid-" + section;
  for (let i = 1; i <= count; i++) {
    grid.appendChild(renderImageCard(section, i));
  }

  // 组装 DOM
  if (textPosition === "below") {
    sec.appendChild(grid);
    sec.appendChild(header);
  } else {
    sec.appendChild(header);
    sec.appendChild(grid);
  }

  // 若为「性能参数」板块，追加国内外主流竞品详细参数对标表
  if (section === "performance") {
    sec.appendChild(renderCompareTable());
  }

  // 若为「应用工况」板块，追加权威客户供货实绩墙与产学研保障
  if (section === "application") {
    sec.appendChild(renderClientAndTeamShowcase());
  }

  return sec;
}

// 获取板块顶部的小标签
function getSectionTag(section) {
  const tags = {
    product: "PRODUCT PORTFOLIO · 核心特种流体装备",
    performance: "TECHNICAL SPECIFICATIONS · 性能指标与参数对标",
    usage: "INSTALLATION & O&M · 标准安装与全生命周期运维",
    application: "STRATEGIC SCENARIOS · 四大战略应用场景与实绩"
  };
  return tags[section] || "MAGDRIVE TECHNOLOGY";
}

// ===== 渲染单张图片/装备卡片 =====
function renderImageCard(section, index) {
  const caption = DataManager.getValue(section, "image" + index + "_caption") || (DataManager.sectionLabels[section] + " 图示 " + index);
  const description = DataManager.getValue(section, "image" + index + "_description") || "";
  const imgUrl = DataManager.getImageUrl(section, index);

  // 存入画廊全局数组供 Lightbox 浏览
  const galleryIndex = galleryItems.length;
  galleryItems.push({
    url: imgUrl,
    caption: caption,
    description: description,
    section: section
  });

  const card = document.createElement("div");
  card.className = "image-card card-" + section;
  card.setAttribute("title", "点击查看高清大图及结构细节");

  // 获取卡片特殊高亮角标
  const badgeHtml = getCardBadge(section, index);

  card.innerHTML = `
    <div class="image-card-thumb-wrap">
      ${badgeHtml}
      <img src="${imgUrl}" alt="${escapeAttr(caption)}" loading="lazy"
        onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 400 240\'%3E%3Crect width=\'400\' height=\'240\' fill=\'%23eceff1\'/%3E%3Ctext x=\'200\' y=\'120\' text-anchor=\'middle\' font-size=\'15\' fill=\'%2390a4ae\'%3E图片加载中...%3C/text%3E%3C/svg%3E'">
      <div class="zoom-hint">🔍 点击全屏预览</div>
    </div>
    <div class="card-body">
      <div class="card-caption">${escapeHtml(caption)}</div>
      <div class="card-description">${escapeHtml(description)}</div>
    </div>
  `;

  // 点击打开 Lightbox
  card.addEventListener("click", () => {
    openLightbox(galleryIndex);
  });

  return card;
}

// 获取卡片高亮角标
function getCardBadge(section, index) {
  if (section === "product") {
    if (index === 1) return '<span class="card-badge badge-hot">🔥 耐温 850℃</span>';
    if (index === 2) return '<span class="card-badge badge-patent">📜 发明专利 CN121382800A</span>';
    if (index === 3) return '<span class="card-badge badge-deal">⚛️ 核能重大工程</span>';
    if (index === 4) return '<span class="card-badge badge-safe">⚙️ 智能化测控</span>';
  }
  if (section === "performance") {
    if (index === 1) return '<span class="card-badge badge-advantage">⚡ 无磁钢内转子</span>';
    if (index === 2) return '<span class="card-badge badge-safe">💨 CFD 自循环风冷</span>';
    if (index === 3) return '<span class="card-badge badge-pain">⚠️ 传统长轴痛点解决</span>';
  }
  if (section === "usage") {
    if (index === 1) return '<span class="card-badge badge-advantage">📐 轴长仅 1.5m 紧凑安装</span>';
    if (index === 2) return '<span class="card-badge badge-safe">💧 免外部冷却水</span>';
    if (index === 3) return '<span class="card-badge badge-deal">🛡️ 理论无限寿命</span>';
  }
  if (section === "application") {
    if (index === 1) return '<span class="card-badge badge-hot">☀️ 光热储能 565℃</span>';
    if (index === 2) return '<span class="card-badge badge-deal">⚛️ 先进核能 (已供12台)</span>';
    if (index === 3) return '<span class="card-badge badge-safe">🧪 精细化工强腐蚀</span>';
    if (index === 4) return '<span class="card-badge badge-advantage">🏭 冶金熔渣 (已供7台)</span>';
  }
  return "";
}

// ===== 渲染国内外主流竞品参数对标表格 =====
function renderCompareTable() {
  const wrap = document.createElement("div");
  wrap.className = "compare-table-container";
  wrap.innerHTML = `
    <div class="compare-table-header">
      <h3>📊 国内外主流竞品与传统长轴泵参数综合对标</h3>
      <p>迈德瑞高温磁力泵在耐温极限、密封可靠性、结构紧凑度与工程经济性上实现全方位突破</p>
    </div>
    <div class="table-responsive">
      <table class="compare-table">
        <thead>
          <tr>
            <th>对比维度</th>
            <th class="highlight-col">本项目高温磁力泵 (迈德瑞)</th>
            <th>传统熔盐长轴液下泵</th>
            <th>国际进口巨头 (Flowserve / Sulzer / KSB)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>最高耐温性能</strong></td>
            <td class="highlight-col"><strong>最高可达 850℃</strong> <span class="table-tag">行业突破</span></td>
            <td>≤ 565℃ (高温极易热变形)</td>
            <td>≤ 550℃ (常规磁力泵极限)</td>
          </tr>
          <tr>
            <td><strong>设备密封形式</strong></td>
            <td class="highlight-col"><strong>全静密封 (零泄漏 本质安全)</strong></td>
            <td>机械动密封 / 填料密封 (泄漏起火风险)</td>
            <td>动密封 + 复杂辅助密封水冷系统</td>
          </tr>
          <tr>
            <td><strong>结构轴长与轴承</strong></td>
            <td class="highlight-col"><strong>轴长仅 1.5 米 (仅 2 个复合轴承)</strong></td>
            <td>轴长达 20 米 (多达 9 个导轴承，振动大)</td>
            <td>结构庞大、占地空间大</td>
          </tr>
          <tr>
            <td><strong>轴承材质与耐磨寿命</strong></td>
            <td class="highlight-col"><strong>金属-陶瓷复合轴承 (寿命提升10倍+)</strong></td>
            <td>钴基/镍基合金 (钴溶出、碳化钨剥落烧瓦)</td>
            <td>进口耐磨陶瓷 / 硬质合金 (价格高昂)</td>
          </tr>
          <tr>
            <td><strong>高温合金用量</strong></td>
            <td class="highlight-col"><strong>较传统长轴泵减少 80%</strong></td>
            <td>基准 (需消耗大量昂贵高温合金)</td>
            <td>基准</td>
          </tr>
          <tr>
            <td><strong>冷却散热形式</strong></td>
            <td class="highlight-col"><strong>CFD 自循环风冷 (免外部冷却水管)</strong></td>
            <td>复杂外部冷却水系统 (耗水耗电)</td>
            <td>外部水冷或外置循环装置</td>
          </tr>
          <tr>
            <td><strong>单台造价与交期</strong></td>
            <td class="highlight-col"><strong>300 ~ 500 万元 · 快速交付</strong></td>
            <td>560 ~ 1000+ 万元</td>
            <td>800 ~ 1000+ 万元 (关税高、交期6~12月)</td>
          </tr>
          <tr>
            <td><strong>年均维护与故障率</strong></td>
            <td class="highlight-col"><strong>免日常维护 · 理论无限寿命</strong></td>
            <td>故障率高达 1.5 ~ 3 次/年 (需吊装大修)</td>
            <td>定期更换易损密封套件</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  return wrap;
}

// ===== 渲染权威客户供货与产学研体系展示 =====
function renderClientAndTeamShowcase() {
  const wrap = document.createElement("div");
  wrap.className = "client-team-showcase";
  wrap.innerHTML = `
    <!-- 客户实绩徽章墙 -->
    <div class="showcase-block">
      <div class="showcase-title">
        <h3>🎯 行业龙头客户与国家重大工程供货实绩</h3>
        <p>核心装备已在国家重点科研院所及行业领军企业通过极端工况考核与批量验证</p>
      </div>
      <div class="client-grid-cards">
        <div class="client-stat-card">
          <div class="client-logo-wrap">
            <img src="images/client_ciae.png" alt="中国原子能科学研究院" onerror="this.src='images/logo.png'">
          </div>
          <div class="client-stat-info">
            <h4>中国原子能科学研究院</h4>
            <div class="client-badge">已供货 12 台</div>
            <p>CiADS 加速器次临界堆铅基实验堆 (约2000万项目) 及堆芯水力验证装置</p>
          </div>
        </div>
        <div class="client-stat-card">
          <div class="client-logo-wrap">
            <img src="images/client_cas.png" alt="中科院合肥物质科学研究院" onerror="this.src='images/logo.png'">
          </div>
          <div class="client-stat-info">
            <h4>中科院合肥物质科学研究院</h4>
            <div class="client-badge">已供货 2 台</div>
            <p>液态金属特种输送回路与聚变堆关键技术验证平台稳定运行</p>
          </div>
        </div>
        <div class="client-stat-card">
          <div class="client-logo-wrap">
            <img src="images/client_cgn.png" alt="中广核研究院" onerror="this.src='images/logo.png'">
          </div>
          <div class="client-stat-info">
            <h4>中广核研究院 / 中广核新能源</h4>
            <div class="client-badge">已供货 2 台</div>
            <p>580℃ 新型高温熔盐试验台核心回路循环泵 (约1400万合作意向)</p>
          </div>
        </div>
        <div class="client-stat-card">
          <div class="client-logo-wrap">
            <img src="images/client_haomai.png" alt="山东豪迈集团" onerror="this.src='images/logo.png'">
          </div>
          <div class="client-stat-info">
            <h4>山东豪迈集团</h4>
            <div class="client-badge">已供货 7 台</div>
            <p>高端能源装备特种工况批量稳定运行与产业化配套</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 产学研与制造保障体系 -->
    <div class="showcase-block" style="margin-top:36px;">
      <div class="showcase-title">
        <h3>🏛️ 顶尖产学研协同与产业化制造基地保障</h3>
        <p>依托高校全国重点实验室科研转化 + 3.5 亿高端泵业供应链协同 + 淮安经开区基地</p>
      </div>
      <div class="pillars-grid">
        <div class="pillar-card">
          <div class="pillar-icon">🏭</div>
          <h4>产业化核心基地</h4>
          <h5>江苏省淮安经济技术开发区</h5>
          <p>依托本地完备的高端装备产业链配套与人才扶持政策，打造华东标杆并辐射全国。</p>
        </div>
        <div class="pillar-card">
          <div class="pillar-icon">🎓</div>
          <h4>联合东北大学全国重点实验室</h4>
          <h5>深部金属矿智能开采与装备实验室</h5>
          <p>由马树军教授博导团队深度协同，保持持续前沿研发与颠覆性成果转化能力。</p>
        </div>
        <div class="pillar-card">
          <div class="pillar-icon">⚙️</div>
          <h4>协同大连海特泵业供应链</h4>
          <h5>瑞士 Sulzer 制造标准 · 年产值 3.5 亿元</h5>
          <p>30年高端泵业制造积淀与完备零部件供应链，为规模化量产提供坚实保障。</p>
        </div>
      </div>
    </div>
  `;
  return wrap;
}

// ===== 渲染「联系我们 / 在线工况选型」板块 =====
function renderContactSection() {
  const sec = document.createElement("section");
  sec.className = "content-section contact-section";
  sec.id = "contact";

  const title = DataManager.getValue("contact", "section_title") || "联系我们 & 工况参数在线选型定制";
  const desc = DataManager.getValue("contact", "section_description") || "迈德瑞技术专家团队为您提供 850℃ 超高温磁力泵与金属-陶瓷复合轴承选型支持、图纸对接与极速技术方案定制";
  const company = DataManager.getValue("contact", "company_name") || "迈德瑞（淮安）智能装备科技有限公司";
  const phone = DataManager.getValue("contact", "phone") || "400-888-9999 / 0517-88886666";
  const email = DataManager.getValue("contact", "email") || "sales@magdrive-tech.com";
  const address = DataManager.getValue("contact", "address") || "江苏省淮安经济技术开发区南马厂街道内湖路82号经管站103室";
  const hours = DataManager.getValue("contact", "hours") || "周一至周五 08:30 - 18:00";
  const creditCode = DataManager.getValue("contact", "credit_code") || "91320891MAKML1457M";
  const legalPerson = DataManager.getValue("contact", "legal_person") || "张剑";
  const registeredCapital = DataManager.getValue("contact", "registered_capital") || "450万元整";
  const formTitle = DataManager.getValue("contact", "form_title") || "在线技术咨询与工况参数选型定制";
  const formSubtitle = DataManager.getValue("contact", "form_subtitle") || "请提交您的介质类型 (熔盐/液态金属/强酸碱)、运行温区、流量扬程或技术要求，工程师团队2小时内对接";
  const licenseImg = DataManager.getMetaImage("license") || "images/business_license.jpg";

  // 将营业执照加入画廊
  const licenseGalleryIndex = galleryItems.length;
  galleryItems.push({
    url: licenseImg,
    caption: `${company} - 营业执照官方资质认证`,
    description: `统一社会信用代码: ${creditCode} | 法定代表人: ${legalPerson} | 注册资本: ${registeredCapital} | 发证机关: 淮安经济技术开发区行政审批局`,
    section: "contact"
  });

  sec.innerHTML = `
    <div class="section-header">
      <div class="section-tag">GET IN TOUCH & ENGINEERING SUPPORT</div>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(desc)}</p>
    </div>
    <div class="contact-grid">
      <!-- 左侧：联系信息与企业官方资质卡片 -->
      <div class="contact-info-card">
        <div class="contact-info-title">
          <img src="images/logo.png" alt="Logo" class="contact-logo-thumb">
          <span>${escapeHtml(company)}</span>
        </div>
        <div class="contact-info-list">
          <div class="contact-info-item">
            <div class="contact-icon">📞</div>
            <div class="contact-details">
              <h4>技术咨询 / 销售热线</h4>
              <p>${escapeHtml(phone)}</p>
            </div>
          </div>
          <div class="contact-info-item">
            <div class="contact-icon">✉️</div>
            <div class="contact-details">
              <h4>技术选型与商务邮箱</h4>
              <p>${escapeHtml(email)} · djw@neu.edu.cn</p>
            </div>
          </div>
          <div class="contact-info-item">
            <div class="contact-icon">📍</div>
            <div class="contact-details">
              <h4>产业化核心基地</h4>
              <p>${escapeHtml(address)}</p>
            </div>
          </div>
          <div class="contact-info-item">
            <div class="contact-icon">🕒</div>
            <div class="contact-details">
              <h4>技术支持响应时间</h4>
              <p>${escapeHtml(hours)} (紧急工况2小时极速响应)</p>
            </div>
          </div>
          <div class="contact-info-item">
            <div class="contact-icon">📜</div>
            <div class="contact-details">
              <h4>统一社会信用代码</h4>
              <p style="font-family:monospace;font-size:14px;letter-spacing:0.8px;font-weight:600;">${escapeHtml(creditCode)}</p>
            </div>
          </div>
        </div>

        <!-- 营业执照官方资质认证小卡片 -->
        <div class="license-preview-box" id="licensePreviewBox" title="点击全屏放大查看营业执照原件">
          <img src="${licenseImg}" alt="营业执照原件" class="license-thumb">
          <div class="license-text-block">
            <div class="license-title">国家市场监督管理总局监制 · 正规营业执照</div>
            <div class="license-sub">法定代表人: ${escapeHtml(legalPerson)} · 注册资本: ${escapeHtml(registeredCapital)} (点击查看原件)</div>
          </div>
          <span class="license-zoom-icon">🔍</span>
        </div>
      </div>

      <!-- 右侧：专业工况参数选型定制表单 -->
      <div class="inquiry-form-card">
        <h3>${escapeHtml(formTitle)}</h3>
        <p class="inquiry-subtitle">${escapeHtml(formSubtitle)}</p>
        <form class="inquiry-form" id="inquiryForm">
          <div class="form-row">
            <div class="form-col">
              <label>您的姓名 / 称呼<span class="req">*</span></label>
              <input type="text" id="inq_name" placeholder="例如：张总 / 李总工" required>
            </div>
            <div class="form-col">
              <label>联系电话 / 微信<span class="req">*</span></label>
              <input type="tel" id="inq_contact" placeholder="例如：13800000000" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label>电子邮箱</label>
              <input type="email" id="inq_email" placeholder="例如：engineer@company.com">
            </div>
            <div class="form-col">
              <label>单位 / 企业名称</label>
              <input type="text" id="inq_company" placeholder="例如：某某能源装备 / 化工研究院">
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label>输送介质类型</label>
              <select id="inq_product">
                <option value="高温二元熔盐 (565℃)">高温二元熔盐 (565℃ 光热/储能)</option>
                <option value="液态铅铋合金 (LBE 480~550℃)">液态铅铋合金 (LBE 480~550℃ 先进核能)</option>
                <option value="液态锂铅合金 (聚变堆回路)">液态锂铅合金 (聚变堆包层回路)</option>
                <option value="高温强酸强碱 / 腐蚀性介质">高温强酸强碱 / 腐蚀性介质 (化工)</option>
                <option value="高温熔融金属 / 熔渣">高温熔融金属 / 熔渣 (冶金)</option>
                <option value="耐高温金属-陶瓷复合轴承配套">耐高温金属-陶瓷复合轴承配套 (专利)</option>
                <option value="其他极端工况定制">其他极端工况定制</option>
              </select>
            </div>
            <div class="form-col">
              <label>运行温度区间</label>
              <select id="inq_temp">
                <option value="350℃ ~ 500℃ (中高温工况)">350℃ ~ 500℃ (中高温工况)</option>
                <option value="500℃ ~ 650℃ (典型熔盐/铅铋工况)" selected>500℃ ~ 650℃ (典型熔盐/铅铋工况)</option>
                <option value="650℃ ~ 850℃ (极限超高温工况)">650℃ ~ 850℃ (极限超高温工况)</option>
                <option value="350℃ 以下 (常规特种流体)">350℃ 以下 (常规特种流体)</option>
              </select>
            </div>
          </div>
          <div class="form-row full-width">
            <label>工况参数与技术要求 (流量 m³/h、扬程 m、耐压、介质密度等)</label>
            <textarea id="inq_message" rows="3" placeholder="请简要描述您的工程需求，例如：需要565℃二元熔盐主循环泵，流量150m³/h，扬程60m，要求全静密封零泄漏..."></textarea>
          </div>
          <button type="submit" class="btn-submit-inquiry" id="btnSubmitInquiry">
            <span>🚀 提交工况选型需求，获取技术方案与报价</span>
          </button>
          <div id="inquiryMsg" class="inquiry-msg"></div>
        </form>
      </div>
    </div>
  `;

  // 绑定表单提交与执照预览点击事件
  setTimeout(() => {
    const form = document.getElementById("inquiryForm");
    if (form) form.addEventListener("submit", handleInquirySubmit);

    const licenseBox = document.getElementById("licensePreviewBox");
    if (licenseBox) {
      licenseBox.addEventListener("click", () => {
        openLightbox(licenseGalleryIndex);
      });
    }
  }, 0);

  return sec;
}

// ===== 处理询盘提交 =====
async function handleInquirySubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("btnSubmitInquiry");
  const name = document.getElementById("inq_name").value.trim();
  const contact = document.getElementById("inq_contact").value.trim();
  const email = document.getElementById("inq_email").value.trim();
  const company = document.getElementById("inq_company").value.trim();
  const product = document.getElementById("inq_product").value;
  const temp = document.getElementById("inq_temp") ? document.getElementById("inq_temp").value : "";
  const rawMsg = document.getElementById("inq_message").value.trim();
  const message = temp ? `[温区: ${temp}] ` + rawMsg : rawMsg;

  if (!name || !contact) {
    showInquiryMsg("请填写您的姓名与联系方式", true);
    return;
  }

  btn.disabled = true;
  btn.innerHTML = "<span>⏳ 正在提交需求...</span>";

  try {
    const res = await DataManager.submitInquiry({
      name, contact, email, company, product, message
    });
    showInquiryMsg("🎉 " + (res.message || "需求已成功提交！我们的技术专家将在2小时内与您联系对接技术方案。"), false);
    document.getElementById("inquiryForm").reset();
  } catch (err) {
    showInquiryMsg("提交失败，请重试或直接致电 400-888-9999: " + err.message, true);
  } finally {
    btn.disabled = false;
    btn.innerHTML = "<span>🚀 提交工况选型需求，获取技术方案与报价</span>";
  }
}

function showInquiryMsg(msg, isError) {
  const el = document.getElementById("inquiryMsg");
  if (!el) return;
  el.textContent = msg;
  el.className = "inquiry-msg " + (isError ? "error" : "success");
  el.style.display = "block";
  setTimeout(() => {
    el.style.display = "none";
  }, 8000);
}

// ===== 绑定 Hero 交互 =====
function initHeroEvents() {
  const heroCard = document.getElementById("heroCardShowcase");
  if (heroCard) {
    heroCard.addEventListener("click", () => {
      // 打开第一张装备图
      openLightbox(0);
    });
  }
}

// ===== Lightbox 画廊逻辑 =====
function initLightbox() {
  const modal = document.getElementById("lightboxModal");
  const backdrop = document.getElementById("lightboxBackdrop");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  if (!modal) return;

  backdrop.addEventListener("click", closeLightbox);
  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", showPrevLightbox);
  nextBtn.addEventListener("click", showNextLightbox);

  // 键盘快捷键监听
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showPrevLightbox();
    if (e.key === "ArrowRight") showNextLightbox();
  });
}

function openLightbox(index) {
  if (!galleryItems || galleryItems.length === 0) return;
  currentLightboxIndex = Math.max(0, Math.min(index, galleryItems.length - 1));

  const modal = document.getElementById("lightboxModal");
  const img = document.getElementById("lightboxImg");
  const title = document.getElementById("lightboxTitle");
  const desc = document.getElementById("lightboxDesc");
  const counter = document.getElementById("lightboxCounter");

  const item = galleryItems[currentLightboxIndex];
  img.src = item.url;
  img.alt = item.caption;
  title.textContent = item.caption;
  desc.textContent = item.description;
  counter.textContent = `${currentLightboxIndex + 1} / ${galleryItems.length}`;

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const modal = document.getElementById("lightboxModal");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
}

function showPrevLightbox() {
  if (galleryItems.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex - 1 + galleryItems.length) % galleryItems.length;
  openLightbox(currentLightboxIndex);
}

function showNextLightbox() {
  if (galleryItems.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % galleryItems.length;
  openLightbox(currentLightboxIndex);
}

// ===== 移动端抽屉导航 =====
function initMobileNav() {
  const menuBtn = document.getElementById("mobileMenuBtn");
  const drawer = document.getElementById("mobileNavDrawer");
  const overlay = document.getElementById("mobileNavOverlay");
  const closeBtn = document.getElementById("mobileNavClose");

  if (!menuBtn || !drawer) return;

  menuBtn.addEventListener("click", () => toggleMobileNav());
  if (overlay) overlay.addEventListener("click", () => closeMobileNav());
  if (closeBtn) closeBtn.addEventListener("click", () => closeMobileNav());
}

function toggleMobileNav() {
  const drawer = document.getElementById("mobileNavDrawer");
  const overlay = document.getElementById("mobileNavOverlay");
  const menuBtn = document.getElementById("mobileMenuBtn");
  const isOpen = drawer.classList.contains("open");

  if (isOpen) {
    closeMobileNav();
  } else {
    drawer.classList.add("open");
    if (overlay) overlay.classList.add("open");
    if (menuBtn) menuBtn.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeMobileNav() {
  const drawer = document.getElementById("mobileNavDrawer");
  const overlay = document.getElementById("mobileNavOverlay");
  const menuBtn = document.getElementById("mobileMenuBtn");

  if (drawer) drawer.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  if (menuBtn) menuBtn.classList.remove("active");
  document.body.style.overflow = "";
}

// ===== 回到顶部按钮 =====
function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 350) {
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
    }
  }, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ===== Scrollspy 滚动高亮 =====
function initScrollspy() {
  const sections = document.querySelectorAll("section[id], #heroSection");
  const navLinks = document.querySelectorAll("#desktopNav a, #mobileNavLinks a");

  window.addEventListener("scroll", () => {
    let currentId = "";
    const scrollPos = window.scrollY + 120;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + currentId) {
        link.classList.add("active");
      }
    });
  }, { passive: true });
}

// ===== 辅助工具函数 =====
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(str) {
  if (!str) return "";
  return String(str).replace(/"/g, "&quot;");
}

if (typeof window !== "undefined") window.renderPage = renderPage;
if (typeof global !== "undefined") global.renderPage = renderPage;
