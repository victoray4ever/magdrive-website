/**
 * admin.js - 管理后台核心逻辑
 * 支持全局设置、各板块编辑、联系信息配置、客户询盘管理、图片裁剪与服务端落盘保存
 */

document.addEventListener('DOMContentLoaded', async () => {
  await DataManager.init();
  if (DataManager.isLoggedIn()) {
    showAdminPanel();
  } else {
    showLogin();
  }
  // 登录表单
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
});

// ===== 登录与登出 =====
function showLogin() {
  document.getElementById('loginPanel').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
  document.getElementById('loginPanel').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  renderAdminPanel();
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('loginError');
  if (DataManager.login(username, password)) {
    showAdminPanel();
  } else {
    errorEl.textContent = '用户名或密码错误，请重试';
  }
}

function handleLogout() {
  DataManager.logout();
  showLogin();
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

// ===== 渲染管理面板 =====
function renderAdminPanel() {
  const panel = document.getElementById('adminPanel');
  const headerBg = DataManager.getValue('meta', 'header_bg_color');
  const logoImg = DataManager.getMetaImage('logo');
  const logoHtml = logoImg
    ? '<img src="' + logoImg + '" alt="Logo" style="max-height:32px;max-width:100px;object-fit:contain;margin-right:10px;vertical-align:middle;">'
    : '';

  const serverBadge = DataManager._hasBackend
    ? '<span class="server-status-badge"><span class="status-dot"></span> 本地服务已连接 (直接写入磁盘)</span>'
    : '<span class="server-status-badge"><span class="status-dot offline"></span> 纯静态模式 (使用浏览器缓存)</span>';

  panel.innerHTML = `
    <div class="admin-topbar" ${headerBg ? 'style="background:' + headerBg + ';"' : ''}>
      <h1>${logoHtml}管理后台 - 轴承产品展示</h1>
      <div class="actions">
        ${serverBadge}
        <a href="index.html" class="btn-view-site" target="_blank">查看前台</a>
        <button onclick="handleResetDefaults()" class="btn-reset-defaults" title="重置回初始设置">恢复默认</button>
        <button onclick="handleLogout()" class="btn-logout">退出登录</button>
      </div>
    </div>
    <div class="admin-body">
      <!-- 全局设置 -->
      <div style="background:#fff;border-radius:10px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,0.08);margin-bottom:24px;">
        <h3 style="margin-bottom:16px;color:#0d47a1;">网站全局设置</h3>
        <div class="form-group">
          <label>网站标题</label>
          <input type="text" id="meta_site_title" value="${escapeAttr(DataManager.getValue('meta','site_title'))}">
        </div>
        <div class="form-group">
          <label>网站副标题</label>
          <input type="text" id="meta_site_subtitle" value="${escapeAttr(DataManager.getValue('meta','site_subtitle'))}">
        </div>
        <div class="form-group">
          <label>导航栏文字（逗号分隔整串快速修改；推荐在「首页与通用文案 → 🌐 前台导航栏名称」逐项编辑，保存时以逐项编辑为准）</label>
          <input type="text" id="meta_nav_text" value="${escapeAttr(DataManager.getValue('meta','nav_text'))}">
        </div>
        <div class="form-group">
          <label>页脚版权文字</label>
          <input type="text" id="meta_footer_text" value="${escapeAttr(DataManager.getValue('meta','footer_text'))}">
        </div>
        <div class="form-row" style="display:flex;gap:20px;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:180px;">
            <label>Header 背景色</label>
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="color" id="meta_header_bg_color" value="${escapeAttr(DataManager.getValue('meta','header_bg_color') || '#0d47a1')}" style="width:60px;height:40px;padding:2px;border:2px solid var(--border);border-radius:6px;" oninput="document.getElementById('meta_header_bg_color_text').value=this.value">
              <input type="text" id="meta_header_bg_color_text" value="${escapeAttr(DataManager.getValue('meta','header_bg_color') || '#0d47a1')}" style="width:100px;padding:8px;border:2px solid var(--border);border-radius:6px;font-size:14px;" oninput="document.getElementById('meta_header_bg_color').value=this.value">
            </div>
          </div>
          <div class="form-group" style="flex:1;min-width:180px;">
            <label>Hero 背景色</label>
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="color" id="meta_hero_bg_color" value="${escapeAttr(DataManager.getValue('meta','hero_bg_color') || '#1565c0')}" style="width:60px;height:40px;padding:2px;border:2px solid var(--border);border-radius:6px;" oninput="document.getElementById('meta_hero_bg_color_text').value=this.value">
              <input type="text" id="meta_hero_bg_color_text" value="${escapeAttr(DataManager.getValue('meta','hero_bg_color') || '#1565c0')}" style="width:100px;padding:8px;border:2px solid var(--border);border-radius:6px;font-size:14px;" oninput="document.getElementById('meta_hero_bg_color').value=this.value">
            </div>
          </div>
          <div class="form-group" style="flex:1;min-width:180px;">
            <label>主标题文字颜色</label>
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="color" id="meta_hero_title_color" value="${escapeAttr(DataManager.getValue('meta','hero_title_color') || '#ffffff')}" style="width:60px;height:40px;padding:2px;border:2px solid var(--border);border-radius:6px;" oninput="document.getElementById('meta_hero_title_color_text').value=this.value">
              <input type="text" id="meta_hero_title_color_text" value="${escapeAttr(DataManager.getValue('meta','hero_title_color') || '#ffffff')}" style="width:100px;padding:8px;border:2px solid var(--border);border-radius:6px;font-size:14px;" oninput="document.getElementById('meta_hero_title_color').value=this.value">
            </div>
          </div>
        </div>
        <!-- Logo 图片（通用图片控件） -->
        ${renderMetaImageControl('logo', 'Logo 图片（替换齿轮图标）', '建议使用正方形透明底 PNG，前台按最大高度 36px 显示。', { width: 72, height: 48, fit: 'contain', deleteLabel: '删除 Logo' })}
      </div>

      <!-- Tab 导航（标签文字可在「首页与通用文案」Tab 内自定义） -->
      <div class="admin-tabs" id="adminTabs">${renderAdminTabsInner(DataManager.sections[0] || 'texts')}</div>

      <!-- Tab 内容 -->
      <div id="tabContents">
        <div class="tab-content" id="tab_texts">${renderTextsTab()}</div>
        ${DataManager.sections.map((s, i) =>
          `<div class="tab-content ${i === 0 ? 'active' : ''}" id="tab_${s}">${renderSectionEditor(s)}</div>`
        ).join('')}
        <div class="tab-content" id="tab_contact">${renderContactEditor()}</div>
        <div class="tab-content" id="tab_inquiries">${renderInquiriesPanel()}</div>
      </div>

      <!-- 保存栏 -->
      <div class="save-bar">
        <button class="btn-export" onclick="exportData()">导出 CSV 文件</button>
        <button class="btn-save" onclick="saveAll()">💾 保存所有更改 (直接落盘)</button>
      </div>
    </div>
    <div class="toast" id="toast"></div>
  `;

  // 默认如果是询盘页则加载数据
  loadInquiriesList();
}

// ===== 后台标签栏名称编辑组 =====
function renderAdminTabLabelsGroup() {
  const desc = {
    texts: '全站文案页（第一个标签）',
    contact: '联系方式页',
    inquiries: '询盘列表页'
  };
  const inputs = DataManager.ADMIN_TAB_ORDER.map(id => {
    const label = desc[id] || ('「' + (DataManager.sectionLabels[id] || id) + '」板块页');
    return `
      <div class="form-group">
        <label>${escapeHtml(label)}</label>
        <input type="text" id="admintab_${id}" value="${escapeAttr(DataManager.getAdminTabLabel(id))}" placeholder="${escapeAttr(DataManager.ADMIN_TAB_DEFAULTS[id] || '')}">
      </div>`;
  }).join('');
  return `
    <div class="text-group-title">🧭 后台标签栏名称</div>
    <p style="margin:-6px 0 12px;color:#64748b;font-size:13px;">自定义管理后台顶部这一排标签的文字（仅影响后台界面，<b>不影响网站前台</b>；前台顶部导航栏的文字请在下方「🌐 前台导航栏名称」中修改）。清空某一项即恢复该标签的默认名称。</p>
    <div class="admin-subgrid">${inputs}</div>
  `;
}

// ===== 前台导航栏名称编辑组（网站前台顶部导航，桌面端一行 + 手机端抽屉菜单同步生效） =====
function getNavDefaultLabels() {
  return ["产品展示", "性能参数", "使用方法", "应用工况", "联系我们"];
}

// 解析当前前台导航项（与 main.js renderNavigation 完全一致的取值与回退逻辑）
function getNavLabels() {
  const navText = DataManager.getValue("meta", "nav_text") || getNavDefaultLabels().join(",");
  const labels = navText.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  return labels.length ? labels : [""];
}

function renderNavItemsInner(labels) {
  const items = labels || getNavLabels();
  const defaults = getNavDefaultLabels();
  const rows = items.map((label, i) => `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
      <input type="text" class="nav-item-input" value="${escapeAttr(label)}" placeholder="${escapeAttr(defaults[i] || '导航项文字')}" title="第 ${i + 1} 项：前台导航栏第 ${i + 1} 个菜单的文字" oninput="var h=this.closest('#navItemsHolder');if(h)h.dataset.dirty='1';">
      <button type="button" onclick="removeNavItem(${i})" title="删除这一项" style="width:36px;height:40px;flex:none;border:2px solid var(--border);border-radius:6px;background:#fff;color:#ef4444;cursor:pointer;font-size:15px;">✕</button>
    </div>`).join('');
  return rows + `<button type="button" onclick="addNavItem()" style="padding:8px 16px;border:2px dashed var(--border);border-radius:6px;background:#fff;color:#0d47a1;cursor:pointer;font-size:13px;">＋ 添加导航项</button>`;
}

// 按当前 DOM 顺序收集所有导航项输入框的值（保留空串占位，便于增删）
function collectNavItemValues() {
  return Array.prototype.map.call(document.querySelectorAll('#navItemsHolder .nav-item-input'), el => el.value.trim());
}

function rerenderNavItems(values) {
  const holder = document.getElementById('navItemsHolder');
  if (!holder) return;
  holder.innerHTML = renderNavItemsInner(values && values.length ? values : [""]);
}

function markNavDirty() {
  const holder = document.getElementById('navItemsHolder');
  if (holder) holder.dataset.dirty = '1';
}

function addNavItem() {
  const values = collectNavItemValues();
  values.push("");
  rerenderNavItems(values);
  markNavDirty();
}

function removeNavItem(i) {
  const values = collectNavItemValues();
  values.splice(i, 1);
  rerenderNavItems(values.length ? values : [""]);
  markNavDirty();
}

function renderNavLabelsGroup() {
  return `
    <div class="text-group-title">🌐 前台导航栏名称</div>
    <p style="margin:-6px 0 12px;color:#64748b;font-size:13px;">网站前台顶部的导航菜单文字（桌面端导航条 + 手机端抽屉菜单同步生效），每项按顺序对应跳转的页面板块，可增删项数。全部清空并保存则恢复默认五项导航。</p>
    <div id="navItemsHolder" style="max-width:560px;">${renderNavItemsInner()}</div>
  `;
}

// ===== 「首页与通用文案」Tab =====
function renderTextsTab() {
  const groups = ['hero', 'hero_stats', 'section_tags', 'cards', 'misc'];
  return `
    <h3 style="margin-bottom:6px;color:#0d47a1;">首页与通用文案设置</h3>
    <p style="margin:0 0 18px;color:#64748b;font-size:13px;">页面上的全部文字均在此修改。留空的徽章 / 按钮会在前台自动隐藏；主标题支持换行与 **渐变高亮** 语法。</p>

    ${renderAdminTabLabelsGroup()}

    ${renderNavLabelsGroup()}

    <div class="text-group-title">🖼️ 首页图片（背景大图 / 装备主图）</div>
    ${renderMetaImageControl(
      'hero_bg',
      '首页背景大图（可选）',
      '未上传时使用「Hero 背景色」渐变；上传后前台会自动叠加深色蒙版，保证白色文字可读。',
      { width: 150, height: 84, deleteLabel: '删除背景图' }
    )}
    ${renderMetaImageControl(
      'hero_image',
      '首页装备主图（首屏右侧大图）',
      '建议使用透明底或深色底装备图；点击前台该图可打开大图画廊。删除后恢复内置装备图。',
      { width: 110, height: 84, fit: 'contain', deleteLabel: '恢复默认图' }
    )}

    ${groups.map(g => renderTextGroup(g)).join('')}
  `;
}

// ===== 渲染一组文案字段（带分组标题） =====
function renderTextGroup(group) {
  const entries = DataManager.getTexts(group);
  if (!entries.length) return '';
  const groupLabel = DataManager.textGroupLabels[group] || group;
  return `
    <div class="text-group-title">${groupLabel}</div>
    <div class="admin-subgrid">
      ${entries.map(t => renderTextField(t)).join('')}
    </div>
  `;
}

// ===== 渲染单个文案字段 =====
function renderTextField(t) {
  const val = DataManager.getValue('texts', t.key) || '';
  const id = 'texts_' + t.key;
  if (t.type === 'textarea') {
    return `
      <div class="form-group" style="grid-column:1 / -1;">
        <label>${t.label}</label>
        <textarea id="${id}" rows="${t.key === 'hero_title' ? 3 : 4}">${escapeHtml(val)}</textarea>
      </div>`;
  }
  return `
      <div class="form-group">
        <label>${t.label}</label>
        <input type="text" id="${id}" value="${escapeAttr(val)}">
      </div>`;
}

// ===== 通用 meta 图片管理控件（上传 / 替换 / 删除）=====
// 全站所有「背景图 / 主图 / Logo」类图片共用同一套控件，避免各处重复实现。
const META_IMG_CONFIG = {}; // holderId -> { key, label, hint, opts }

function metaImgIds(key) {
  const safe = String(key).replace(/[^a-zA-Z0-9_]/g, '_');
  return { previewId: 'metaimg_pv_' + safe, holderId: 'metaimg_' + safe };
}

function metaImageControlInner(key, label, hint, opts) {
  opts = opts || {};
  const ids = metaImgIds(key);
  META_IMG_CONFIG[ids.holderId] = { key: key, label: label, hint: hint, opts: opts };
  const current = DataManager.getMetaImage(key);
  const w = opts.width || 120;
  const h = opts.height || 68;
  const fit = opts.fit || 'cover';
  const delLabel = opts.deleteLabel || '删除图片';
  return `
    <div class="form-group" style="padding:16px;background:var(--primary-light);border-radius:8px;">
      <label style="color:var(--primary-dark);font-size:15px;">${label}</label>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:10px;">
        <img id="${ids.previewId}" src="${current || ''}" style="width:${w}px;height:${h}px;object-fit:${fit};border:2px solid var(--border);border-radius:6px;background:#fff;${current ? '' : 'display:none;'}">
        <label class="upload-btn" style="display:inline-block;padding:9px 18px;background:var(--primary);color:#fff;border-radius:6px;font-size:13px;cursor:pointer;">
          ${current ? '🔄 替换图片' : '⬆️ 上传图片'}
          <input type="file" accept="image/*" style="display:none;" onchange="handleMetaImageUpload(event, '${key}', '${ids.previewId}', '${ids.holderId}')">
        </label>
        ${current ? `<button class="remove-btn" style="display:inline-block;padding:8px 14px;background:#fff0f0;color:#d32f2f;border:1px solid #ef9a9a;border-radius:6px;font-size:13px;cursor:pointer;" onclick="removeMetaImageUpload('${key}', '${ids.previewId}', '${ids.holderId}')">🗑️ ${delLabel}</button>` : ''}
        ${hint ? `<span style="font-size:12px;color:var(--text-secondary);flex-basis:100%;line-height:1.6;">${hint}</span>` : ''}
      </div>
    </div>`;
}

// 返回带 holder 的完整控件（holder 用于上传/删除后局部刷新）
function renderMetaImageControl(key, label, hint, opts) {
  const ids = metaImgIds(key);
  return `<div id="${ids.holderId}">${metaImageControlInner(key, label, hint, opts)}</div>`;
}

function refreshMetaImageControl(holderId) {
  const cfg = META_IMG_CONFIG[holderId];
  const holder = document.getElementById(holderId);
  if (cfg && holder) holder.innerHTML = metaImageControlInner(cfg.key, cfg.label, cfg.hint, cfg.opts);
}

// ===== 板块背景图控件（复用通用图片控件）=====
function renderSectionBgControl(section) {
  return renderMetaImageControl(
    'section_bg_' + section,
    '🖼️ 板块背景图片（可选，删除后恢复纯色背景）',
    '前台将自动叠加浅色蒙版保证文字可读',
    { width: 120, height: 68, deleteLabel: '删除背景图' }
  );
}

function refreshSectionBgControl(section) {
  refreshMetaImageControl(metaImgIds('section_bg_' + section).holderId);
}



// ===== 渲染单个板块编辑器 =====
function renderSectionEditor(section) {
  const title = DataManager.getValue(section, 'section_title');
  const description = DataManager.getValue(section, 'section_description');
  const textPosition = DataManager.getValue(section, 'text_position') || 'above';
  const blocks = DataManager.getBlocks(section);

  let html = `
    <div class="form-group">
      <label>板块标题</label>
      <input type="text" id="${section}_section_title" value="${escapeAttr(title)}">
    </div>
    <div class="form-group">
      <label>板块描述</label>
      <textarea id="${section}_section_description">${escapeHtml(description)}</textarea>
    </div>
    <div class="form-group">
      <label>文字位置</label>
      <select id="${section}_text_position">
        <option value="above" ${textPosition === 'above' ? 'selected' : ''}>文字在图片上方</option>
        <option value="below" ${textPosition === 'below' ? 'selected' : ''}>文字在图片下方</option>
      </select>
    </div>
    <!-- 板块背景图管理（上传 / 替换 / 删除） -->
    ${renderSectionBgControl(section)}
    <div class="text-group-title">🧩 板块内容块（图片 / 表格 可自由增删与排序）</div>
    <p style="margin:-6px 0 12px;color:#64748b;font-size:13px;">图片块可自定义显示宽高（填 <b>200</b> / <b>200px</b> / <b>50%</b> 均可，只填宽度时高度按原图比例自动缩放，留空则自适应）；「填充方式」决定图片是裁切填满还是完整缩放（整体变小、不裁切）。表格块可增删行列、设置高亮列。调整后点击「保存所有更改」落盘。</p>
    <div class="blocks-holder" id="${blocksHolderId(section)}">${renderBlockItems(section, blocks)}</div>
    <div class="blocks-add">
      <button type="button" onclick="addBlock('${section}', 'image')">➕ 添加图片</button>
      <button type="button" onclick="addBlock('${section}', 'table')">📊 添加表格</button>
      <span class="blocks-add-dim">列 <input type="number" id="newTblCols_${section}" min="1" max="20" value="3"></span>
      <span class="blocks-add-dim">行 <input type="number" id="newTblRows_${section}" min="0" max="100" value="4"></span>
      <span class="blocks-add-tip">新建表格为<strong>空白网格</strong>，不含任何预置内容，全部自行填写</span>
    </div>
  `;

  // 注：原「竞品对标表」文案编辑组已移除，表格统一由上方「内容块」自行添加
  // 注：原「客户实绩墙与产学研体系」文案编辑组已移除（前台对应展示区已删除）
  return html;
}

// ===== 内容块（图片 / 表格）编辑器 =====
// 约定：块顺序 = DOM 顺序；任一结构性操作（增删/排序/表格行列）都先从 DOM 收值，再整体重渲染，
//       保证用户已输入但尚未保存的文字不会丢失。
function blocksHolderId(section) { return 'blocks_' + section; }

function collectBlocks(section) {
  const holder = document.getElementById(blocksHolderId(section));
  if (!holder) return DataManager.getBlocks(section);
  const blocks = [];
  Array.prototype.forEach.call(holder.querySelectorAll('.block-item'), function (item) {
    const type = item.dataset.type;
    const id = item.dataset.id || '';
    const val = function (sel) { const el = item.querySelector(sel); return el ? el.value : ''; };
    if (type === 'table') {
      const head = Array.prototype.map.call(item.querySelectorAll('.tbl-head-input'), el => el.value.trim());
      const rows = Array.prototype.map.call(item.querySelectorAll('.tbl-row'), tr =>
        Array.prototype.map.call(tr.querySelectorAll('.tbl-cell-input'), el => el.value.trim()));
      // 高亮列：-1 = 不高亮；其余为列索引（0 起）
      const hlRaw = parseInt(val('.tbl-hl'), 10);
      blocks.push({
        t: 'table', id: id,
        title: val('.blk-title'),
        subtitle: val('.blk-subtitle'),
        head: head, rows: rows,
        hl: isNaN(hlRaw) ? 1 : hlRaw
      });
    } else {
      const srcEl = item.querySelector('.blk-src');
      const rawSrc = srcEl ? srcEl.value : '';
      blocks.push({
        t: 'image', id: id,
        slot: parseInt(item.dataset.slot || '0', 10) || 0,
        // UPLOADED = 刚上传尚未落盘：保留原 src，由 saveToServer 回填真实路径
        src: rawSrc === 'UPLOADED' ? (item.dataset.src || '') : rawSrc,
        caption: val('.blk-caption'),
        desc: val('.blk-desc'),
        badge: val('.blk-badge'),
        w: val('.blk-w'),
        h: val('.blk-h'),
        fit: val('.blk-fit')
      });
    }
  });
  return blocks;
}

function rerenderBlocks(section, blocks) {
  const holder = document.getElementById(blocksHolderId(section));
  if (!holder) return;
  holder.innerHTML = renderBlockItems(section, blocks || collectBlocks(section));
}

// 落盘完成后，把 DataManager 里最终的图片路径同步回编辑区 DOM。
// ★ 必要性：collectBlocks 以 DOM 为唯一来源，而隐藏的 .blk-src 可能停留在「上传前的空值」。
//   用户在 A 板块传完图后去改 B 板块、再点一次保存时，collectBlocks(A) 读到空 src 就会把
//   刚落盘的好路径覆盖掉，表现为「图片换成自己的了，改完别处一保存又变回默认图」。
//   落盘后立刻回写，DOM 与实际数据就永远一致，二次保存也不会丢图。
function syncBlockImageSrcs() {
  DataManager.sections.forEach(function (section) {
    const holder = document.getElementById(blocksHolderId(section));
    if (!holder) return;
    const byId = {};
    DataManager.getBlocks(section).forEach(b => { byId[String(b.id)] = b; });
    Array.prototype.forEach.call(holder.querySelectorAll('.block-item'), function (item) {
      if (item.dataset.type !== 'image') return;
      const b = byId[String(item.dataset.id || '')];
      if (!b) return;
      const srcEl = item.querySelector('.blk-src');
      // 一律回写最终路径：'UPLOADED' 只是「等落盘」的临时标记，落盘后即失效。
      // 即使保存期间又传了新图，该图的 base64 仍在覆盖字典里，下次保存会以它为准落盘。
      if (srcEl) srcEl.value = b.src || '';
      item.dataset.src = b.src || '';
      const prev = item.querySelector('.blk-preview');
      if (prev && b.src) {
        prev.onerror = null;
        prev.src = DataManager.getBlockImageUrl(section, b);
      }
    });
  });
}

function renderBlockItems(section, blocks) {
  return blocks.map((b, i) => renderBlockItem(section, b, i, blocks.length)).join('');
}

function renderBlockItem(section, block, index, total) {
  const moveBtns = `
    <button type="button" class="blk-move" title="上移" ${index === 0 ? 'disabled' : ''} onclick="moveBlock('${section}', ${index}, -1)">↑</button>
    <button type="button" class="blk-move" title="下移" ${index === total - 1 ? 'disabled' : ''} onclick="moveBlock('${section}', ${index}, 1)">↓</button>
    <button type="button" class="blk-del" title="删除该块" onclick="removeBlock('${section}', ${index})">🗑 删除</button>`;
  const head = `
    <div class="blk-head">
      <span class="blk-type ${block.t === 'table' ? 'is-table' : 'is-image'}">${block.t === 'table' ? '📊 表格块' : '🖼️ 图片块'}</span>
      <span class="blk-order">第 ${index + 1} 位</span>
      <span class="blk-actions">${moveBtns}</span>
    </div>`;
  return '<div class="block-item" data-type="' + block.t + '" data-id="' + escapeAttr(block.id || '') +
    '" data-slot="' + (block.slot || 0) + '" data-src="' + escapeAttr(block.src || '') + '">' +
    head + (block.t === 'table' ? renderTableBlockFields(section, block, index) : renderImageBlockFields(section, block, index)) +
    '</div>';
}

function renderImageBlockFields(section, block, index) {
  const imgUrl = DataManager.getBlockImageUrl(section, block);
  return `
    <div class="blk-body">
      <div class="blk-img-col">
        <img src="${imgUrl}" alt="预览" class="blk-preview" id="blkpreview_${section}_${index}"
          onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 260 140\\'%3E%3Crect width=\\'260\\' height=\\'140\\' fill=\\'%23eceff1\\'/%3E%3Ctext x=\\'130\\' y=\\'70\\' text-anchor=\\'middle\\' font-size=\\'14\\' fill=\\'%2390a4ae\\'%3E暂无图片%3C/text%3E%3C/svg%3E'">
        <label class="upload-btn">
          上传/替换图片
          <input type="file" accept="image/*" onchange="handleBlockImageUpload(event, '${section}', ${index})">
        </label>
        <button type="button" class="remove-btn" onclick="clearBlockImage('${section}', ${index})">移除图片</button>
      </div>
      <div class="blk-fields">
        <input type="hidden" class="blk-src" value="${escapeAttr(block.src || '')}">
        <input type="text" class="blk-caption slot-input" placeholder="图片标题" value="${escapeAttr(block.caption || '')}">
        <input type="text" class="blk-desc slot-input" placeholder="图片描述" value="${escapeAttr(block.desc || '')}">
        <input type="text" class="blk-badge slot-input" placeholder="卡片角标（留空则不显示）" value="${escapeAttr(block.badge || '')}">
        <div class="blk-size-row">
          <label>显示宽度</label>
          <input type="text" class="blk-w" placeholder="留空自适应，如 200 / 200px / 50%" value="${escapeAttr(block.w || '')}">
          <label>显示高度</label>
          <input type="text" class="blk-h" placeholder="留空默认 220px，如 120 / 120px / 60%" value="${escapeAttr(block.h || '')}">
          <label>填充方式</label>
          <select class="blk-fit">
            <option value="cover"${block.fit === 'contain' ? '' : ' selected'}>裁切填满</option>
            <option value="contain"${block.fit === 'contain' ? ' selected' : ''}>完整缩放</option>
          </select>
        </div>
        <p class="blk-size-tip">填纯数字按像素处理；只填宽度时高度按原图比例自动缩放；「完整缩放」下图片会整体缩小、不被裁切。</p>
      </div>
    </div>`;
}

function renderTableBlockFields(section, block, index) {
  const cols = block.head.length;
  const titleInput = (block.title || '');
  const subtitleInput = (block.subtitle || '');
  const toolbarAdd = `
      <div class="tbl-toolbar">
        <button type="button" onclick="addTableCol('${section}', ${index})">＋ 添加列</button>
        <button type="button" onclick="addTableRow('${section}', ${index})">＋ 添加行</button>
      </div>`;
  // 0 列：空表格，不显示任何模板列，只给出添加引导
  if (!cols) {
    return `
    <div class="blk-body blk-body-table">
      <input type="text" class="blk-title slot-input" placeholder="表格标题（留空则不显示）" value="${escapeAttr(titleInput)}">
      <input type="text" class="blk-subtitle slot-input" placeholder="表格副标题（可选）" value="${escapeAttr(subtitleInput)}">${toolbarAdd}
      <div class="tbl-empty">当前没有任何列，前台不会显示该表格。点击「＋ 添加列」自行创建结构。</div>
    </div>`;
  }
  const headInputs = block.head.map((h, c) => `
    <div class="tbl-cell">
      <input type="text" class="tbl-head-input" placeholder="第 ${c + 1} 列表头" value="${escapeAttr(h)}">
      <button type="button" class="tbl-x" title="删除该列" onclick="removeTableCol('${section}', ${index}, ${c})">✕</button>
    </div>`).join('');
  const rowsHtml = block.rows.map((row, r) => `
    <tr class="tbl-row">
      ${block.head.map((_, c) => '<td><input type="text" class="tbl-cell-input" placeholder="第 ' + (r + 1) + ' 行第 ' + (c + 1) + ' 列" value="' + escapeAttr(row[c] || '') + '"></td>').join('')}
      <td class="tbl-row-ops"><button type="button" class="tbl-x" title="删除该行" onclick="removeTableRow('${section}', ${index}, ${r})">✕</button></td>
    </tr>`).join('');
  const curHl = (block.hl === 0 || block.hl > 0 || block.hl === -1) ? parseInt(block.hl, 10) : 1;
  const hlOptions = '<option value="-1"' + (curHl === -1 ? ' selected' : '') + '>不高亮</option>' +
    block.head.map((h, c) =>
      '<option value="' + c + '" ' + (curHl === c ? 'selected' : '') + '>第 ' + (c + 1) + ' 列' + (h ? '（' + escapeHtml(h) + '）' : '') + '</option>').join('');
  return `
    <div class="blk-body blk-body-table">
      <input type="text" class="blk-title slot-input" placeholder="表格标题（留空则不显示）" value="${escapeAttr(titleInput)}">
      <input type="text" class="blk-subtitle slot-input" placeholder="表格副标题（可选）" value="${escapeAttr(subtitleInput)}">
      <div class="tbl-toolbar">
        <span>高亮列：</span>
        <select class="tbl-hl">${hlOptions || '<option value="0">第 1 列</option>'}</select>
        <button type="button" onclick="addTableCol('${section}', ${index})">＋ 添加列</button>
        <button type="button" onclick="addTableRow('${section}', ${index})">＋ 添加行</button>
      </div>
      <table class="tbl-editor">
        <thead><tr>${headInputs}<th></th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
}

// ===== 内容块：增 / 删 / 排序 =====
function addBlock(section, type) {
  const blocks = collectBlocks(section);
  // ★ 必须基于「当前块列表」计算 id：连续添加时新块还没写回 DataManager，
  //   用 DataManager 状态算会得到重复 id，进而出现「换一张图，其它图跟着变」
  const id = DataManager.newBlockId(section, blocks);
  if (type === 'table') {
    // 新建表格一律为「空白网格」：不预置任何标题 / 表头 / 单元格文案，行列结构由上方「列 / 行」决定
    const colsEl = document.getElementById('newTblCols_' + section);
    const rowsEl = document.getElementById('newTblRows_' + section);
    const colCount = Math.min(20, Math.max(1, parseInt(colsEl && colsEl.value, 10) || 3));
    const rowCount = Math.min(100, Math.max(0, parseInt(rowsEl && rowsEl.value, 10) || 0));
    const head = [];
    for (let c = 0; c < colCount; c++) head.push('');
    const rows = [];
    for (let r = 0; r < rowCount; r++) rows.push(head.map(() => ''));
    blocks.push({ t: 'table', id: id, title: '', subtitle: '', head: head, rows: rows, hl: 0 });
  } else {
    blocks.push({ t: 'image', id: id, slot: 0, src: '', caption: '', desc: '', badge: '', w: '', h: '' });
  }
  rerenderBlocks(section, blocks);
  showToast(type === 'table' ? '已添加表格块，编辑后点击保存' : '已添加图片块，上传图片后点击保存');
}

function removeBlock(section, index) {
  const blocks = collectBlocks(section);
  const removed = blocks.splice(index, 1)[0];
  if (removed && removed.id) DataManager.removeImage(section, 'bk' + removed.id);
  rerenderBlocks(section, blocks);
  showToast('内容块已删除，点击保存生效');
}

function moveBlock(section, index, delta) {
  const blocks = collectBlocks(section);
  const target = index + delta;
  if (target < 0 || target >= blocks.length) return;
  const tmp = blocks[index];
  blocks[index] = blocks[target];
  blocks[target] = tmp;
  rerenderBlocks(section, blocks);
}

// ===== 表格块：行列增删 =====
function addTableCol(section, index) {
  const blocks = collectBlocks(section);
  const b = blocks[index];
  if (!b || b.t !== 'table') return;
  b.head.push(''); // 新增列为空白，不预置「新列」等模板文字
  b.rows.forEach(r => r.push(''));
  rerenderBlocks(section, blocks);
}

function removeTableCol(section, index, col) {
  const blocks = collectBlocks(section);
  const b = blocks[index];
  if (!b || b.t !== 'table' || !b.head.length) return;
  b.head.splice(col, 1);
  b.rows.forEach(r => r.splice(col, 1));
  // 允许一直删到 0 列（空表格不渲染任何内容，不做模板兜底）
  b.hl = b.head.length ? Math.min(parseInt(b.hl, 10) || 0, b.head.length - 1) : 0;
  rerenderBlocks(section, blocks);
}

function addTableRow(section, index) {
  const blocks = collectBlocks(section);
  const b = blocks[index];
  if (!b || b.t !== 'table') return;
  b.rows.push(b.head.map(() => ''));
  rerenderBlocks(section, blocks);
}

function removeTableRow(section, index, row) {
  const blocks = collectBlocks(section);
  const b = blocks[index];
  if (!b || b.t !== 'table') return;
  b.rows.splice(row, 1);
  rerenderBlocks(section, blocks);
}

// ===== 图片块：上传（带裁剪）/ 移除 =====
function handleBlockImageUpload(event, section, index) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    showToast('图片大小不能超过 8MB', true);
    return;
  }
  event.target.value = '';
  openCropModal(file, function (base64) {
    const blocks = collectBlocks(section);
    const b = blocks[index];
    if (!b) return;
    // 未落盘的上传：base64 存入覆盖字典（saveToServer 落盘为 images/<prefix>-bk<id>.jpg），
    // 并用 UPLOADED 标记提示收集逻辑「保留原 src，等落盘后回填真实路径」
    DataManager.saveImage(section, 'bk' + b.id, base64);
    rerenderBlocks(section, blocks);
    const items = document.querySelectorAll('#' + blocksHolderId(section) + ' .block-item');
    const srcInput = items[index] ? items[index].querySelector('.blk-src') : null;
    if (srcInput) srcInput.value = 'UPLOADED';
    const preview = document.getElementById('blkpreview_' + section + '_' + index);
    if (preview) { preview.onerror = null; preview.src = base64; }
    showToast('图片已裁剪上传，点击下方保存即可生效');
  });
}

function clearBlockImage(section, index) {
  const blocks = collectBlocks(section);
  const b = blocks[index];
  if (!b) return;
  if (b.id) DataManager.removeImage(section, 'bk' + b.id);
  b.src = '';
  rerenderBlocks(section, blocks);
  showToast('图片已移除，点击保存生效');
}

// ===== 渲染联系信息编辑器 =====
// 取值助手：只在该字段「从未配置过」时才用内置默认值兜底。
// ★ 不能用 `getValue(...) || 默认值`：那样用户把字段清空后一保存，默认值又被写回 CSV，
//   表现为「清空了却删不掉」——统一社会信用代码就是靠留空来隐藏的，必须能真正存成空。
function contactVal(field, fallback) {
  const v = DataManager.getStoredValue('contact', field);
  return (v === undefined || v === null) ? fallback : v;
}

function renderContactEditor() {
  const title = contactVal('section_title', '联系我们 & 在线询价');
  const desc = contactVal('section_description', '迈德瑞智能装备为您提供快速选型建议、技术图纸匹配与专业报价，技术工程师团队2小时内极速响应');
  const company = contactVal('company_name', '迈德瑞（淮安）智能装备科技有限公司');
  const phone = contactVal('phone', '400-888-9999 / 0517-88886666');
  const email = contactVal('email', 'sales@magdrive-tech.com');
  const address = contactVal('address', '江苏省淮安经济技术开发区南马厂街道内湖路82号经管站103室');
  const hours = contactVal('hours', '周一至周五 08:30 - 18:00');
  const creditCode = contactVal('credit_code', '91320891MAKML1457M');
  const legalPerson = contactVal('legal_person', '张剑');
  const registeredCapital = contactVal('registered_capital', '450万元整');
  const formTitle = contactVal('form_title', '在线询价与工况定制');
  const formSubtitle = contactVal('form_subtitle', '请提交您的产品型号、工况参数或技术要求，我们将安排工程师为您对接');
  return `
    <h3 style="margin-bottom:20px;color:#0d47a1;">联系我们与在线询盘板块设置</h3>
    <!-- 板块背景图管理（上传 / 替换 / 删除） -->
    ${renderSectionBgControl('contact')}
    <div class="form-group">
      <label>板块标题</label>
      <input type="text" id="contact_section_title" value="${escapeAttr(title)}">
    </div>
    <div class="form-group">
      <label>板块描述</label>
      <textarea id="contact_section_description">${escapeHtml(desc)}</textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div class="form-group">
        <label>公司名称</label>
        <input type="text" id="contact_company_name" value="${escapeAttr(company)}">
      </div>
      <div class="form-group">
        <label>统一社会信用代码</label>
        <input type="text" id="contact_credit_code" value="${escapeAttr(creditCode)}">
      </div>
      <div class="form-group">
        <label>法定代表人</label>
        <input type="text" id="contact_legal_person" value="${escapeAttr(legalPerson)}">
      </div>
      <div class="form-group">
        <label>注册资本</label>
        <input type="text" id="contact_registered_capital" value="${escapeAttr(registeredCapital)}">
      </div>
      <div class="form-group">
        <label>咨询服务电话 / 微信</label>
        <input type="text" id="contact_phone" value="${escapeAttr(phone)}">
      </div>
      <div class="form-group">
        <label>技术 / 业务邮箱</label>
        <input type="email" id="contact_email" value="${escapeAttr(email)}">
      </div>
      <div class="form-group">
        <label>服务工作时间</label>
        <input type="text" id="contact_hours" value="${escapeAttr(hours)}">
      </div>
      <div class="form-group">
        <label>企业注册 / 经营地址</label>
        <input type="text" id="contact_address" value="${escapeAttr(address)}">
      </div>
    </div>

    <!-- 营业执照上传管理（复用通用图片控件） -->
    ${renderMetaImageControl(
      'license',
      '📜 企业营业执照资质图片',
      '支持裁剪上传高清营业执照或资质证书，访客可在前台点击放大查看。',
      { width: 120, height: 80, fit: 'contain', deleteLabel: '恢复默认执照' }
    )}

    <div class="form-group" style="margin-top:16px;">
      <label>询价表单主标题</label>
      <input type="text" id="contact_form_title" value="${escapeAttr(formTitle)}">
    </div>
    <div class="form-group">
      <label>询价表单引导说明</label>
      <input type="text" id="contact_form_subtitle" value="${escapeAttr(formSubtitle)}">
    </div>

    <!-- 联系板块附加文字（条目标题、执照卡片说明等） -->
    ${renderTextGroup('contact_info')}

    <!-- 在线选型表单文字（标签、占位提示、下拉选项、按钮与提示语） -->
    ${renderTextGroup('contact_form')}
  `;
}

// ===== 渲染客户询盘管理面板 =====
function renderInquiriesPanel() {
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h3 style="color:#0d47a1;margin:0;">前台收到的客户询盘列表</h3>
      <div style="display:flex;gap:10px;">
        <button onclick="loadInquiriesList()" style="padding:6px 14px;background:var(--primary);color:#fff;border-radius:6px;font-size:13px;">🔄 刷新列表</button>
        <button onclick="exportInquiriesCSV()" style="padding:6px 14px;background:#2e7d32;color:#fff;border-radius:6px;font-size:13px;">📊 导出询盘 CSV</button>
      </div>
    </div>
    <div style="overflow-x:auto;">
      <table class="inquiries-table">
        <thead>
          <tr>
            <th>提交时间</th>
            <th>客户称呼</th>
            <th>联系电话/微信</th>
            <th>电子邮箱</th>
            <th>所属公司</th>
            <th>意向产品</th>
            <th>工况详细需求</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="inquiriesTableBody">
          <tr><td colspan="8" style="text-align:center;padding:24px;color:#94a3b8;">正在加载询盘记录...</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

// ===== 加载询盘数据 =====
let loadedInquiries = [];

async function loadInquiriesList() {
  const tbody = document.getElementById('inquiriesTableBody');
  if (!tbody) return;

  try {
    loadedInquiries = await DataManager.getInquiries();
    if (!loadedInquiries || loadedInquiries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px;color:#94a3b8;">暂无客户询盘提交记录</td></tr>';
      return;
    }

    tbody.innerHTML = loadedInquiries.map(item => `
      <tr>
        <td style="white-space:nowrap;font-size:13px;color:#64748b;">${escapeHtml(item.created_at || '-')}</td>
        <td style="font-weight:600;">${escapeHtml(item.name || '-')}</td>
        <td style="color:#0d47a1;font-weight:500;">${escapeHtml(item.contact || '-')}</td>
        <td>${escapeHtml(item.email || '-')}</td>
        <td>${escapeHtml(item.company || '-')}</td>
        <td><span class="badge-status badge-read">${escapeHtml(item.product || '未指定')}</span></td>
        <td style="max-width:260px;word-break:break-all;font-size:13px;">${escapeHtml(item.message || '-')}</td>
        <td>
          <button onclick="handleDeleteInquiry('${item.id}')" style="padding:4px 8px;background:#fee2e2;color:#dc2626;border-radius:4px;font-size:12px;cursor:pointer;">删除</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#ef4444;padding:20px;">加载失败，请检查服务状态</td></tr>';
  }
}

