"use strict";
/* 聊天页 js/conversation.js v4
   —— 消息渲染（文本/emoji/表情包/红包/问卷/分享/通话）、扩展按钮菜单、
      聊天背景、气泡 CSS、消息定位、模拟视频通话、群成员数含本人 */

const SID = new URLSearchParams(location.search).get("sid") || "";
const FOCUS_ID = new URLSearchParams(location.search).get("focus") || "";

const Render = {
  render(){
    Render.renderChat();
    renderNavBadge();
  },
  /* 生成单条消息 HTML：统一气泡 + 消息下方时间；新增 红包/问卷/分享/通话 类型 */
  buildMsgHTML(msg, session, isGroup){
    const mine = msg.from === "me";
    const role = getChar(msg.from);
    let content = "";
    if (msg.type === "image") {
      content = `<img class="msg-img" src="${esc(msg.image || msg.content)}" alt="表情包" onerror="this.parentElement.textContent='[表情包加载失败]'">`;
    } else if (msg.type === "redpacket") {
      const rp = msg.content || {};
      const money = Number(rp.amount || 0);
      content = `
        <div class="bubble rp-bubble${rp.opened ? " opened" : ""}" data-rp="${esc(msg.id)}">
          <div class="rp-label">${mine ? "发出红包" : "拾光红包"}</div>
          <div class="rp-amt">¥${money.toFixed(2)}</div>
          <div class="rp-note">${esc(rp.note || "恭喜发财")}</div>
          <div class="rp-open">${rp.opened ? "已领取" : "开"}</div>
        </div>`;
    } else if (msg.type === "survey") {
      const sv = msg.content || {};
      const qs = sv.questions || [];
      const done = !!sv.done;
      content = `
        <div class="bubble sv-bubble" data-sv="${esc(msg.id)}">
          <div class="sv-title">📋 ${esc(sv.title || "问卷")}</div>
          <div class="sv-meta">${qs.length} 道题 · ${done ? "已填写" : "待填写"}</div>
          <div class="sv-open">${done ? "查看回答" : "填写问卷"}</div>
        </div>`;
    } else if (msg.type === "share") {
      const sh = msg.content || {};
      content = `
        <div class="bubble sh-bubble" data-url="${esc(sh.url || "")}">
          <div class="sh-domain">${esc(sh.domain || "分享链接")}</div>
          ${sh.title ? `<div class="sh-title">${esc(sh.title)}</div>` : ""}
          ${sh.desc ? `<div class="sh-desc">${esc(sh.desc)}</div>` : ""}
          <div class="sh-open">查看链接 ↗</div>
        </div>`;
    } else if (msg.type === "call") {
      content = `<div class="call-line">${esc(msg.content || "通话")}</div>`;
    } else {
      content = `<div class="bubble">${esc(msg.content)}</div>`;
    }
    const sender = (!mine && isGroup && role && msg.type !== "call") ? `<div class="sender">${esc(role.name)}</div>` : "";
    const time = msg.type === "call" ? "" : `<div class="msg-time">${fmtTime(msg.ts)}</div>`;
    const mid = ` data-mid="${esc(msg.id)}"`;
    return `
    <div class="msg ${mine ? "me" : "role"}${msg.type === "call" ? " sys" : ""}"${mid}>
      ${msg.type === "call" ? content : `
      <div class="msg-avatar">${avatarHTML(mine ? "" : (role ? role.avatar : ""), mine ? "我" : (role ? role.name : "?"), false)}</div>
      <div class="msg-main">
        ${sender}
        ${content}
        ${time}
      </div>`}
    </div>`;
  },
  renderChat(){
    const session = Store.data.sessions[SID];
    const headName = $("#chatName"), headSub = $("#chatSub"), avatarEl = $("#chatAvatar");
    if (!session) {
      headName.textContent = "会话不存在";
      headSub.textContent = "";
      $("#chatBody").innerHTML = `<div class="empty">这个会话已被删除<br><a href="index.html" style="color:var(--primary)">返回消息列表</a></div>`;
      $("#chatFoot").style.display = "none";
      $("#moreBtn").style.display = "none";
      return;
    }
    const isGroup = session.type === "group";
    const name = sessionDisplayName(session);
    const avatar = sessionDisplayAvatar(session);
    headName.textContent = name;
    if (isGroup) {
      const g = getGroup(session.peerId);
      headSub.textContent = g ? `群聊（${g.memberIds.length + 1} 人，含你）` : "";
    } else {
      const c = getChar(session.peerId);
      headSub.textContent = c ? (c.bio || "角色") : "";
    }
    avatarEl.innerHTML = avatarHTML(avatar, name, !isGroup);
    $("#chatFoot").style.display = "";
    $("#moreBtn").style.display = "";
    /* 聊天背景（会话设置） */
    const st = session.settings || defaultSettings();
    const body = $("#chatBody");
    body.style.backgroundImage = st.bgImage ? `url("${st.bgImage.replace(/"/g, "\\\"")}")` : "";
    body.classList.toggle("has-bg", !!st.bgImage);
    /* 消息渲染 */
    let html = "", lastDay = "";
    session.messages.forEach(m => {
      const day = fmtDay(m.ts);
      if (day !== lastDay) { html += `<div class="day-divider">${day}</div>`; lastDay = day; }
      html += Render.buildMsgHTML(m, session, isGroup);
    });
    body.innerHTML = html || `<div class="empty">开始聊天吧</div>`;
    /* 消息定位（查找聊天记录跳转） */
    if (FOCUS_ID) {
      const target = body.querySelector(`[data-mid="${FOCUS_ID}"]`);
      if (target) {
        target.classList.add("msg-focus");
        target.scrollIntoView({ block: "center" });
      } else {
        body.scrollTop = body.scrollHeight;
      }
    } else {
      body.scrollTop = body.scrollHeight;
    }
    /* 正在输入指示 */
    if (ReplyQueue.typingSet.has(SID)) Render.renderTyping(true);
  },
  renderTyping(on){
    const body = $("#chatBody");
    let line = body.querySelector(".typing-line");
    if (on) {
      if (!line) {
        const d = document.createElement("div");
        d.className = "typing-line";
        d.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
        body.appendChild(d);
        body.scrollTop = body.scrollHeight;
      }
    } else if (line) {
      line.remove();
    }
  }
};

