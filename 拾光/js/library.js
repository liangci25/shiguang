"use strict";
/* 词库管理页 js/library.js v3 —— 通用/专属 × 字卡/Emoji/表情包 × 分组管理 */

const LibView = {
  scope: "common",   /* common=通用词库 | per=专属词库 */
  type: "text",      /* text | emoji | image */
  charId: ""         /* 专属词库时选中的角色 id */
};

/* ---------- 一级/二级 Tab ---------- */
function bindTabs(){
  $("#mainTabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".main-tab");
    if (!tab) return;
    LibView.scope = tab.dataset.scope;
    $$("#mainTabs .main-tab").forEach(t => t.classList.toggle("active", t === tab));
    $("#perPick").style.display = LibView.scope === "per" ? "" : "none";
    LibView.charId = LibView.scope === "per" ? $("#perSelect").value : "";
    Render.render();
  });
  $("#subTabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".sub-tab");
    if (!tab) return;
    LibView.type = tab.dataset.type;
    $$("#subTabs .sub-tab").forEach(t => t.classList.toggle("active", t === tab));
    Render.render();
  });
  const perSelect = $("#perSelect");
  perSelect.addEventListener("change", () => {
    LibView.charId = perSelect.value;
    Render.render();
  });
}
function fillPerSelect(){
  const sel = $("#perSelect");
  const chars = Store.data.characters;
  sel.innerHTML = chars.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("") || `<option value="">暂无角色</option>`;
  if (LibView.charId && !chars.find(c => c.id === LibView.charId)) LibView.charId = "";
  if (!LibView.charId && chars.length) LibView.charId = chars[0].id;
  if (LibView.charId) sel.value = LibView.charId;
}

/* ---------- 渲染 ---------- */
const Render = {
  render(){
    Render.renderLib();
    renderNavBadge();
  },
  renderLib(){
    const body = $("#libBody");
    const type = LibView.type;
    const charId = LibView.scope === "per" ? LibView.charId : "";
    const groups = Lib.groupNames(type, charId);
    const typeName = LIB_TYPE_NAMES[type];
    if (LibView.scope === "per" && !charId) {
      body.innerHTML = `<div class="empty">还没有角色，先新建一个角色吧</div>`;
      return;
    }
    let html = `<div class="lib-batch">
      <label class="check-all"><input type="checkbox" id="checkAll"> 全选</label>
      <button class="btn" id="batchAddBtn">批量新增</button>
      <button class="btn" id="addGroupBtn">新增分组</button>
      <button class="btn" id="importBtn">导入 JSON</button>
      <button class="btn" id="exportBtn">导出 JSON</button>
      <button class="btn btn-danger" id="delSelBtn">删除选中（<span id="selCount">0</span>）</button>
    </div>`;
    html += groups.map(g => {
      const entries = Lib.entries(type, g, charId);
      const items = entries.length ? entries.map((it, i) => `
        <div class="lib-item" data-group="${esc(g)}" data-idx="${i}">
          <div class="item-check" data-check="1">✓</div>
          ${type === "image" ? `<img class="item-img" src="${esc(it)}" alt="表情包" onerror="this.parentElement.classList.add('img-fail')">`
            : `<div class="item-content${type === "emoji" ? " emoji" : ""}">${esc(it)}</div>`}
          <div class="item-tools">
            <button data-edit="1">编辑</button>
            <button class="danger" data-del="1">删除</button>
          </div>
        </div>`).join("") : `<div class="lib-item"><div class="item-content" style="color:#b0b0b0">（空）</div></div>`;
      return `
      <div class="lib-group">
        <div class="lib-group-head">
          <div class="lib-group-name">${esc(g)} <span style="font-weight:400;color:#b0b0b0;font-size:12px">${entries.length} 条</span></div>
          <div class="lib-group-tools">
            <button data-gadd="1">＋新增</button>
            <button data-gren="1">重命名</button>
            <button class="danger" data-gdel="1">删除分组</button>
          </div>
        </div>
        ${items}
      </div>`;
    }).join("");
    body.innerHTML = html;
    bindLibBody();
  }
};

