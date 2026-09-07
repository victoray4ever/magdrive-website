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

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';
  const result = await DataManager.login(username, password);
  if (result.success) {
    showAdminPanel();
  } else {
    errorEl.textContent = result.message || '用户名或密码错误，请重试';
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
      <h1>${logoHtml}管理后台 - 迈德瑞智能装备科技</h1>
      <div class="actions">
        ${serverBadge}
        <a href="index.html" class="btn-view-site" target="_blank">查看前台</a>
        <button onclick="openPasswordModal()" class="btn-change-pwd" title="修改后台管理员登录密码" style="padding:7px 14px;background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.35);border-radius:6px;font-size:13px;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:4px;">🔑 修改密码</button>
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
          <label>导航栏文字（用逗号分隔，如：产品展示,性能参数,使用方法,应用工况,联系我们）</label>
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
        <div class="form-row" style="display:flex;gap:20px;flex-wrap:wrap;margin-top:8px;">
          <div class="form-group" style="flex:1;min-width:200px;">
            <label>Logo 图片（替换齿轮图标）</label>
            <div style="display:flex;align-items:center;gap:12px;">
              <img id="logo_preview" src="${DataManager.getMetaImage('logo') || ''}" style="width:60px;height:40px;object-fit:contain;border:2px solid var(--border);border-radius:6px;background:var(--bg-section);${DataManager.getMetaImage('logo') ? '' : 'display:none;'}">
              <label class="upload-btn" style="display:inline-block;padding:8px 16px;background:var(--primary-light);color:var(--primary-dark);border:1px solid var(--primary);border-radius:6px;font-size:13px;cursor:pointer;">
                上传 Logo
                <input type="file" accept="image/*" style="display:none;" onchange="handleMetaImageUpload(event, 'logo', 'logo_preview')">
              </label>
              ${DataManager.getMetaImage('logo') ? '<button class="remove-btn" style="display:inline-block;padding:6px 12px;background:#fff0f0;color:#d32f2f;border:1px solid #ef9a9a;border-radius:6px;font-size:13px;cursor:pointer;" onclick="removeMetaImageUpload(\'logo\', \'logo_preview\')">删除</button>' : ''}
            </div>
          </div>
          <div class="form-group" style="flex:1;min-width:200px;">
            <label>Hero 背景图片（替换渐变色）</label>
            <div style="display:flex;align-items:center;gap:12px;">
              <img id="hero_bg_preview" src="${DataManager.getMetaImage('hero_bg') || ''}" style="width:60px;height:40px;object-fit:cover;border:2px solid var(--border);border-radius:6px;background:var(--bg-section);${DataManager.getMetaImage('hero_bg') ? '' : 'display:none;'}">
              <label class="upload-btn" style="display:inline-block;padding:8px 16px;background:var(--primary-light);color:var(--primary-dark);border:1px solid var(--primary);border-radius:6px;font-size:13px;cursor:pointer;">
                上传背景图
                <input type="file" accept="image/*" style="display:none;" onchange="handleMetaImageUpload(event, 'hero_bg', 'hero_bg_preview')">
              </label>
              ${DataManager.getMetaImage('hero_bg') ? '<button class="remove-btn" style="display:inline-block;padding:6px 12px;background:#fff0f0;color:#d32f2f;border:1px solid #ef9a9a;border-radius:6px;font-size:13px;cursor:pointer;" onclick="removeMetaImageUpload(\'hero_bg\', \'hero_bg_preview\')">删除</button>' : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 导航 -->
      <div class="admin-tabs" id="adminTabs">
        ${DataManager.sections.map((s, i) =>
          `<button class="admin-tab ${i === 0 ? 'active' : ''}" onclick="switchTab('${s}')">${DataManager.sectionLabels[s]}</button>`
        ).join('')}
        <button class="admin-tab" onclick="switchTab('contact')">联系信息设置</button>
        <button class="admin-tab" onclick="switchTab('inquiries')">客户询盘管理 📩</button>
      </div>

      <!-- Tab 内容 -->
      <div id="tabContents">
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

// ===== 渲染单个板块编辑器 =====
function renderSectionEditor(section) {
  const count = DataManager.getImageCount(section);
  const title = DataManager.getValue(section, 'section_title');
  const description = DataManager.getValue(section, 'section_description');
  const textPosition = DataManager.getValue(section, 'text_position') || 'above';

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
    <div class="image-count-control">
      <label>图片数量：</label>
      <input type="number" id="${section}_image_count" value="${count}" min="1" max="20">
      <button onclick="updateImageCount('${section}')">更新数量</button>
    </div>
    <div class="image-manager" id="${section}_images">
  `;
  for (let i = 1; i <= count; i++) {
    html += renderImageSlot(section, i);
  }
  html += '</div>';
  return html;
}

function renderImageSlot(section, index) {
  const caption = DataManager.getValue(section, 'image' + index + '_caption');
  const description = DataManager.getValue(section, 'image' + index + '_description');
  const imgUrl = DataManager.getImageUrl(section, index);
  return `
    <div class="image-slot" id="slot_${section}_${index}">
      <img src="${imgUrl}" alt="图片${index}" id="preview_${section}_${index}"
        onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 260 140\\'%3E%3Crect width=\\'260\\' height=\\'140\\' fill=\\'%23eceff1\\'/%3E%3Ctext x=\\'130\\' y=\\'70\\' text-anchor=\\'middle\\' font-size=\\'14\\' fill=\\'%2390a4ae\\'%3E暂无图片%3C/text%3E%3C/svg%3E'">
      <input type="text" class="slot-input" placeholder="图片标题" value="${escapeAttr(caption)}" id="caption_${section}_${index}">
      <input type="text" class="slot-input" placeholder="图片描述" value="${escapeAttr(description)}" id="desc_${section}_${index}">
      <label class="upload-btn">
        上传/替换图片
        <input type="file" accept="image/*" onchange="handleImageUpload(event, '${section}', ${index})">
      </label>
      <button class="remove-btn" onclick="removeImage('${section}', ${index})">删除图片</button>
    </div>
  `;
}

// ===== 渲染联系信息编辑器 =====
function renderContactEditor() {
  const title = DataManager.getValue('contact', 'section_title') || '联系我们 & 在线询价';
  const desc = DataManager.getValue('contact', 'section_description') || '迈德瑞智能装备为您提供快速选型建议、技术图纸匹配与专业报价，技术工程师团队2小时内极速响应';
  const company = DataManager.getValue('contact', 'company_name') || '迈德瑞（淮安）智能装备科技有限公司';
  const phone = DataManager.getValue('contact', 'phone') || '400-888-9999 / 0517-88886666';
  const email = DataManager.getValue('contact', 'email') || 'sales@magdrive-tech.com';
  const address = DataManager.getValue('contact', 'address') || '江苏省淮安经济技术开发区南马厂街道内湖路82号经管站103室';
  const hours = DataManager.getValue('contact', 'hours') || '周一至周五 08:30 - 18:00';
  const creditCode = DataManager.getValue('contact', 'credit_code') || '91320891MAKML1457M';
  const legalPerson = DataManager.getValue('contact', 'legal_person') || '张剑';
  const registeredCapital = DataManager.getValue('contact', 'registered_capital') || '450万元整';
  const formTitle = DataManager.getValue('contact', 'form_title') || '在线询价与工况定制';
  const formSubtitle = DataManager.getValue('contact', 'form_subtitle') || '请提交您的产品型号、工况参数或技术要求，我们将安排工程师为您对接';
  const licenseImg = DataManager.getMetaImage('license') || 'images/business_license.jpg';

  return `
    <h3 style="margin-bottom:20px;color:#0d47a1;">联系我们与在线询盘板块设置</h3>
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

    <!-- 营业执照上传管理 -->
    <div class="form-group" style="padding:16px;background:var(--primary-light);border-radius:8px;margin-top:12px;">
      <label style="color:var(--primary-dark);font-size:15px;margin-bottom:10px;">📜 企业营业执照资质图片</label>
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <img id="license_preview" src="${licenseImg}" style="width:120px;height:80px;object-fit:contain;border:2px solid var(--border);border-radius:6px;background:#fff;">
        <div>
          <label class="upload-btn" style="display:inline-block;padding:8px 16px;background:var(--primary);color:#fff;border-radius:6px;font-size:13px;cursor:pointer;">
            上传/替换营业执照
            <input type="file" accept="image/*" style="display:none;" onchange="handleMetaImageUpload(event, 'license', 'license_preview')">
          </label>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:6px;">支持裁剪上传高清营业执照或资质证书，访客可在前台点击放大查看</div>
        </div>
      </div>
    </div>

    <div class="form-group" style="margin-top:16px;">
      <label>询价表单主标题</label>
      <input type="text" id="contact_form_title" value="${escapeAttr(formTitle)}">
    </div>
    <div class="form-group">
      <label>询价表单引导说明</label>
      <input type="text" id="contact_form_subtitle" value="${escapeAttr(formSubtitle)}">
    </div>
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

// ===== 更新图片数量 =====
function updateImageCount(section) {
  const input = document.getElementById(section + '_image_count');
  let count = parseInt(input.value) || 1;
  if (count < 1) count = 1;
  if (count > 20) count = 20;
  DataManager.setImageCount(section, count);

  const container = document.getElementById(section + '_images');
  container.innerHTML = '';
  for (let i = 1; i <= count; i++) {
    container.insertAdjacentHTML('beforeend', renderImageSlot(section, i));
  }
  showToast('图片数量已更新为 ' + count + '，请点击下方保存');
}

// ===== 图片上传（带裁剪）=====
function handleImageUpload(event, section, index) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    showToast('图片大小不能超过 8MB', true);
    return;
  }
  event.target.value = '';
  openCropModal(file, function(base64) {
    const preview = document.getElementById('preview_' + section + '_' + index);
    if (preview) {
      preview.onerror = null;
      preview.src = base64;
    }
    try {
      DataManager.saveImage(section, index, base64);
      showToast('图片已裁剪完毕，点击下方保存即可生效');
    } catch (err) {
      showToast(err.message || '图片存储失败', true);
    }
  });
}

// ===== 删除图片 =====
function removeImage(section, index) {
  DataManager.removeImage(section, index);
  const preview = document.getElementById('preview_' + section + '_' + index);
  if (preview) {
    const prefix = DataManager.imagePrefix[section] || section;
    preview.src = 'images/' + prefix + '-' + index + '.svg';
    preview.onerror = function() {
      this.onerror = null;
      this.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 260 140'%3E%3Crect width='260' height='140' fill='%23eceff1'/%3E%3Ctext x='130' y='70' text-anchor='middle' font-size='14' fill='%2390a4ae'%3E暂无图片%3C/text%3E%3C/svg%3E";
    };
  }
  showToast('图片已删除，请点击保存');
}

// ===== 全局图片上传（Logo、Hero背景，带裁剪）=====
function handleMetaImageUpload(event, key, previewId) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    showToast('图片大小不能超过 8MB', true);
    return;
  }
  event.target.value = '';
  openCropModal(file, function(base64) {
    const preview = document.getElementById(previewId);
    if (preview) {
      preview.onerror = null;
      preview.src = base64;
      preview.style.display = '';
    }
    try {
      DataManager.saveMetaImage(key, base64);
      showToast('图片已裁剪上传，请点击保存');
    } catch (err) {
      showToast(err.message || '图片存储失败', true);
    }
  });
}

