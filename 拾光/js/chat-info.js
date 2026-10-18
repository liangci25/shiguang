"use strict";
/* 角色编辑页 js/chat-info.js v4 —— 置顶 / 聊天背景 / 查找记录 / 清空 / 进聊天设置 */

const SID = new URLSearchParams(location.search).get("sid") || "";

function init(){
  Store.load();
  const session = Store.data.sessions[SID];
  if (!session || session.type !== "dm") {
    toast("会话不存在");
    setTimeout(() => location.href = "index.html", 800);
    return;
  }
  const c = getChar(session.peerId);
  const st = session.settings || defaultSettings();
  $("#ci-avatar").innerHTML = avatarHTML(c ? c.avatar : "", c ? c.name : "?", true);
  $("#ci-name").textContent = c ? c.name : "已删除角色";
  $("#ci-bio").textContent = c ? (c.bio || "角色") : "";
  const pinEl = $("#ci-pin");
  const renderPin = () => {
    pinEl.classList.toggle("on", !!st.pinned);
    pinEl.textContent = st.pinned ? "已置顶" : "未置顶";
  };
  renderPin();
  $("#ci-bgval").textContent = st.bgImage ? "已设置" : "默认";
  /* 列表点击 */
  document.querySelector(".ci-list").addEventListener("click", (e) => {
    const row = e.target.closest(".ci-row");
    if (!row) return;
    const act = row.dataset.act;
    if (act === "settings") location.href = "chat-settings.html?sid=" + SID;
    else if (act === "pin") {
      st.pinned = !st.pinned;
      Store.save();
      renderPin();
      toast(st.pinned ? "已置顶到首页顶部" : "已取消置顶");
    }
    else if (act === "bg") openBgModal(session, st);
    else if (act === "search") openSearchModal(session);
    else if (act === "clear") {
      Modal.confirm("清空聊天记录", "删除这个会话里的全部消息？此操作无法恢复。", () => {
        Actions.clearMessages(SID);
        toast("聊天记录已清空");
      });
    }
  });
}

/* ---------- 聊天背景：本地上传 + URL 链接 ---------- */
function openBgModal(session, st){
  Modal.open(`
    <div class="modal-head">设置聊天背景<button class="modal-close">×</button></div>
    <div class="modal-body">
      <div class="cbg-preview" id="cbg-preview"><span>背景预览</span></div>
      <div class="field" style="margin-top:12px">
        <label>图片 URL（粘贴实时预览）</label>
        <input type="text" id="cbg-url" placeholder="https://… 图片链接" style="width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:14px;outline:none">
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn" id="cbg-upload">本地上传</button>
      <div style="flex:1"></div>
      <button class="btn" data-close>取消</button>
      <button class="btn btn-primary" id="cbg-save">保存背景</button>
    </div>
  `);
  const preview = $("#cbg-preview");
  const applyBg = (url) => {
    preview.style.backgroundImage = url ? `url("${url.replace(/"/g, "\\\"")}")` : "";
    preview.classList.toggle("has", !!url);
  };
  applyBg(st.bgImage);
  let picked = st.bgImage || "";
  /* URL 实时预览（防抖 400ms） */
  let timer = null;
  $("#cbg-url").addEventListener("input", () => {
    clearTimeout(timer);
    const url = $("#cbg-url").value.trim();
    if (!url) { applyBg(""); picked = ""; return; }
    timer = setTimeout(() => {
      checkImageUrl(url).then(ok => {
        if (!ok) { toast("链接失效或不是图片，未更新"); return; }
        picked = url;
        applyBg(url);
      });
    }, 400);
  });
  /* 本地上传 */
  $("#cbg-upload").addEventListener("click", () => {
    fileInput("image/*", async (input) => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        picked = await readImageFile(file, 512);
        applyBg(picked);
        toast("已选择本地图片");
      } catch (err) { toast("图片读取失败：" + err.message); }
    });
  });
  $("#cbg-save").addEventListener("click", () => {
    st.bgImage = picked;
    Store.save();
    Modal.close();
    $("#ci-bgval").textContent = st.bgImage ? "已设置" : "默认";
    toast(st.bgImage ? "聊天背景已保存" : "已恢复默认背景");
  });
}

/* ---------- 查找聊天记录：搜索 → 结果列表 → 点击定位到聊天页 ---------- */
function openSearchModal(session){
  const keyword = $("#csearch-input") ? $("#csearch-input").value : "";
  Modal.open(`
    <div class="modal-head">查找聊天记录<button class="modal-close">×</button></div>
    <div class="modal-body">
      <input type="text" id="csearch-input" placeholder="输入关键词搜索历史消息" style="width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:14px;outline:none">
      <div class="csearch-list" id="csearch-list"></div>
    </div>
  `);
  const input = $("#csearch-input");
  const list = $("#csearch-list");
  const render = () => {
    const kw = input.value.trim().toLowerCase();
    if (!kw) { list.innerHTML = `<div class="empty" style="padding:20px">输入关键词开始搜索</div>`; return; }
    const hits = session.messages.filter(m =>
      m.type !== "image" && m.type !== "call" && String(m.content || "").toLowerCase().includes(kw)
    );
    if (!hits.length) { list.innerHTML = `<div class="empty" style="padding:20px">没有找到相关内容</div>`; return; }
    list.innerHTML = hits.slice().reverse().slice(0, 50).map(m => {
      const role = m.from === "me" ? "我" : (getChar(m.from) ? getChar(m.from).name : "?");
      const text = (typeof m.content === "string" ? m.content : JSON.stringify(m.content));
      return `<div class="csearch-hit" data-mid="${esc(m.id)}">
        <div class="csearch-line">${esc(role)} · ${esc(fmtTime(m.ts))}</div>
        <div class="csearch-text">${esc(text.slice(0, 40))}</div>
      </div>`;
    }).join("");
  };
  input.addEventListener("input", render);
  render();
  list.addEventListener("click", (e) => {
    const hit = e.target.closest(".csearch-hit");
    if (!hit) return;
    location.href = "conversation.html?sid=" + SID + "&focus=" + hit.dataset.mid;
  });
}
init();