/* ---------- 新增单条内容（按类型：字卡文本 / emoji 输入 / 表情包上传或 URL） ---------- */
function openAddEntry(group){
  const type = LibView.type;
  const charId = LibView.scope === "per" ? LibView.charId : "";
  if (type === "image") {
    /* 表情包：上传或 URL */
    Modal.open(`
      <div class="sheet">
        <div class="sheet-item" data-sheet="upload">本地上传图片</div>
        <div class="sheet-item" data-sheet="url">图片链接</div>
        <div class="sheet-item cancel" data-close>取消</div>
      </div>
    `);
    $("#modalRoot").querySelector(".sheet").addEventListener("click", (e) => {
      const item = e.target.closest(".sheet-item[data-sheet]");
      if (!item) return;
      Modal.close();
      if (item.dataset.sheet === "upload") {
        fileInput("image/*", async (input) => {
          const file = input.files && input.files[0];
          if (!file) return;
          try {
            const data = await readImageFile(file, 512);
            Lib.addEntry(type, group, data, charId);
            toast("表情包已添加");
            Render.render();
          } catch (err) { toast("图片读取失败：" + err.message); }
        });
      } else if (item.dataset.sheet === "url") {
        Modal.open(`
          <div class="modal-head">添加表情包（图片链接）<button class="modal-close">×</button></div>
          <div class="modal-body">
            <input type="text" id="imgUrlInput" placeholder="粘贴图片链接（https://…）" style="width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:14px;outline:none">
          </div>
          <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="imgUrlOk">添加</button></div>
        `);
        $("#imgUrlInput").focus();
        $("#imgUrlOk").addEventListener("click", () => {
          const url = $("#imgUrlInput").value.trim();
          if (!url) { toast("请粘贴图片链接"); return; }
          checkImageUrl(url).then(ok => {
            if (!ok) { toast("链接失效或不是图片，未添加"); return; }
            Lib.addEntry(type, group, url, charId);
            Modal.close();
            toast("表情包已添加");
            Render.render();
          });
        });
      }
    });
    return;
  }
  /* 字卡 / Emoji：输入框 */
  Modal.open(`
    <div class="modal-head">新增${LIB_TYPE_NAMES[type]}<button class="modal-close">×</button></div>
    <div class="modal-body">
      ${type === "text"
        ? `<textarea id="newEntryInput" placeholder="输入台词…" style="width:100%;min-height:90px;border:1px solid #dcdcdc;border-radius:8px;padding:10px 12px;font-size:14px;outline:none;resize:vertical"></textarea>
           <div style="font-size:12px;color:#b0b0b0;margin-top:6px">一行一条，可一次粘贴多行批量添加</div>`
        : `<input type="text" id="newEntryInput" placeholder="输入 Emoji，如 😀" style="width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:16px;outline:none">`}
    </div>
    <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="newEntryOk">添加</button></div>
  `);
  $("#newEntryInput").focus();
  $("#newEntryOk").addEventListener("click", () => {
    const val = $("#newEntryInput").value.trim();
    if (!val) { toast("内容不能为空"); return; }
    if (type === "text") {
      const lines = val.split("\n").map(s => s.trim()).filter(Boolean);
      lines.forEach(l => Lib.addEntry(type, group, l, charId));
      toast("已添加 " + lines.length + " 条");
    } else {
      Lib.addEntry(type, group, val, charId);
      toast("已添加");
    }
    Modal.close();
    Render.render();
  });
}

/* ---------- 编辑单条 ---------- */
function openEditEntry(group, idx){
  const type = LibView.type;
  const charId = LibView.scope === "per" ? LibView.charId : "";
  const arr = Lib.entries(type, group, charId);
  const old = arr[idx];
  if (type === "image") {
    openAddEntry(group);
    return;
  }
  Modal.open(`
    <div class="modal-head">编辑${LIB_TYPE_NAMES[type]}<button class="modal-close">×</button></div>
    <div class="modal-body">
      <input type="text" id="editEntryInput" value="${esc(old)}" style="width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:15px;outline:none">
    </div>
    <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="editEntryOk">保存</button></div>
  `);
  $("#editEntryInput").focus();
  $("#editEntryOk").addEventListener("click", () => {
    const v = $("#editEntryInput").value.trim();
    if (!v) { toast("内容不能为空"); return; }
    Lib.updateEntry(type, group, idx, v, charId);
    Modal.close();
    Render.render();
  });
}