function updateSendBtn(){
  const v = $("#msgInput").value.trim();
  $("#sendBtn").disabled = !v;
}
function onSendClick(){
  const input = $("#msgInput");
  const text = input.value.trim();
  if (!text) return;
  Actions.sendMessage(SID, text);
  input.value = "";
  input.style.height = "";
  updateSendBtn();
}

/* ---------- 扩展按钮菜单（相册/拍照/视频通话/红包/分享/问卷） ---------- */
function openExtMenu(){
  Modal.open(`
    <div class="sheet ext-sheet">
      <div class="ext-grid">
        <div class="ext-item" data-ext="album"><div class="ext-ico">🖼️</div><span>相册</span></div>
        <div class="ext-item" data-ext="camera"><div class="ext-ico">📷</div><span>拍照</span></div>
        <div class="ext-item" data-ext="call"><div class="ext-ico">📹</div><span>视频通话</span></div>
        <div class="ext-item" data-ext="redpacket"><div class="ext-ico">🧧</div><span>红包</span></div>
        <div class="ext-item" data-ext="share"><div class="ext-ico">🔗</div><span>分享</span></div>
        <div class="ext-item" data-ext="survey"><div class="ext-ico">📋</div><span>问卷</span></div>
      </div>
      <div class="sheet-item cancel" data-close>取消</div>
    </div>
  `);
  $("#modalRoot").querySelector(".ext-grid").addEventListener("click", (e) => {
    const item = e.target.closest(".ext-item");
    if (!item) return;
    Modal.close();
    const act = item.dataset.ext;
    if (act === "album") pickMedia(false);
    else if (act === "camera") pickMedia(true);
    else if (act === "call") startVideoCall();
    else if (act === "redpacket") openRedpacketModal();
    else if (act === "share") openShareModal();
    else if (act === "survey") openSurveyModal();
  });
}
/* 相册 / 拍照 → 压缩后作为图片消息发送 */
function pickMedia(capture){
  fileInput("image/*", async (input) => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const dataURL = await readImageFile(file, 512);
      Actions.sendMedia(SID, dataURL);
    } catch (e) { toast("图片读取失败：" + e.message); }
  }, capture);
}