async function handleDeleteInquiry(id) {
  if (!confirm('确定删除该条询盘记录吗？')) return;
  await DataManager.deleteInquiry(id);
  showToast('询盘记录已删除');
  loadInquiriesList();
}

function exportInquiriesCSV() {
  if (!loadedInquiries || loadedInquiries.length === 0) {
    showToast('暂无询盘数据可导出', true);
    return;
  }
  const headers = ['提交时间', '客户称呼', '联系电话/微信', '电子邮箱', '所属公司', '意向产品', '工况需求'];
  const rows = [headers];
  loadedInquiries.forEach(item => {
    rows.push([
      item.created_at || '',
      item.name || '',
      item.contact || '',
      item.email || '',
      item.company || '',
      item.product || '',
      item.message || ''
    ]);
  });
  const csvText = DataManager.toCSV(rows);
  const blob = new Blob(['\ufeff' + csvText], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `客户询盘记录_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('询盘表格已导出');
}

// ===== 切换 Tab =====
// ===== 后台标签栏渲染（标签文字支持自定义，见「首页与通用文案」Tab）=====
function renderAdminTabsInner(currentId) {
  return DataManager.ADMIN_TAB_ORDER.map(id => {
    const cls = 'admin-tab' + (id === currentId ? ' active' : '');
    return `<button class="${cls}" onclick="switchTab('${id}')">${escapeHtml(DataManager.getAdminTabLabel(id))}</button>`;
  }).join('');
}

// 重新渲染顶部标签栏，并保留当前选中的标签
function refreshAdminTabs() {
  const holder = document.getElementById('adminTabs');
  if (!holder) return;
  const activeBtn = holder.querySelector('.admin-tab.active');
  const m = activeBtn ? String(activeBtn.getAttribute('onclick') || '').match(/'([^']+)'/) : null;
  holder.innerHTML = renderAdminTabsInner(m ? m[1] : (DataManager.sections[0] || 'texts'));
}

function switchTab(section) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  const targetTabBtn = Array.from(document.querySelectorAll('.admin-tab')).find(b => b.getAttribute('onclick')?.includes(`'${section}'`));
  if (targetTabBtn) targetTabBtn.classList.add('active');

  const targetContent = document.getElementById('tab_' + section);
  if (targetContent) targetContent.classList.add('active');

  if (section === 'inquiries') {
    loadInquiriesList();
  }
}

// ===== 全局图片上传（Logo / 首页背景图 / 首页主图 / 板块背景图，带裁剪）=====
function handleMetaImageUpload(event, key, previewId, holderId) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    showToast('图片大小不能超过 8MB', true);
    return;
  }
  event.target.value = '';
  openCropModal(file, function(base64) {
    try {
      DataManager.saveMetaImage(key, base64);
    } catch (err) {
      showToast(err.message || '图片存储失败', true);
      return;
    }
    // 先重渲染控件：按钮文案切换为「替换图片」并出现删除按钮
    if (holderId) refreshMetaImageControl(holderId);
    // 再把预览图显式指向刚上传的图片（后端模式下 CSV 旧值优先，必须覆盖预览）
    const preview = document.getElementById(previewId);
    if (preview) {
      preview.onerror = null;
      preview.src = base64;
      preview.style.display = '';
    }
    showToast('图片已裁剪上传，点击下方保存即可生效');
  });
}

// ===== 删除全局图片 / 恢复默认图片 =====
function removeMetaImageUpload(key, previewId, holderId) {
  DataManager.removeMetaImage(key);
  if (holderId) refreshMetaImageControl(holderId);
  showToast('图片已删除，点击下方保存即可生效');
}

// ===== 保存所有更改（支持本地磁盘落盘）=====
async function saveAll() {
  const saveBtn = document.querySelector('.btn-save');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ 正在保存并落盘...';
  }

  try {
    // 1. 保存 meta
    DataManager.setValue('meta', 'site_title', document.getElementById('meta_site_title').value);
    DataManager.setValue('meta', 'site_subtitle', document.getElementById('meta_site_subtitle').value);
    // 1.0 前台导航栏名称：若「首页与通用文案 → 🌐 前台导航栏名称」的逐项编辑被改动过（dirty），
    //     则以逐项编辑为准汇总写回 meta.nav_text，并同步「全局设置」里的整串输入框；
    //     未改动时保持整串输入框原值，两个编辑入口互不覆盖
    const navHolder = document.getElementById('navItemsHolder');
    const navItemEls = navHolder ? navHolder.querySelectorAll('.nav-item-input') : [];
    if (navHolder && navHolder.dataset.dirty === '1' && navItemEls.length) {
      const joined = Array.prototype.map.call(navItemEls, el => el.value.trim()).filter(Boolean).join(',');
      const navRaw = document.getElementById('meta_nav_text');
      if (navRaw) navRaw.value = joined;
    }
    DataManager.setValue('meta', 'nav_text', document.getElementById('meta_nav_text').value);
    DataManager.setValue('meta', 'footer_text', document.getElementById('meta_footer_text').value);
    DataManager.setValue('meta', 'header_bg_color', document.getElementById('meta_header_bg_color').value);
    DataManager.setValue('meta', 'hero_bg_color', document.getElementById('meta_hero_bg_color').value);
    DataManager.setValue('meta', 'hero_title_color', document.getElementById('meta_hero_title_color').value);

    // 1.5 保存后台标签栏名称（后台界面自身的 UI 文案）
    DataManager.ADMIN_TAB_ORDER.forEach(tabId => {
      const el = document.getElementById('admintab_' + tabId);
      if (el) DataManager.setValue('meta', 'admin_tab_' + tabId, el.value.trim());
    });

    // 2. 保存四大核心板块（内容块：图片 / 表格，顺序与 DOM 一致）
    DataManager.sections.forEach(section => {
      DataManager.setValue(section, 'section_title', document.getElementById(section + '_section_title').value);
      DataManager.setValue(section, 'section_description', document.getElementById(section + '_section_description').value);
      DataManager.setValue(section, 'text_position', document.getElementById(section + '_text_position').value);
      DataManager.setBlocks(section, collectBlocks(section));
    });

    // 3. 保存联系信息与企业资质
    if (document.getElementById('contact_section_title')) {
      DataManager.setValue('contact', 'section_title', document.getElementById('contact_section_title').value);
      DataManager.setValue('contact', 'section_description', document.getElementById('contact_section_description').value);
      DataManager.setValue('contact', 'company_name', document.getElementById('contact_company_name').value);
      DataManager.setValue('contact', 'phone', document.getElementById('contact_phone').value);
      DataManager.setValue('contact', 'email', document.getElementById('contact_email').value);
      DataManager.setValue('contact', 'address', document.getElementById('contact_address').value);
      DataManager.setValue('contact', 'hours', document.getElementById('contact_hours').value);
      DataManager.setValue('contact', 'form_title', document.getElementById('contact_form_title').value);
      DataManager.setValue('contact', 'form_subtitle', document.getElementById('contact_form_subtitle').value);
      DataManager.setValue('contact', 'credit_code', document.getElementById('contact_credit_code').value);
      DataManager.setValue('contact', 'legal_person', document.getElementById('contact_legal_person').value);
      DataManager.setValue('contact', 'registered_capital', document.getElementById('contact_registered_capital').value);
    }

    // 3.5 保存全站可编辑文案（首页 Hero / 指标看板 / 对标表 / 客户墙 / 表单等）
    DataManager.TEXTS.forEach(t => {
      const el = document.getElementById('texts_' + t.key);
      if (el) DataManager.setValue('texts', t.key, el.value);
    });

    // 4. 发送到服务端直接持久化落盘
    const res = await DataManager.saveToServer();
    // 把落盘后的真实图片路径回写编辑器，避免下次保存时 DOM 里的旧空值覆盖掉它
    syncBlockImageSrcs();
    // 标签栏名称可能被改动，保存后立刻刷新顶部标签栏
    refreshAdminTabs();
    showToast(res.message || '🎉 所有更改已成功保存并落盘！');
  } catch (err) {
    showToast('保存异常: ' + err.message, true);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 保存所有更改 (直接落盘)';
    }
  }
}

// ===== 恢复默认设置 =====
async function handleResetDefaults() {
  if (!confirm('⚠️ 警告：确定要重置所有修改并恢复至初始默认配置吗？\n（此操作将清除所有自定义文字与上传的图片）')) {
    return;
  }
  await DataManager.resetDefaults();
  renderAdminPanel();
  showToast('已恢复初始默认配置！');
}

// ===== 导出 CSV =====
async function exportData() {
  try {
    // 先同步保存当前表单内容，确保导出的 CSV 与页面修改一致
    await saveAll();
    DataManager.exportCSV('content');
    showToast('CSV 文件已导出下载');
  } catch (err) {
    showToast('导出失败: ' + err.message, true);
  }
}

// ===== Toast 提示 =====
function showToast(msg, isError) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.background = isError ? '#d32f2f' : '#2e7d32';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  if (!text) return '';
  return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===== 图片裁剪弹窗 =====
let cropperInstance = null;
let cropCallback = null;

function openCropModal(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    cropCallback = callback;
    const overlay = document.getElementById('cropOverlay');
    const img = document.getElementById('cropImage');

    document.querySelectorAll('.crop-aspect-btn').forEach(b => b.classList.remove('active'));
    const freeBtn = document.querySelector('.crop-aspect-btn');
    if (freeBtn) freeBtn.classList.add('active');

    if (cropperInstance) {
      cropperInstance.destroy();
      cropperInstance = null;
    }

    img.onload = function() {
      cropperInstance = new Cropper(img, {
        aspectRatio: NaN,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.9,
        movable: true,
        zoomable: true,
        zoomOnWheel: true,
        rotatable: false,
        scalable: false,
        background: true,
        minCropBoxWidth: 50,
        minCropBoxHeight: 50,
      });
    };
    img.src = e.target.result;
    overlay.classList.add('active');
  };
  reader.onerror = function() {
    showToast('图片读取失败，请重试', true);
  };
  reader.readAsDataURL(file);
}

function setCropAspect(ratio, btn) {
  document.querySelectorAll('.crop-aspect-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (cropperInstance) {
    cropperInstance.setAspectRatio(ratio || NaN);
  }
}

function confirmCrop() {
  if (!cropperInstance) {
    showToast('裁剪器尚未就绪', true);
    return;
  }
  const canvas = cropperInstance.getCroppedCanvas({
    maxWidth: 1200,
    maxHeight: 900,
    imageSmoothingQuality: 'high',
  });
  if (!canvas) {
    showToast('裁剪失败，请重试', true);
    return;
  }
  const base64 = canvas.toDataURL('image/jpeg', 0.85);
  const cb = cropCallback;
  closeCropModal();
  if (cb) {
    cb(base64);
  }
}

function closeCropModal() {
  const overlay = document.getElementById('cropOverlay');
  overlay.classList.remove('active');
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
  cropCallback = null;
}

