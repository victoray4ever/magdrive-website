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
  initCompareAnchorFallback();
});

// Hero「参数对标」按钮锚点兜底：原内置对标表已改为内容块，
// 若性能参数板块当前没有表格块（无 #compare 锚点），则回退跳转到该板块本身。
function initCompareAnchorFallback() {
  const btn = document.getElementById("heroBtn2");
  if (!btn || document.getElementById("compare")) return;
  btn.setAttribute("href", "#performance");
}

// ===== 页面整体渲染 =====
function renderPage() {
  galleryItems = [];

  // 1. 网站标题与导航
  const siteTitle = DataManager.getValue("meta", "site_title") || "迈德瑞（淮安）智能装备科技有限公司";
  const siteTitleEl = document.getElementById("siteTitle");
  if (siteTitleEl) siteTitleEl.textContent = siteTitle;
  document.title = siteTitle + (T("title_suffix") || "");

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

  // 3.1 网站副标题（后台「网站副标题」字段 -> Hero 副标题行）
  const siteSubtitle = DataManager.getValue("meta", "site_subtitle");
  const heroSubtitleEl = document.getElementById("heroSubtitle");
  if (heroSubtitleEl) {
    if (siteSubtitle) {
      heroSubtitleEl.textContent = siteSubtitle;
      heroSubtitleEl.style.display = "";
    } else {
      // 未配置时隐藏副标题行，避免出现空行
      heroSubtitleEl.style.display = "none";
    }
  }

  // 3.2 主标题文字颜色
  const heroTitleColor = DataManager.getValue("meta", "hero_title_color");
  const heroTitleEl = document.getElementById("heroTitle");
  if (heroTitleEl && heroTitleColor) {
    heroTitleEl.style.color = heroTitleColor;
  }

  // 3.3 Hero 首屏全部文案 + 五大指标看板（后台「首页与通用文案」驱动）
  renderHeroTexts();

  // 3.4 页面杂项文字（管理后台链接、移动端抽屉标题等）
  const adminLink = document.getElementById("adminLink");
  if (adminLink) adminLink.textContent = T("admin_link");
  const mobileNavTitle = document.getElementById("mobileNavTitle");
  if (mobileNavTitle) mobileNavTitle.textContent = T("mobile_nav_title");
  const mobileAdminLink = document.getElementById("mobileAdminLink");
  if (mobileAdminLink) mobileAdminLink.textContent = T("mobile_admin_link");

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

// ===== 全站文案读取辅助 =====
// 从 texts 目录取值；默认值已内置，未配置时返回空字符串
function T(key) {
  return DataManager.getValue("texts", key) || "";
}

// 富文本标题渲染：换行 -> <br>，**文字** -> 渐变高亮 span
function renderRichTitle(raw) {
  const lines = String(raw || "").split(/\r?\n/);
  return lines
    .map(line => escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<span class="gradient-text">$1</span>'))
    .join("<br>");
}

// ===== Hero 首屏文案渲染 =====
function renderHeroTexts() {
  // 顶部小标语
  const preTitle = document.getElementById("heroPreTitle");
  if (preTitle) preTitle.textContent = T("hero_pre_title");

  // 主标题（支持换行与 **渐变高亮** 语法）
  const heroTitle = document.getElementById("heroTitle");
  if (heroTitle) heroTitle.innerHTML = renderRichTitle(T("hero_title"));

  // 技术说明段
  const heroDesc = document.getElementById("heroDesc");
  if (heroDesc) heroDesc.textContent = T("hero_desc");

  // 亮点徽章（留空的徽章自动隐藏）
  const badgesBox = document.getElementById("heroBadges");
  if (badgesBox) {
    const badges = [1, 2, 3, 4].map(i => T("hero_badge_" + i)).filter(Boolean);
    badgesBox.innerHTML = badges.map(b => '<span class="hero-badge">' + escapeHtml(b) + '</span>').join("");
  }

  // 行动按钮文字（留空隐藏）
  for (let i = 1; i <= 3; i++) {
    const btn = document.getElementById("heroBtn" + i);
    if (btn) {
      const text = T("hero_btn_" + i);
      btn.textContent = text;
      btn.style.display = text ? "" : "none";
    }
  }

  // 右侧装备卡片浮动标签与悬浮提示
  const tagTop = document.getElementById("heroTagTop");
  if (tagTop) tagTop.textContent = T("hero_tag_top");
  const tagBottom = document.getElementById("heroTagBottom");
  if (tagBottom) tagBottom.textContent = T("hero_tag_bottom");
  const heroCard = document.getElementById("heroCardShowcase");
  if (heroCard) heroCard.setAttribute("title", T("hero_card_hint"));

  // 首页装备主图（后台「首页与通用文案 → 首页装备主图」可上传 / 替换 / 恢复默认）
  const heroPumpImg = document.getElementById("heroPumpImg");
  if (heroPumpImg) {
    const heroImage = DataManager.getMetaImage("hero_image");
    if (heroImage) heroPumpImg.src = heroImage;
  }

  // 五大核心指标看板
  renderHeroStats();
}

// ===== Hero 五大核心指标看板渲染 =====
function renderHeroStats() {
  const strip = document.getElementById("heroStatsStrip");
  if (!strip) return;
  strip.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const val = T("stat_" + i + "_val");
    const unit = T("stat_" + i + "_unit");
    const label = T("stat_" + i + "_label");
    const sub = T("stat_" + i + "_sub");
    if (!val && !label) continue; // 数值与名称均留空则跳过该指标
    const item = document.createElement("div");
    item.className = "stat-item";
    item.innerHTML =
      '<div class="stat-val">' + escapeHtml(val) +
      (unit ? '<span class="stat-unit">' + escapeHtml(unit) + '</span>' : '') +
      '</div>' +
      '<div class="stat-label">' + escapeHtml(label) + '</div>' +
      '<div class="stat-sub">' + escapeHtml(sub) + '</div>';
    strip.appendChild(item);
  }
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
  const title = DataManager.getValue(section, "section_title") || DataManager.sectionLabels[section];
  const description = DataManager.getValue(section, "section_description") || "";
  const textPosition = DataManager.getValue(section, "text_position") || "above";

  const sec = document.createElement("section");
  sec.className = "content-section section-" + section;
  sec.id = section;

  // 板块背景图片（后台各板块编辑器中上传，删除后回退纯色）
  applySectionBackground(sec, section);

  // 标题与描述
  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div class="section-tag">${escapeHtml(T("section_tag_" + section))}</div>
    <h2>${escapeHtml(title)}</h2>
    <p>${escapeHtml(description)}</p>
  `;

  // 内容块容器：图片块与表格块按后台顺序混排（图片可自定义尺寸，表格可增删行列）
  const grid = document.createElement("div");
  grid.className = "content-blocks blocks-" + section;
  let imgSeq = 0;
  let firstTableDone = false;
  DataManager.getBlocks(section).forEach(block => {
    if (block.t === "table") {
      // 性能参数板块的第一个表格块沿用 #compare 锚点（Hero「参数对标」按钮跳转目标）
      const anchor = (section === "performance" && !firstTableDone) ? "compare" : "";
      const tableEl = renderBlockTable(block, anchor);
      if (!tableEl) return; // 空表格（0 列）不渲染
      if (anchor) firstTableDone = true;
      grid.appendChild(tableEl);
    } else {
      imgSeq++;
      grid.appendChild(renderImageCard(section, block, imgSeq));
    }
  });

  // 组装 DOM
  if (textPosition === "below") {
    sec.appendChild(grid);
    sec.appendChild(header);
  } else {
    sec.appendChild(header);
    sec.appendChild(grid);
  }

  // 注：原内置「竞品参数对标表」已删除，改为由后台「内容块 · 表格块」自行添加
  // 注：原「客户实绩墙与产学研体系」展示区已移除。板块内容完全由后台「内容块」驱动，
  //     前台不再内置任何展示模板（客户卡片 / 产学研支柱 / 表格等一概不自动注入）。

  return sec;
}

// ===== 应用板块背景图（带浅色蒙版保证文字可读） =====
function applySectionBackground(el, section) {
  const bgImg = DataManager.getMetaImage("section_bg_" + section);
  if (bgImg) {
    el.style.backgroundImage =
      "linear-gradient(rgba(248,250,252,0.90), rgba(248,250,252,0.95)), url('" + bgImg + "')";
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
    el.style.backgroundRepeat = "no-repeat";
  }
}

// ===== 渲染单张图片/装备卡片（内容块驱动，支持自定义宽高） =====
function renderImageCard(section, block, seq) {
  const index = seq || 1;
  // 注：标题 / 描述一律以用户在后台填写的内容为准，未填写则不显示
  //     （旧版本会兜底成「使用方法 图示 1」这类自动生成文字，已移除）
  const caption = block.caption || "";
  const description = block.desc || "";
  const badge = block.badge || "";
  const imgUrl = DataManager.getBlockImageUrl(section, block);

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
  card.setAttribute("title", T("card_click_hint"));

  // 自定义显示尺寸（后台图片块「宽度 / 高度」，支持 px / % / 纯数字；留空则按默认网格自适应）
  const cssW = DataManager.normalizeCssSize(block.w);
  const rawH = String(block.h == null ? "" : block.h).trim();
  if (cssW) {
    card.classList.add("is-sized");
    card.style.flex = "0 0 auto";
    card.style.width = cssW;
    card.style.maxWidth = "100%";
    card.style.minWidth = "0"; // 允许真正缩小，不被内容最小宽度撑住
  }
  // 高度：百分比不能直接用（父级高度为 auto 会失效），换算成「相对卡片宽度的比例」
  let autoRatio = false;
  if (rawH && rawH !== "auto") {
    card.classList.add("is-sized");
    if (/^-?\d+(\.\d+)?%$/.test(rawH)) {
      const ratio = parseFloat(rawH) / 100;
      if (ratio > 0) card.dataset.thumbRatio = String(ratio);
    } else {
      card.dataset.thumbHeight = DataManager.normalizeCssSize(rawH);
    }
  } else if (cssW) {
    autoRatio = true; // 只设宽度：高度按原图比例自适应，保证「整体等比缩小」
  }

  // 卡片高亮角标（后台每个图片块的「角标」字段，留空则不显示）
  const badgeHtml = badge ? '<span class="card-badge ' + getCardBadgeClass(section, index) + '">' + escapeHtml(badge) + '</span>' : "";

  // 标题与描述都为空时整块不渲染，避免留下空白文字区（只显示图片本身）
  const bodyHtml = (caption || description) ? `
    <div class="card-body">
      ${caption ? '<div class="card-caption">' + escapeHtml(caption) + '</div>' : ''}
      ${description ? '<div class="card-description">' + escapeHtml(description) + '</div>' : ''}
    </div>` : '';

  card.innerHTML = `
    <div class="image-card-thumb-wrap">
      ${badgeHtml}
      <img src="${imgUrl}" alt="${escapeAttr(caption)}" loading="lazy"
        onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 400 240\'%3E%3Crect width=\'400\' height=\'240\' fill=\'%23eceff1\'/%3E%3Ctext x=\'200\' y=\'120\' text-anchor=\'middle\' font-size=\'15\' fill=\'%2390a4ae\'%3E图片加载中...%3C/text%3E%3C/svg%3E'">
      <div class="zoom-hint">${escapeHtml(T("zoom_hint"))}</div>
    </div>
    ${bodyHtml}`;

  // 应用自定义高度 / 比例（DOM 生成后再设置，避免字符串拼接被转义影响）
  const thumbWrap = card.querySelector(".image-card-thumb-wrap");
  const thumbImg = card.querySelector("img");
  if (thumbWrap) {
    if (card.dataset.thumbHeight) {
      thumbWrap.style.height = card.dataset.thumbHeight;
      thumbWrap.style.minHeight = "0";
    } else if (card.dataset.thumbRatio) {
      thumbWrap.style.height = "auto";
      thumbWrap.style.aspectRatio = "1 / " + card.dataset.thumbRatio;
    } else if (autoRatio && thumbImg) {
      // 只设宽度：图片加载后按原始宽高比收缩缩略图区，图片整体等比变小
      const applyNaturalRatio = () => {
        if (thumbImg.naturalWidth && thumbImg.naturalHeight) {
          thumbWrap.style.height = "auto";
          thumbWrap.style.aspectRatio = thumbImg.naturalWidth + " / " + thumbImg.naturalHeight;
        }
      };
      thumbImg.addEventListener("load", applyNaturalRatio);
      if (thumbImg.complete) applyNaturalRatio(); // 命中缓存时 load 可能已触发
    }
  }
  // 填充方式：cover = 裁切填满（默认）；contain = 完整缩放，小尺寸下图片整体缩小、不留裁切
  if (thumbImg) thumbImg.style.objectFit = block.fit === "contain" ? "contain" : "cover";

  // 点击打开 Lightbox
  card.addEventListener("click", () => {
    openLightbox(galleryIndex);
  });

  return card;
}

// ===== 渲染内容块表格（表头 / 行列全部由后台增删编辑，样式复用对标表）=====
function renderBlockTable(block, anchorId) {
  // 没有任何列时不渲染：前台不兜任何模板表格，表格结构完全由后台内容块决定
  if (!block.head || !block.head.length) return null;

  const wrap = document.createElement("div");
  wrap.className = "compare-table-container block-table-container";
  if (anchorId) wrap.id = anchorId;

  const cols = block.head;
  const hlRaw = parseInt(block.hl, 10);
  const hl = isNaN(hlRaw) ? 1 : hlRaw; // -1 = 不高亮（不匹配任何列索引）
  const cellCls = c => (c === hl ? ' class="highlight-col"' : "");

  const headHtml = cols.map((h, c) => `<th${cellCls(c)}>${escapeHtml(h)}</th>`).join("");
  const bodyHtml = (block.rows || []).map(row =>
    "<tr>" + cols.map((_, c) => {
      const val = row[c] || "";
      return c === 0 ? `<td><strong>${escapeHtml(val)}</strong></td>`
        : `<td${cellCls(c)}>${c === hl ? "<strong>" + escapeHtml(val) + "</strong>" : escapeHtml(val)}</td>`;
    }).join("") + "</tr>"
  ).join("");

  wrap.innerHTML = `
    ${block.title ? `<div class="compare-table-header"><h3>${escapeHtml(block.title)}</h3>${block.subtitle ? `<p>${escapeHtml(block.subtitle)}</p>` : ""}</div>` : ""}
    <div class="table-responsive">
      <table class="compare-table block-table">
        <thead><tr>${headHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>
  `;
  return wrap;
}

// 获取卡片角标样式类（按板块与序号循环配色，保持原有视觉风格）
function getCardBadgeClass(section, index) {
  const classMap = {
    product: ["badge-hot", "badge-patent", "badge-deal", "badge-safe"],
    performance: ["badge-advantage", "badge-safe", "badge-pain"],
    usage: ["badge-advantage", "badge-safe", "badge-deal"],
    application: ["badge-hot", "badge-deal", "badge-safe", "badge-advantage"]
  };
  const list = classMap[section] || ["badge-advantage"];
  return list[(index - 1) % list.length];
}

// ===== 解析表单下拉选项（每行一个，* 开头为默认选中） =====
function parseFormOptions(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      if (s.startsWith("*")) return { text: s.slice(1).trim(), selected: true };
      return { text: s, selected: false };
    });
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
  // 企业资质两项（信用代码条目 / 营业执照卡片）均为「数据驱动、留空自动隐藏」：
  // 清空信用代码 → 该条目不出现在联系卡片；未上传执照图片 → 执照卡片不出现。
  // 想恢复只要在后台把值填回去即可，不写死在前台代码里。
  const creditCode = DataManager.getValue("contact", "credit_code") || "";
  const legalPerson = DataManager.getValue("contact", "legal_person") || "张剑";
  const registeredCapital = DataManager.getValue("contact", "registered_capital") || "450万元整";
  const formTitle = DataManager.getValue("contact", "form_title") || "在线技术咨询与工况参数选型定制";
  const formSubtitle = DataManager.getValue("contact", "form_subtitle") || "请提交您的介质类型 (熔盐/液态金属/强酸碱)、运行温区、流量扬程或技术要求，工程师团队2小时内对接";
  const licenseImg = DataManager.getMetaImage("license") || "";

  // 营业执照卡片说明（支持占位符替换）
  const licenseSub = T("license_sub_template")
    .replace(/\{legal_person\}/g, legalPerson)
    .replace(/\{registered_capital\}/g, registeredCapital);

  // 将营业执照加入画廊（标题与说明同样支持占位符）；未上传执照图片时不加入画廊
  const licenseGalleryIndex = licenseImg ? galleryItems.length : -1;
  if (licenseImg) {
    galleryItems.push({
      url: licenseImg,
      caption: T("license_caption_template").replace(/\{company\}/g, company),
      description: T("license_desc_template")
        .replace(/\{credit_code\}/g, creditCode)
        .replace(/\{legal_person\}/g, legalPerson)
        .replace(/\{registered_capital\}/g, registeredCapital),
      section: "contact"
    });
  }

  // 联系方式条目（邮箱附加与时间附加说明可留空）
  const emailExtra = T("contact_email_extra");
  const hoursNote = T("contact_hours_note");

  // 表单下拉选项
  const productOptions = parseFormOptions(T("form_product_options"));
  const tempOptions = parseFormOptions(T("form_temp_options"));

  // 板块背景图
  applySectionBackground(sec, "contact");

  sec.innerHTML = `
    <div class="section-header">
      <div class="section-tag">${escapeHtml(T("contact_tag"))}</div>
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
              <h4>${escapeHtml(T("contact_phone_label"))}</h4>
              <p>${escapeHtml(phone)}</p>
            </div>
          </div>
          <div class="contact-info-item">
            <div class="contact-icon">✉️</div>
            <div class="contact-details">
              <h4>${escapeHtml(T("contact_email_label"))}</h4>
              <p>${escapeHtml(email)}${emailExtra ? ' · ' + escapeHtml(emailExtra) : ''}</p>
            </div>
          </div>
          <div class="contact-info-item">
            <div class="contact-icon">📍</div>
            <div class="contact-details">
              <h4>${escapeHtml(T("contact_address_label"))}</h4>
              <p>${escapeHtml(address)}</p>
            </div>
          </div>
          <div class="contact-info-item">
            <div class="contact-icon">🕒</div>
            <div class="contact-details">
              <h4>${escapeHtml(T("contact_hours_label"))}</h4>
              <p>${escapeHtml(hours)}${hoursNote ? ' ' + escapeHtml(hoursNote) : ''}</p>
            </div>
          </div>
          ${creditCode ? `
          <div class="contact-info-item">
            <div class="contact-icon">📜</div>
            <div class="contact-details">
              <h4>${escapeHtml(T("contact_credit_label"))}</h4>
              <p style="font-family:monospace;font-size:14px;letter-spacing:0.8px;font-weight:600;">${escapeHtml(creditCode)}</p>
            </div>
          </div>` : ''}
        </div>

        <!-- 营业执照官方资质认证小卡片（未上传执照图片时整块不渲染）-->
        ${licenseImg ? `
        <div class="license-preview-box" id="licensePreviewBox" title="点击全屏放大查看营业执照原件">
          <img src="${licenseImg}" alt="营业执照原件" class="license-thumb">
          <div class="license-text-block">
            <div class="license-title">${escapeHtml(T("license_title"))}</div>
            <div class="license-sub">${escapeHtml(licenseSub)}</div>
          </div>
          <span class="license-zoom-icon">🔍</span>
        </div>` : ''}
      </div>

      <!-- 右侧：专业工况参数选型定制表单 -->
      <div class="inquiry-form-card">
        <h3>${escapeHtml(formTitle)}</h3>
        <p class="inquiry-subtitle">${escapeHtml(formSubtitle)}</p>
        <form class="inquiry-form" id="inquiryForm">
          <div class="form-row">
            <div class="form-col">
              <label>${escapeHtml(T("form_label_name"))}<span class="req">*</span></label>
              <input type="text" id="inq_name" placeholder="${escapeAttr(T("form_ph_name"))}" required>
            </div>
            <div class="form-col">
              <label>${escapeHtml(T("form_label_contact"))}<span class="req">*</span></label>
              <input type="tel" id="inq_contact" placeholder="${escapeAttr(T("form_ph_contact"))}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label>${escapeHtml(T("form_label_email"))}</label>
              <input type="email" id="inq_email" placeholder="${escapeAttr(T("form_ph_email"))}">
            </div>
            <div class="form-col">
              <label>${escapeHtml(T("form_label_company"))}</label>
              <input type="text" id="inq_company" placeholder="${escapeAttr(T("form_ph_company"))}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-col">
              <label>${escapeHtml(T("form_label_product"))}</label>
              <select id="inq_product">
                ${productOptions.map(o => '<option value="' + escapeAttr(o.text) + '">' + escapeHtml(o.text) + '</option>').join('\n                ')}
              </select>
            </div>
            <div class="form-col">
              <label>${escapeHtml(T("form_label_temp"))}</label>
              <select id="inq_temp">
                ${tempOptions.map(o => '<option value="' + escapeAttr(o.text) + '"' + (o.selected ? ' selected' : '') + '>' + escapeHtml(o.text) + '</option>').join('\n                ')}
              </select>
            </div>
          </div>
          <div class="form-row full-width">
            <label>${escapeHtml(T("form_label_message"))}</label>
            <textarea id="inq_message" rows="3" placeholder="${escapeAttr(T("form_ph_message"))}"></textarea>
          </div>
          <button type="submit" class="btn-submit-inquiry" id="btnSubmitInquiry">
            <span>${escapeHtml(T("form_submit_text"))}</span>
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
    if (licenseBox && licenseGalleryIndex >= 0) {
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
  btn.innerHTML = "<span>" + escapeHtml(T("form_submitting_text")) + "</span>";

  try {
    const res = await DataManager.submitInquiry({
      name, contact, email, company, product, message
    });
    showInquiryMsg((res && res.message) ? res.message : T("form_success_msg"), false);
    document.getElementById("inquiryForm").reset();
  } catch (err) {
    showInquiryMsg(T("form_error_msg").replace(/\{phone\}/g, phone || "400-888-9999") + err.message, true);
  } finally {
    btn.disabled = false;
    btn.innerHTML = "<span>" + escapeHtml(T("form_submit_text")) + "</span>";
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