/* ---------- 视频通话（模拟界面） ---------- */
let vcallTimer = null, vcallSeconds = 0, vcallConnected = false;
function startVideoCall(){
  const session = Store.data.sessions[SID];
  if (!session || session.type !== "dm") { toast("仅支持与角色视频通话"); return; }
  const c = getChar(session.peerId);
  const overlay = $("#vcall");
  $("#vcallPeer").innerHTML = `
    <div class="vcall-bg"></div>
    <div class="vcall-info">
      <div class="vcall-avatar">${avatarHTML(c ? c.avatar : "", c ? c.name : "?", true)}</div>
      <div class="vcall-name">${esc(c ? c.name : "角色")}</div>
    </div>`;
  overlay.style.display = "flex";
  vcallSeconds = 0; vcallConnected = false;
  $("#vcallTime").textContent = "";
  $("#vcallState").textContent = "正在呼叫…";
  vcallTimer = setTimeout(() => {
    vcallConnected = true;
    $("#vcallState").textContent = "已接通";
    $("#vcallTime").textContent = "00:00";
    vcallTimer = setInterval(() => {
      vcallSeconds++;
      const m = String(Math.floor(vcallSeconds / 60)).padStart(2, "0");
      const s = String(vcallSeconds % 60).padStart(2, "0");
      $("#vcallTime").textContent = m + ":" + s;
    }, 1000);
  }, 1500);
}
function hangupVideoCall(){
  clearTimeout(vcallTimer);
  clearInterval(vcallTimer);
  $("#vcall").style.display = "none";
  const session = Store.data.sessions[SID];
  if (!session || !vcallConnected) return;
  const m = String(Math.floor(vcallSeconds / 60)).padStart(2, "0");
  const s = String(vcallSeconds % 60).padStart(2, "0");
  const msg = { id: uid(), from: "me", type: "call", content: "视频通话 " + m + ":" + s, ts: Date.now() };
  session.messages.push(msg);
  session.updatedAt = Date.now();
  Store.save();
  /* 挂断后角色补一句（从词库随机） */
  const peerId = session.peerId;
  ReplyQueue.schedule(SID, peerId, msg.id, null);
  window.dispatchEvent(new Event("sg:data"));
}

