"use strict";
/* 聊天主页 js/index.js v3 —— 会话列表 + 搜索 + 左滑/长按删除 + 未读角标 */

/* ---------- 渲染 ---------- */
function sessionPreviewText(s){
  const last = s.messages[s.messages.length - 1];
  let preview = "开始聊天吧";
  if (last) {
    if (last.type === "image") preview = "[表情包]";
    else if (last.type === "emoji") preview = last.content;
    else if (last.type === "redpacket") preview = "[红包]";
    else if (last.type === "survey") preview = "[问卷]";
    else if (last.type === "share") preview = "[分享链接]";
    else if (last.type === "call") preview = last.content;
    else preview = last.content;
    if (last.from !== "me") preview = (s.type === "group" && getChar(last.from) ? getChar(last.from).name + "：" : "") + preview;
    else preview = "我：" + preview;
  }
  return preview;
}
const Render = {
  render(){
    Render.renderSessionList();
    renderNavBadge();
  },
  renderSessionList(){
    const list = $("#sessionList");
    /* 置顶会话排在最前，其余按最后消息时间倒序 */
    const sessions = Object.values(Store.data.sessions).sort((a, b) => {
      const pa = (a.settings && a.settings.pinned) ? 1 : 0;
      const pb = (b.settings && b.settings.pinned) ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    if (!sessions.length) {
      list.innerHTML = `<div class="empty">还没有会话<br>点右上角 ＋ 新建角色或群聊开始聊天</div>`;
      return;
    }
    list.innerHTML = sessions.map(s => {
      const name = sessionDisplayName(s);
      const avatar = sessionDisplayAvatar(s);
      const preview = sessionPreviewText(s);
      const isGroup = s.type === "group";
      const pinned = (s.settings && s.settings.pinned) ? `<span class="session-tag pin">置顶</span>` : "";
      const tag = isGroup ? `<span class="session-tag group">群</span>` : "";
      const unread = s.unread > 0 ? `<span class="session-unread show">${s.unread > 99 ? "99+" : s.unread}</span>` : "";
      return `
      <div class="session" data-sid="${s.id}">
        <div class="session-del" data-del="${s.id}">删除</div>
        <div class="session-main" data-open="${s.id}">
          ${avatarHTML(avatar, name, !isGroup, "chat-avatar")}
          <div class="session-info">
            <div class="session-line">${tag}${pinned}<div class="session-name">${esc(name)}</div></div>
            <div class="session-preview">${esc(preview)}</div>
          </div>
          <div class="session-meta">
            <div class="session-time">${fmtListTime(s.updatedAt || 0)}</div>
            ${unread}
          </div>
        </div>
      </div>`;
    }).join("");
  }
};

/* ---------- 左滑 / 长按手势 ---------- */
function bindSwipe(){
  let startX = 0, startY = 0, longPressTimer = null, moved = false;
  const onStart = (e) => {
    const main = e.target.closest(".session-main");
    if (!main) return;
    const t = e.touches ? e.touches[0] : e;
    startX = t.clientX; startY = t.clientY; moved = false;
    clearTimeout(longPressTimer);
    /* 长按 500ms 露出删除 */
    longPressTimer = setTimeout(() => {
      if (!moved) {
        closeOthers();
        main.parentElement.classList.add("open");
      }
    }, 500);
  };
  const onMove = (e) => {
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - startX, dy = t.clientY - startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
    if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const main = e.target.closest(".session-main");
      if (main) {
        const wrap = main.parentElement;
        if (dx < 0 && !wrap.classList.contains("open")) { closeOthers(); wrap.classList.add("open"); }
        else if (dx > 0 && wrap.classList.contains("open")) wrap.classList.remove("open");
      }
      clearTimeout(longPressTimer);
    }
  };
  const onEnd = () => clearTimeout(longPressTimer);
  const el = $("#sessionList");
  el.addEventListener("touchstart", onStart, { passive: true });
  el.addEventListener("touchmove", onMove, { passive: true });
  el.addEventListener("touchend", onEnd);
  el.addEventListener("mousedown", onStart);
  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseup", onEnd);
  el.addEventListener("mouseleave", onEnd);
}
function closeOthers(){
  $$(".session.open").forEach(s => s.classList.remove("open"));
}

/* ---------- 点击处理 ---------- */
function bindClicks(){
  const addBtn = $("#addBtn");
  const menu = $("#headMenu");
  /* 加号 → 切换右上角下拉菜单 */
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("show");
  });
  /* 点击弹窗外空白区域 → 关闭 */
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#headMenu") && !e.target.closest("#addBtn")) {
      menu.classList.remove("show");
    }
  });
  /* 菜单选项：关闭并跳转对应页面 */
  menu.addEventListener("click", (e) => {
    const item = e.target.closest(".head-menu-item");
    if (!item) return;
    menu.classList.remove("show");
    if (item.dataset.go === "group") location.href = "new-group.html";
    else if (item.dataset.go === "char") location.href = "new-char.html";
  });
  const list = $("#sessionList");
  list.addEventListener("click", (e) => {
    const del = e.target.closest(".session-del");
    if (del) {
      const sid = del.dataset.del;
      Modal.confirm("删除会话", "删除该会话和它的全部聊天记录？", () => Actions.deleteSession(sid));
      return;
    }
    const open = e.target.closest(".session-main");
    if (open) {
      closeOthers();
      location.href = "conversation.html?sid=" + open.dataset.open;
    }
  });
}

/* ---------- 初始化 ---------- */
function init(){
  Store.load();
  ReplyQueue.restore();
  Render.render();
  bindSwipe();
  bindClicks();
  window.addEventListener("sg:data", () => Render.render());
  window.addEventListener("sg:reply", () => Render.render());
}
init();