/* ---------- 批量新增 ---------- */
function openBatchAdd(){
  const type = LibView.type;
  const charId = LibView.scope === "per" ? LibView.charId : "";
  Modal.open(`
    <div class="modal-head">批量新增${LIB_TYPE_NAMES[type]}<button class="modal-close">×</button></div>
    <div class="modal-body batch-add">
      <div style="font-size:13px;color:var(--text-sub);margin-bottom:8px">方式一：大文本框（一行一条）</div>
      <textarea id="batchText" placeholder="每行一条内容…"></textarea>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn" id="batchJsonBtn">方式二：上传 JSON 文件</button>
      </div>
    </div>
    <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="batchOk">添加</button></div>
  `);
  const doImport = (text) => {
    const result = Lib.importJson(charId, type, text);
    if (result.error) { toast(result.error); return; }
    finishImport(result);
  };
  $("#batchJsonBtn").addEventListener("click", () => {
    fileInput(".json,application/json", (input) => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => doImport(reader.result);
      reader.readAsText(file);
    });
  });
  $("#batchOk").addEventListener("click", () => {
    const text = $("#batchText").value.trim();
    if (!text) { toast("请输入内容或选择 JSON 文件"); return; }
    const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
    const result = Lib.importJson(charId, type, text);
    if (result.error) {
      /* 不是合法 JSON：按逐行文本添加到默认分组 */
      let added = 0;
      lines.forEach(l => { if (Lib.addEntry(type, DEFAULT_GROUP, l, charId)) added++; });
      Modal.close();
      toast("已添加 " + added + " 条");
      Render.render();
      return;
    }
    finishImport(result);
  });
  function finishImport(result){
    const dupTotal = result.dup.length;
    if (dupTotal) {
      Modal.close();
      Modal.confirm("发现重复内容", "有 " + dupTotal + " 条内容完全相同。选择「覆盖」替换原内容，或「忽略」跳过不添加。",
        () => {
          const n = Lib.applyImport(result, true);
          toast("导入完成，共 " + n + " 条（含覆盖）");
          Render.render();
        });
      /* 忽略分支：confirm 只有确认；改为两个按钮弹窗 */
      importConfirm(result);
      return;
    }
    const n = Lib.applyImport(result, false);
    Modal.close();
    toast("导入完成，新增 " + n + " 条");
    Render.render();
  }
}
/* 重复时二选一弹窗：覆盖 / 忽略 */
function importConfirm(result){
  Modal.open(`
    <div class="modal-head">发现重复内容<button class="modal-close">×</button></div>
    <div class="modal-body" style="font-size:14px;line-height:1.7">导入内容中有 <b>${result.dup.length}</b> 条完全相同。<br>选择处理方式：</div>
    <div class="modal-foot" style="justify-content:space-between">
      <button class="btn" id="dupIgnore">忽略重复</button>
      <button class="btn btn-primary" id="dupOverwrite">覆盖</button>
    </div>
  `);
  $("#dupIgnore").addEventListener("click", () => {
    const n = Lib.applyImport(result, false);
    Modal.close();
    toast("导入完成，新增 " + n + " 条（重复已忽略）");
    Render.render();
  });
  $("#dupOverwrite").addEventListener("click", () => {
    const n = Lib.applyImport(result, true);
    Modal.close();
    toast("导入完成，共 " + n + " 条（含覆盖）");
    Render.render();
  });
}

/* ---------- 批量删除 ---------- */
function delSelected(){
  const charId = LibView.scope === "per" ? LibView.charId : "";
  const type = LibView.type;
  const items = $$("#libBody .lib-item.on");
  if (!items.length) { toast("请先勾选要删除的内容"); return; }
  const byGroup = {};
  items.forEach(it => {
    const g = it.dataset.group, idx = parseInt(it.dataset.idx, 10);
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(idx);
  });
  Modal.confirm("删除选中", "确定删除勾选的 " + items.length + " 条内容？", () => {
    Object.keys(byGroup).forEach(g => Lib.removeEntries(type, g, byGroup[g], charId));
    toast("已删除 " + items.length + " 条");
    Render.render();
  });
}

/* ---------- 分组管理 ---------- */
function addGroup(){
  const type = LibView.type;
  const charId = LibView.scope === "per" ? LibView.charId : "";
  Modal.open(`
    <div class="modal-head">新增分组<button class="modal-close">×</button></div>
    <div class="modal-body">
      <input type="text" id="groupNameInput" placeholder="分组名（仅用于管理，抽取不受分组限制）" style="width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:14px;outline:none">
    </div>
    <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="groupOk">创建</button></div>
  `);
  $("#groupNameInput").focus();
  $("#groupOk").addEventListener("click", () => {
    if (Lib.addGroup(type, $("#groupNameInput").value, charId)) {
      Modal.close();
      Render.render();
    }
  });
}
function renameGroup(group){
  const type = LibView.type;
  const charId = LibView.scope === "per" ? LibView.charId : "";
  Modal.open(`
    <div class="modal-head">重命名分组<button class="modal-close">×</button></div>
    <div class="modal-body">
      <input type="text" id="groupRenameInput" value="${esc(group)}" style="width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:14px;outline:none">
    </div>
    <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="groupRenameOk">保存</button></div>
  `);
  $("#groupRenameInput").focus();
  $("#groupRenameOk").addEventListener("click", () => {
    if (Lib.renameGroup(type, group, $("#groupRenameInput").value, charId)) {
      Modal.close();
      Render.render();
    }
  });
}
function deleteGroup(group){
  const type = LibView.type;
  const charId = LibView.scope === "per" ? LibView.charId : "";
  Modal.confirm("删除分组", "删除分组「" + group + "」和里面的全部内容？", () => {
    Lib.removeGroup(type, group, charId);
    Render.render();
  });
}