// ===== 删除全局图片 =====
function removeMetaImageUpload(key, previewId) {
  DataManager.removeMetaImage(key);
  const preview = document.getElementById(previewId);
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  showToast('图片已删除，请点击保存');
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
    DataManager.setValue('meta', 'nav_text', document.getElementById('meta_nav_text').value);
    DataManager.setValue('meta', 'footer_text', document.getElementById('meta_footer_text').value);
    DataManager.setValue('meta', 'header_bg_color', document.getElementById('meta_header_bg_color').value);
    DataManager.setValue('meta', 'hero_bg_color', document.getElementById('meta_hero_bg_color').value);
    DataManager.setValue('meta', 'hero_title_color', document.getElementById('meta_hero_title_color').value);

    // 2. 保存四大核心板块
    DataManager.sections.forEach(section => {
      DataManager.setValue(section, 'section_title', document.getElementById(section + '_section_title').value);
      DataManager.setValue(section, 'section_description', document.getElementById(section + '_section_description').value);
      DataManager.setValue(section, 'text_position', document.getElementById(section + '_text_position').value);
      const count = DataManager.getImageCount(section);
      for (let i = 1; i <= count; i++) {
        const captionEl = document.getElementById('caption_' + section + '_' + i);
        const descEl = document.getElementById('desc_' + section + '_' + i);
        if (captionEl) DataManager.setValue(section, 'image' + i + '_caption', captionEl.value);
        if (descEl) DataManager.setValue(section, 'image' + i + '_description', descEl.value);
      }
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

    // 4. 发送到服务端直接持久化落盘
    const res = await DataManager.saveToServer();
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
function exportData() {
  saveAll();
  DataManager.exportCSV();
  showToast('CSV 文件已导出下载');
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

// ===== 修改密码模态弹窗控制 =====
function openPasswordModal() {
  const modal = document.getElementById('passwordModal');
  const errorEl = document.getElementById('pwdErrorMsg');
  const form = document.getElementById('changePasswordForm');
  if (modal) {
    if (form) form.reset();
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
    modal.style.display = 'flex';
    setTimeout(() => {
      document.getElementById('oldPassword').focus();
    }, 100);
  }
}

function closePasswordModal() {
  const modal = document.getElementById('passwordModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function handleChangePassword(e) {
  e.preventDefault();
  const oldPwd = document.getElementById('oldPassword').value.trim();
  const newPwd = document.getElementById('newPassword').value.trim();
  const confirmPwd = document.getElementById('confirmPassword').value.trim();
  const errorEl = document.getElementById('pwdErrorMsg');
  const submitBtn = document.getElementById('btnSubmitPwd');

  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }

  if (newPwd.length < 6) {
    if (errorEl) {
      errorEl.textContent = '新密码长度至少需要 6 个字符';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (newPwd !== confirmPwd) {
    if (errorEl) {
      errorEl.textContent = '两次输入的新密码不一致，请核对';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '正在修改...';
  }

  try {
    const res = await DataManager.changePassword(oldPwd, newPwd);
    closePasswordModal();
    showToast(res.message || '🎉 密码修改成功！请重新登录');
    
    // 延迟 1.5 秒登出并提示重新登录
    setTimeout(() => {
      handleLogout();
      const loginErr = document.getElementById('loginError');
      if (loginErr) {
        loginErr.style.color = '#15803d';
        loginErr.textContent = '密码已修改成功，请使用新密码登录';
      }
    }, 1500);
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message || '修改失败，请重试';
      errorEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '确认修改';
    }
  }
}