/* ---------- 红包 ---------- */
const RP_AMOUNTS = [1, 6.66, 8.88, 20, 52];
function openRedpacketModal(){
  Modal.open(`
    <div class="modal-head">发红包<button class="modal-close">×</button></div>
    <div class="modal-body">
      <div class="field"><label>金额</label>
        <div class="rp-amounts" id="rp-amounts">
          ${RP_AMOUNTS.map(a => `<div class="rp-amt-opt" data-amt="${a}">¥${a}</div>`).join("")}
          <div class="rp-amt-opt custom" data-amt="custom">自定义</div>
        </div>
        <input type="number" id="rp-custom" min="0.01" max="200" step="0.01" placeholder="输入金额（0.01~200）" style="display:none;width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:14px;margin-top:8px;outline:none">
      </div>
      <div class="field"><label>祝福语</label>
        <input type="text" id="rp-note" maxlength="30" placeholder="恭喜发财，大吉大利" style="width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:14px;outline:none">
      </div>
    </div>
    <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="rp-ok">塞钱进红包</button></div>
  `);
  let amount = 6.66;
  $("#rp-amounts").addEventListener("click", (e) => {
    const opt = e.target.closest(".rp-amt-opt");
    if (!opt) return;
    $$(".rp-amt-opt").forEach(x => x.classList.remove("on"));
    opt.classList.add("on");
    const v = opt.dataset.amt;
    const custom = $("#rp-custom");
    if (v === "custom") { custom.style.display = ""; custom.focus(); amount = 0; }
    else { custom.style.display = "none"; amount = Number(v); }
  });
  $$(".rp-amt-opt")[1].classList.add("on");
  $("#rp-custom").addEventListener("input", () => {
    const v = parseFloat($("#rp-custom").value);
    if (v > 0 && v <= 200) amount = v;
  });
  $("#rp-ok").addEventListener("click", () => {
    if (!amount || amount <= 0) { toast("请选择或输入金额"); return; }
    const note = ($("#rp-note").value.trim() || "恭喜发财，大吉大利").slice(0, 30);
    const session = Store.data.sessions[SID];
    if (!session) return;
    const msg = { id: uid(), from: "me", type: "redpacket", content: { amount, note, opened: false }, ts: Date.now() };
    session.messages.push(msg);
    session.updatedAt = Date.now();
    Store.save();
    const fromId = session.type === "dm" ? session.peerId : ReplyQueue.pickSpeaker(session);
    if (fromId) ReplyQueue.schedule(SID, fromId, msg.id, REDPACKET_THANKS[Math.floor(Math.random() * REDPACKET_THANKS.length)]);
    window.dispatchEvent(new Event("sg:data"));
    Modal.close();
    toast("红包已发出");
  });
}
function openRedpacketDetail(msg){
  const rp = msg.content || {};
  Modal.open(`
    <div class="modal-head">红包详情<button class="modal-close">×</button></div>
    <div class="modal-body" style="text-align:center;padding:24px">
      <div style="font-size:40px">🧧</div>
      <div style="font-size:30px;font-weight:700;color:#fa5151;margin:10px 0">¥${Number(rp.amount || 0).toFixed(2)}</div>
      <div style="font-size:13px;color:#999">${esc(rp.note || "恭喜发财")}</div>
      <div style="font-size:13px;color:${rp.opened ? "var(--primary)" : "#999"};margin-top:14px">${rp.opened ? "对方已领取" : "等待对方领取…"}</div>
    </div>
    <div class="modal-foot"><button class="btn" data-close>知道了</button></div>
  `);
}

/* ---------- 分享：尽力解析链接，失败发卡片 ---------- */
function parseShareUrl(url){
  return fetch(url, { mode: "cors", redirect: "follow" })
    .then(r => r.text())
    .then(html => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const title = (doc.querySelector("title") ? doc.querySelector("title").textContent.trim() : "");
      const desc = (doc.querySelector('meta[name="description"]') ? doc.querySelector('meta[name="description"]').getAttribute("content") : "")
                 || (doc.querySelector('meta[property="og:description"]') ? doc.querySelector('meta[property="og:description"]').getAttribute("content") : "")
                 || (doc.querySelector('meta[property="og:title"]') ? doc.querySelector('meta[property="og:title"]').getAttribute("content") : "");
      return { title, desc };
    })
    .catch(() => null);
}
function openShareModal(){
  Modal.open(`
    <div class="modal-head">分享链接<button class="modal-close">×</button></div>
    <div class="modal-body">
      <div class="field"><label>粘贴抖音 / 小红书等平台链接或文字</label>
        <textarea id="sh-link" rows="3" placeholder="https://… 或直接输入文字" style="width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:14px;outline:none;resize:none"></textarea>
      </div>
      <div class="field hint" style="font-size:12px;color:#b0b0b0">可访问的链接会自动解析标题；受限平台链接将显示为卡片</div>
    </div>
    <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="sh-ok">发送</button></div>
  `);
  $("#sh-ok").addEventListener("click", async () => {
    const raw = ($("#sh-link").value || "").trim();
    if (!raw) { toast("请输入链接或文字"); return; }
    Modal.close();
    const urlMatch = raw.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      const url = urlMatch[0];
      const parsed = await parseShareUrl(url);
      const domain = (url.match(/^https?:\/\/([^\/]+)/i) || [])[1] || url;
      const content = { url, domain, title: (parsed && parsed.title) || "", desc: (parsed && parsed.desc) || "" };
      Actions.sendMessageEx(SID, { type: "share", content });
      if (parsed && parsed.title) toast("已解析并发送");
      else toast("已发送链接卡片（该平台受限无法解析）");
    } else {
      Actions.sendMessage(SID, raw);
    }
  });
}