/* ---------- JSON 导入（独立按钮） ---------- */
function importJsonFile(){
  const type = LibView.type;
  const charId = LibView.scope === "per" ? LibView.charId : "";
  fileInput(".json,application/json", (input) => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = Lib.importJson(charId, type, reader.result);
      if (result.error) { toast(result.error + "，原词库未改动"); return; }
      if (result.dup.length) importConfirm(result);
      else {
        const n = Lib.applyImport(result, false);
        toast("导入完成，新增 " + n + " 条");
        Render.render();
      }
    };
    reader.readAsText(file);
  });
}

/* ---------- 列表点击绑定 ---------- */
function bindLibBody(){
  const body = $("#libBody");
  /* 全选 */
  const checkAll = $("#checkAll");
  if (checkAll) checkAll.addEventListener("change", () => {
    $$("#libBody .lib-item").forEach(it => it.classList.toggle("on", checkAll.checked));
    updateSelCount();
  });
  /* 批量删除 */
  const delBtn = $("#delSelBtn");
  if (delBtn) delBtn.addEventListener("click", delSelected);
  /* 批量新增 / 导入 / 导出 / 新增分组 */
  const batchAdd = $("#batchAddBtn");
  if (batchAdd) batchAdd.addEventListener("click", openBatchAdd);
  const addGroupBtn = $("#addGroupBtn");
  if (addGroupBtn) addGroupBtn.addEventListener("click", addGroup);
  const impBtn = $("#importBtn");
  if (impBtn) impBtn.addEventListener("click", importJsonFile);
  const expBtn = $("#exportBtn");
  if (expBtn) expBtn.addEventListener("click", () => {
    Lib.exportJson(LibView.type, LibView.scope === "per" ? LibView.charId : "");
  });
  /* 分组与条目 */
  body.addEventListener("click", (e) => {
    const gAdd = e.target.closest("[data-gadd]");
    if (gAdd) { openAddEntry(gAdd.closest(".lib-group-head").querySelector(".lib-group-name").textContent.replace(/\s*\d+ 条$/, "")); return; }
    const gRen = e.target.closest("[data-gren]");
    if (gRen) { renameGroup(gRen.closest(".lib-group-head").querySelector(".lib-group-name").textContent.replace(/\s*\d+ 条$/, "")); return; }
    const gDel = e.target.closest("[data-gdel]");
    if (gDel) { deleteGroup(gDel.closest(".lib-group-head").querySelector(".lib-group-name").textContent.replace(/\s*\d+ 条$/, "")); return; }
    const item = e.target.closest(".lib-item");
    if (!item) return;
    if (e.target.closest("[data-check]")) {
      item.classList.toggle("on");
      updateSelCount();
      return;
    }
    if (e.target.closest("[data-del]")) {
      const g = item.dataset.group, idx = parseInt(item.dataset.idx, 10);
      const charId = LibView.scope === "per" ? LibView.charId : "";
      Modal.confirm("删除内容", "确定删除这一条？", () => {
        Lib.removeEntry(LibView.type, g, idx, charId);
        Render.render();
      });
      return;
    }
    if (e.target.closest("[data-edit]")) {
      openEditEntry(item.dataset.group, parseInt(item.dataset.idx, 10));
      return;
    }
    /* 点击条目本体：切换勾选 */
    item.classList.toggle("on");
    updateSelCount();
  });
}
function updateSelCount(){
  const n = $$("#libBody .lib-item.on").length;
  const c = $("#selCount");
  if (c) c.textContent = n;
  const checkAll = $("#checkAll");
  if (checkAll) checkAll.checked = n > 0 && n === $$("#libBody .lib-item").length;
}

/* ---------- 初始化 ---------- */
function init(){
  Store.load();
  ReplyQueue.restore();
  bindTabs();
  fillPerSelect();
  Render.render();
  window.addEventListener("sg:data", () => { fillPerSelect(); Render.render(); });
  window.addEventListener("sg:reply", () => renderNavBadge());
}
init();