/* ---------- 问卷：创建并发送，角色自动填写 ---------- */
function randomSurveyAnswer(q){
  if (q.kind === "single") {
    return q.options[Math.floor(Math.random() * q.options.length)];
  }
  if (q.kind === "multi") {
    const shuffled = q.options.slice().sort(() => Math.random() - 0.5);
    const n = 1 + Math.floor(Math.random() * Math.min(2, shuffled.length));
    return shuffled.slice(0, n).join("、");
  }
  return SURVEY_TEXT_ANSWERS[Math.floor(Math.random() * SURVEY_TEXT_ANSWERS.length)];
}
function openSurveyModal(){
  let count = 0;
  const addQuestion = () => {
    count++;
    const idx = count;
    const wrap = $("#svq-list");
    const div = document.createElement("div");
    div.className = "svq-item";
    div.dataset.idx = idx;
    div.innerHTML = `
      <div class="svq-head">
        <span class="svq-no">Q${idx}</span>
        <select class="svq-kind">
          <option value="single">单选</option><option value="multi">多选</option><option value="text">文本</option>
        </select>
        <button class="svq-del" type="button">删除</button>
      </div>
      <input class="svq-q" placeholder="题目内容">
      <input class="svq-opts" placeholder="选项，用「、」分隔（文本题不用填）">
    `;
    wrap.appendChild(div);
    div.querySelector(".svq-del").addEventListener("click", () => { div.remove(); count--; });
  };
  Modal.open(`
    <div class="modal-head">创建问卷<button class="modal-close">×</button></div>
    <div class="modal-body">
      <div class="field"><label>问卷标题</label>
        <input type="text" id="svq-title" maxlength="20" placeholder="问卷标题" style="width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:14px;outline:none">
      </div>
      <div class="field"><label>题目</label>
        <div class="svq-list" id="svq-list"></div>
        <button class="btn" id="svq-add" style="width:100%">＋ 添加题目</button>
      </div>
    </div>
    <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="svq-ok">发送问卷</button></div>
  `);
  $("#svq-add").addEventListener("click", addQuestion);
  addQuestion();
  addQuestion();
  $("#svq-ok").addEventListener("click", () => {
    const title = ($("#svq-title").value || "").trim();
    if (!title) { toast("请填写问卷标题"); return; }
    const questions = [];
    let ok = true;
    $$("#svq-list .svq-item").forEach(item => {
      const q = item.querySelector(".svq-q").value.trim();
      const kind = item.querySelector(".svq-kind").value;
      const opts = item.querySelector(".svq-opts").value.split(/[、,，]/).map(s => s.trim()).filter(Boolean);
      if (!q) { ok = false; return; }
      if ((kind === "single" || kind === "multi") && opts.length < 2) { ok = false; return; }
      questions.push({ q, kind, options: opts, answer: "" });
    });
    if (!ok) { toast("请完整填写题目：题干必填，单选/多选至少 2 个选项"); return; }
    if (!questions.length) { toast("请至少添加 1 道题目"); return; }
    const done = { title, questions: questions.map(q => Object.assign({}, q, { answer: randomSurveyAnswer(q) })), done: true };
    Actions.sendMessageEx(SID, { type: "survey", content: done });
    Modal.close();
    toast("问卷已发送，等角色填写…");
  });
}
function openSurveyDetail(msg){
  const sv = msg.content || {};
  Modal.open(`
    <div class="modal-head">${esc(sv.title || "问卷")}<button class="modal-close">×</button></div>
    <div class="modal-body sv-detail">
      ${(sv.questions || []).map((q, i) => `
        <div class="svq-result">
          <div class="svq-q">Q${i + 1}. ${esc(q.q)}（${q.kind === "single" ? "单选" : q.kind === "multi" ? "多选" : "文本"}）</div>
          <div class="svq-a">${esc(q.answer || "（未填写）")}</div>
        </div>`).join("") || '<div style="color:#999;font-size:13px">问卷暂无题目</div>'}
    </div>
    <div class="modal-foot"><button class="btn" data-close>关闭</button></div>
  `);
}

/* ---------- 更多菜单（群聊保留；私聊直接进角色编辑页） ---------- */
function openMoreMenu(){
  const session = Store.data.sessions[SID];
  if (!session) return;
  const menu = $("#moreMenu");
  const items = [{ label: "编辑群聊", act: "editGroup" }];
  items.push({ label: "清空聊天记录", act: "clear" });
  items.push({ label: "删除会话", act: "del", danger: true });
  menu.innerHTML = items.map(it => `<div class="drop-item${it.danger ? " danger" : ""}" data-act="${it.act}">${it.label}</div>`).join("");
  menu.classList.add("show");
}
function onMoreMenuClick(e){
  const item = e.target.closest(".drop-item");
  if (!item) return;
  const act = item.dataset.act;
  $("#moreMenu").classList.remove("show");
  const session = Store.data.sessions[SID];
  if (!session) return;
  if (act === "editGroup") openGroupModal(session.peerId);
  else if (act === "clear") {
    Modal.confirm("清空聊天记录", "删除这个会话里的全部消息？", () => Actions.clearMessages(SID));
  } else if (act === "del") {
    Modal.confirm("删除会话", "删除该会话和它的全部聊天记录？", () => {
      Actions.deleteSession(SID);
      location.href = "index.html";
    });
  }
}

/* ---------- 初始化 ---------- */
function init(){
  Store.load();
  ReplyQueue.restore();
  ProactiveScheduler.start();
  const session = Store.data.sessions[SID];
  if (session) { session.unread = 0; Store.save(); }
  /* 气泡自定义 CSS（会话设置） */
  const st = (session && session.settings) || defaultSettings();
  if (st.bubbleCss) {
    const link = document.createElement("link");
    link.id = "bubbleCssLink";
    link.rel = "stylesheet";
    link.href = st.bubbleCss;
    document.head.appendChild(link);
  }
  Render.render();
  const input = $("#msgInput");
  input.addEventListener("input", () => {
    updateSendBtn();
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 110) + "px";
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSendClick(); }
  });
  $("#sendBtn").addEventListener("click", onSendClick);
  /* 扩展按钮 */
  $("#extBtn").addEventListener("click", (e) => { e.stopPropagation(); openExtMenu(); });
  /* 右上角：私聊 → 角色编辑页；群聊 → 更多菜单 */
  $("#moreBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    if (session && session.type === "dm") location.href = "chat-info.html?sid=" + SID;
    else openMoreMenu();
  });
  $("#moreMenu").addEventListener("click", onMoreMenuClick);
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#moreBtn") && !e.target.closest("#moreMenu")) $("#moreMenu").classList.remove("show");
  });
  /* 红包 / 问卷 / 分享 气泡点击 */
  $("#chatBody").addEventListener("click", (e) => {
    const rp = e.target.closest(".rp-bubble");
    if (rp) {
      const msg = session.messages.find(m => m.id === rp.dataset.rp);
      if (msg) openRedpacketDetail(msg);
      return;
    }
    const sv = e.target.closest(".sv-bubble");
    if (sv) {
      const msg = session.messages.find(m => m.id === sv.dataset.sv);
      if (msg) openSurveyDetail(msg);
      return;
    }
    const sh = e.target.closest(".sh-bubble");
    if (sh) {
      const url = sh.dataset.url;
      if (url) window.open(url, "_blank");
      return;
    }
  });
  /* 视频通话挂断 */
  $("#vcallHangup").addEventListener("click", hangupVideoCall);
  window.addEventListener("sg:data", () => {
    if (!Store.data.sessions[SID]) { location.href = "index.html"; return; }
    Render.render();
  });
  window.addEventListener("sg:reply", () => {
    if (Store.data.sessions[SID]) Render.render();
  });
  window.addEventListener("sg:typing", (e) => {
    if (e.detail && e.detail.sessionId === SID) Render.renderTyping(e.detail.typing);
  });
}
init();
