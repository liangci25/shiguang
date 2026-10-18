"use strict";
/* ================================================================
   拾光 · 模拟小手机对话网站 —— 公共逻辑（js/common.js）v3
   被所有页面共享：工具函数、数据层 Store、词库系统 Lib、
   回复调度 ReplyQueue、交互 Actions、弹窗 Modal、头像选择。
   数据全部保存在浏览器 localStorage，不会上传到任何服务器。
   命名与编号见 NAMING.md。
   ================================================================ */

/* ---------- 工具函数 Utils ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const AVATAR_COLORS = ["#5b8ff9","#5ad8a6","#f6bd16","#e8684a","#6dc8ec","#9270ca","#ff9d4d","#269a99","#ff99c3","#9a7f5f"];
function avatarColor(name){
  let n = 0;
  for (let i = 0; i < name.length; i++) n = (n * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function avatarHTML(avatar, name, online, id){
  const c = avatarColor(name || "?");
  const cls = "avatar" + (online ? " online" : "");
  const initial = esc((name || "?").slice(0, 1));
  const img = avatar ? `<img src="${esc(avatar)}" alt="" onerror="this.remove()">` : "";
  return `<div class="${cls}"${id ? ` id="${id}"` : ""} style="background:${c}">${initial}${img}</div>`;
}
function fmtTime(ts){
  const d = new Date(ts), now = new Date();
  const hm = String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
  if (d.toDateString() === now.toDateString()) return hm;
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "昨天 " + hm;
  return (d.getMonth()+1) + "月" + d.getDate() + "日 " + hm;
}
function fmtListTime(ts){
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString()) return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "昨天";
  return (d.getMonth()+1) + "月" + d.getDate() + "日";
}
function fmtDay(ts){
  const d = new Date(ts), now = new Date();
  if (d.toDateString() === now.toDateString()) return "今天";
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "昨天";
  return (d.getMonth()+1) + "月" + d.getDate() + "日";
}
function toast(msg){
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2000);
}
function compressImage(file, maxSize){
  const size = maxSize || 256;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}
/* 通用图片读取：File → 压缩 dataURL（头像压缩 256；表情包 512） */
function readImageFile(file, maxSize){
  const size = maxSize || 512;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("图片加载失败"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}
/* URL 图片合法性校验：能加载才算有效 */
function checkImageUrl(url){
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
/* 统一文件选择框：挂载到 DOM 后触发，支持拍照 capture */
function fileInput(accept, onChange, capture){
  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  if (capture) input.setAttribute("capture", "environment");
  input.style.display = "none";
  document.body.appendChild(input);
  input.addEventListener("change", () => {
    onChange(input);
    if (input.parentNode) input.parentNode.removeChild(input);
  });
  input.click();
}
/* 未读角标 */
function renderNavBadge(){
  const total = Object.values(Store.data.sessions).reduce((n, s) => n + (s.unread || 0), 0);
  const badge = $("#navChatBadge");
  if (!badge) return;
  badge.textContent = total > 99 ? "99+" : total;
  badge.classList.toggle("show", total > 0);
}

/* ---------- 存储与配置 ---------- */
const STORAGE_KEY = "shiguang_chat_v1";
const FALLBACK_REPLIES = ["……", "（这个角色还没想好怎么回复）", "嗯嗯，然后呢？"];
const LIB_TYPES = ["text", "emoji", "image"];
const LIB_TYPE_NAMES = { text: "字卡", emoji: "Emoji", image: "表情包" };
const DEFAULT_GROUP = "默认分组";

/* ---------- 默认数据（v3：会话设置 + 主动消息） ---------- */
function emptyLibPer(){
  return { text: { "默认分组": [] }, emoji: { "默认分组": [] }, image: { "默认分组": [] } };
}
function defaultSettings(){
  return { pinned: false, bgImage: "", minReplyMin: 0, maxReplyMin: 2, replyConfigured: false, proactive: false, proactiveMin: 2, bubbleCss: "" };
}
function defaultData(){
  return {
    version: 3,
    me: { name: "我" },
    characters: [{
      id: "demo-shiguang",
      name: "拾光",
      avatar: "",
      bio: "跨次元的你，欢迎来到我的世界"
    }],
    groups: [],
    sessions: {},
    pendingReplies: {},
    library: {
      common: {
        text: { "默认分组": ["在忙什么呢？", "哈哈，有意思~", "今天天气不错呢", "你说的对！", "让我想想……嗯"] },
        emoji: { "默认分组": ["😀", "😂", "👍", "❤️", "😉", "🥳"] },
        image: { "默认分组": [] }
      },
      per: { "demo-shiguang": { text: { "默认分组": ["你好呀，我是拾光！", "今天想聊点什么？", "我在呢，说吧！"] }, emoji: { "默认分组": ["✨", "🙌"] }, image: { "默认分组": [] } } }
    }
  };
}

/* ---------- 07.1 数据层 Store ---------- */
const Store = {
  data: null,
  load(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.characters) && data.sessions && Array.isArray(data.groups)) {
          Store.migrate(data);
          Store.data = data;
          return;
        }
      }
    } catch (e) { /* 数据损坏，走默认数据 */ }
    Store.data = defaultData();
    Store.save();
  },
  /* 数据迁移：v1→v2（replies→专属词库）；v2→v3（会话设置 settings + 主动消息时间） */
  migrate(data){
    if (data.version >= 2 && data.library) {
      if (data.version < 3) {
        data.version = 3;
        Object.values(data.sessions || {}).forEach(s => {
          s.settings = defaultSettings();
          s.lastProactiveAt = 0;
        });
        Store.save();
      }
      return;
    }
    data.version = 2;
    data.library = {
      common: { text: { "默认分组": ["在忙什么呢？", "哈哈，有意思~", "今天天气不错呢", "你说的对！", "让我想想……嗯"] },
                emoji: { "默认分组": ["😀", "😂", "👍", "❤️", "😉", "🥳"] },
                image: { "默认分组": [] } },
      per: {}
    };
    (data.characters || []).forEach(c => {
      const lib = { text: { "默认分组": Array.isArray(c.replies) ? c.replies : [] },
                    emoji: { "默认分组": [] }, image: { "默认分组": [] } };
      data.library.per[c.id] = lib;
    });
    data.characters.forEach(c => { delete c.replies; });
    Store.save();
  },
  save(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Store.data));
    } catch (e) {
      toast("保存失败：本地存储空间不足，图片请改用更小的文件");
    }
  },
  reset(){
    Store.data = defaultData();
    Store.save();
    ReplyQueue.queues = {};
    ReplyQueue.typingSet.clear();
    ReplyQueue.lastSpeakers = {};
  },
  exportJson(){
    const blob = new Blob([JSON.stringify(Store.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "shiguang-backup.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    toast("已导出备份文件");
  },
  importJson(file, onDone){
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.characters) || !data.sessions || !Array.isArray(data.groups)) {
          throw new Error("文件格式不正确");
        }
        Store.migrate(data);
        Store.data = data;
        Store.save();
        ReplyQueue.queues = {};
        ReplyQueue.typingSet.clear();
        ReplyQueue.lastSpeakers = {};
        toast("导入成功");
        if (onDone) setTimeout(onDone, 500);
      } catch (e) {
        toast("导入失败：" + e.message);
      }
    };
    reader.onerror = () => toast("文件读取失败");
    reader.readAsText(file);
  }
};

/* ---------- 07.5 词库系统 Lib ---------- */
const Lib = {
  /* 角色专属词库容器（不存在则初始化） */
  perLib(charId){
    const per = Store.data.library.per;
    if (!per[charId]) per[charId] = emptyLibPer();
    return per[charId];
  },
  /* 指定作用域下的分组名列表：common 为通用，charId 为专属 */
  groupNames(type, charId){
    const src = charId ? Lib.perLib(charId)[type] : Store.data.library.common[type];
    const names = Object.keys(src || {});
    return names.length ? names : [DEFAULT_GROUP];
  },
  /* 指定作用域 + 分组下的条目列表 */
  entries(type, group, charId){
    const src = charId ? Lib.perLib(charId)[type] : Store.data.library.common[type];
    if (!src[group]) src[group] = [];
    return src[group];
  },
  /* 单条新增 */
  addEntry(type, group, content, charId){
    if (!content || !content.trim()) return false;
    const arr = Lib.entries(type, group, charId);
    if (!arr.includes(content.trim())) arr.push(content.trim());
    Store.save();
    return true;
  },
  /* 单条编辑 */
  updateEntry(type, group, index, content, charId){
    const arr = Lib.entries(type, group, charId);
    if (index < 0 || index >= arr.length || !content.trim()) return;
    if (arr.includes(content.trim())) { toast("该内容已存在"); return; }
    arr[index] = content.trim();
    Store.save();
  },
  /* 单条删除 */
  removeEntry(type, group, index, charId){
    const arr = Lib.entries(type, group, charId);
    arr.splice(index, 1);
    Store.save();
  },
  /* 批量删除（按索引集合） */
  removeEntries(type, group, indexes, charId){
    const arr = Lib.entries(type, group, charId);
    const set = new Set(indexes);
    Store.data && Store.save();
    const next = arr.filter((_, i) => !set.has(i));
    const src = charId ? Lib.perLib(charId)[type] : Store.data.library.common[type];
    src[group] = next;
    Store.save();
  },
  /* 分组管理 */
  addGroup(type, name, charId){
    name = (name || "").trim();
    if (!name) { toast("分组名不能为空"); return false; }
    const src = charId ? Lib.perLib(charId)[type] : Store.data.library.common[type];
    if (src[name]) { toast("分组已存在"); return false; }
    src[name] = [];
    Store.save();
    return true;
  },
  renameGroup(type, oldName, newName, charId){
    newName = (newName || "").trim();
    if (!newName || newName === oldName) return false;
    const src = charId ? Lib.perLib(charId)[type] : Store.data.library.common[type];
    if (src[newName]) { toast("分组名已存在"); return false; }
    src[newName] = src[oldName];
    delete src[oldName];
    Store.save();
    return true;
  },
  removeGroup(type, name, charId){
    const src = charId ? Lib.perLib(charId)[type] : Store.data.library.common[type];
    if (!src[name]) return;
    delete src[name];
    Store.save();
  },
  /* 混合随机抽取一条：通用 + 专属合并，字卡/Emoji/表情包无优先级 */
  draw(charId){
    const pool = [];
    ["text", "emoji", "image"].forEach(t => {
      const common = Store.data.library.common[t];
      Object.keys(common).forEach(g => common[g].forEach(c => pool.push({ type: t, content: c })));
      if (charId) {
        const per = Lib.perLib(charId)[t];
        Object.keys(per).forEach(g => per[g].forEach(c => pool.push({ type: t, content: c })));
      }
    });
    if (!pool.length) {
      return { type: "text", content: FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)] };
    }
    return pool[Math.floor(Math.random() * pool.length)];
  },
  /* JSON 导入（追加模式）：返回 {added, dup, newGroups}。
     格式① 纯字符串数组 → 默认分组
     格式② 对象 {分组名: [内容]} 或 数组元素 {name/group, items:[内容]} */
  importJson(charId, type, json){
    const target = charId ? Lib.perLib(charId)[type] : Store.data.library.common[type];
    if (!target[DEFAULT_GROUP]) target[DEFAULT_GROUP] = [];
    let parsed;
    try {
      parsed = typeof json === "string" ? JSON.parse(json) : json;
    } catch (e) {
      return { error: "JSON 格式错误：" + e.message };
    }
    const groups = [];
    if (Array.isArray(parsed)) {
      /* 纯字符串数组 */
      if (parsed.every(x => typeof x === "string")) {
        groups.push({ name: DEFAULT_GROUP, items: parsed });
      } else {
        /* 数组元素为对象 {name/group, items} */
        for (const item of parsed) {
          if (item && typeof item === "object" && Array.isArray(item.items)) {
            groups.push({ name: (item.name || item.group || DEFAULT_GROUP).trim(), items: item.items });
          }
        }
      }
    } else if (parsed && typeof parsed === "object") {
      /* 对象 {分组名: [内容]} */
      for (const name of Object.keys(parsed)) {
        if (Array.isArray(parsed[name])) groups.push({ name, items: parsed[name] });
      }
    }
    if (!groups.length) return { error: "无法识别的 JSON 结构（应为字符串数组或 分组→数组 对象）" };
    /* 计算新增与重复 */
    const added = [], dup = [];
    groups.forEach(g => {
      if (!target[g.name]) target[g.name] = [];
      (g.items || []).forEach(it => {
        const s = String(it).trim();
        if (!s) return;
        if (target[g.name].includes(s)) dup.push({ group: g.name, content: s });
        else added.push({ group: g.name, content: s });
      });
    });
    return { added, dup, groups, type, charId };
  },
  /* 应用导入结果：overwrite=true 覆盖重复（在原位置替换），false 忽略 */
  applyImport(result, overwrite){
    const target = result.charId ? Lib.perLib(result.charId)[result.type] : Store.data.library.common[result.type];
    result.groups.forEach(g => {
      if (!target[g.name]) target[g.name] = [];
    });
    result.added.forEach(x => target[x.group].push(x.content));
    if (overwrite) {
      result.dup.forEach(d => {
        const idx = target[d.group].indexOf(d.content);
        if (idx >= 0) target[d.group][idx] = d.content;
      });
    }
    Store.save();
    return result.added.length + (overwrite ? result.dup.length : 0);
  },
  /* 导出带分组结构的 JSON：通用词库或指定角色专属词库的某一类型 */
  exportJson(type, charId){
    const src = charId ? Lib.perLib(charId)[type] : Store.data.library.common[type];
    const obj = {};
    Object.keys(src).forEach(g => { obj[g] = src[g].slice(); });
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (charId ? "lyrics-" + charId.slice(0, 8) : "lyrics-common") + "-" + type + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    toast("已导出词库 JSON");
  }
};

/* ---------- 07.4 回复调度 ReplyQueue（跨页面持久化 + 群聊轮流） ---------- */
const ReplyQueue = {
  queues: {},
  typingSet: new Set(),
  lastSpeakers: {},
  persist(){
    const pending = {};
    for (const sid in ReplyQueue.queues) {
      const q = ReplyQueue.queues[sid];
      if (q && q.tasks.length) pending[sid] = q.tasks.slice();
    }
    Store.data.pendingReplies = pending;
    Store.save();
  },
  schedule(sessionId, fromId, msgId, replyContent){
    if (!ReplyQueue.queues[sessionId]) ReplyQueue.queues[sessionId] = { tasks: [], running: false };
    ReplyQueue.queues[sessionId].tasks.push({ from: fromId, msgId, replyContent: replyContent || null });
    ReplyQueue.persist();
    ReplyQueue.pump(sessionId);
  },
  /* 群聊选发言者：随机选一个 ≠ 上次发言者（成员≥2 时避免连续同角色） */
  pickSpeaker(session){
    const g = getGroup(session.peerId);
    if (!g || !g.memberIds.length) return null;
    const members = g.memberIds.filter(id => getChar(id));
    if (!members.length) return null;
    if (members.length === 1) return members[0];
    const last = ReplyQueue.lastSpeakers[session.id];
    const candidates = members.filter(m => m !== last);
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    ReplyQueue.lastSpeakers[session.id] = pick;
    return pick;
  },
  pump(sessionId){
    const q = ReplyQueue.queues[sessionId];
    if (!q || q.running) return;
    const task = q.tasks.shift();
    if (!task) return;
    q.running = true;
    ReplyQueue.typingSet.add(sessionId);
    window.dispatchEvent(new CustomEvent("sg:typing", { detail: { sessionId, typing: true } }));
    /* 回复延迟：未在聊天设置里配置过 → 保持秒级快速（原体验）；
       配置过 → 按最短~最长回复时间（分钟）随机 */
    const session = Store.data.sessions[sessionId];
    const st = (session && session.settings) ? session.settings : defaultSettings();
    let delayMs = 900 + Math.random() * 900;
    if (session && st.replyConfigured) {
      const min = Math.max(0, st.minReplyMin || 0), max = Math.max(min, st.maxReplyMin || 2);
      delayMs = Math.max(600, Math.round((min + Math.random() * (max - min)) * 60000));
    }
    setTimeout(() => {
      const session = Store.data.sessions[sessionId];
      const stillValid = session && session.messages.some(m => m.id === task.msgId);
      if (stillValid) {
        const role = getChar(task.from);
        const draw = task.replyContent ? { type: "text", content: task.replyContent } : Lib.draw(task.from);
        const msg = { id: uid(), from: task.from, type: draw.type, content: draw.content, ts: Date.now() };
        if (draw.type === "image") msg.image = draw.content;
        session.messages.push(msg);
        /* 定制回复（红包感谢等）同时把目标消息标记为已处理（如红包已领取 → content.opened） */
        if (task.replyContent) {
          const target = session.messages.find(m => m.id === task.msgId);
          if (target && target.type === "redpacket" && target.content) target.content.opened = true;
        }
        session.updatedAt = Date.now();
        if (window.__sgSid !== sessionId) session.unread = (session.unread || 0) + 1;
        Store.save();
      }
      ReplyQueue.typingSet.delete(sessionId);
      q.running = false;
      ReplyQueue.persist();
      window.dispatchEvent(new CustomEvent("sg:typing", { detail: { sessionId, typing: false } }));
      window.dispatchEvent(new CustomEvent("sg:reply", { detail: { sessionId } }));
      if (q.tasks.length) ReplyQueue.pump(sessionId);
    }, delayMs);
  },
  restore(){
    const pending = Store.data.pendingReplies || {};
    Store.data.pendingReplies = {};
    for (const sid in pending) {
      if (!pending[sid] || !pending[sid].length) continue;
      if (!ReplyQueue.queues[sid]) ReplyQueue.queues[sid] = { tasks: [], running: false };
      ReplyQueue.queues[sid].tasks.push(...pending[sid]);
    }
    Store.save();
    for (const sid in ReplyQueue.queues) {
      if (ReplyQueue.queues[sid].tasks.length) ReplyQueue.pump(sid);
    }
  },
  cancel(sessionId){
    const q = ReplyQueue.queues[sessionId];
    if (q) { q.tasks = []; q.running = false; }
    delete ReplyQueue.queues[sessionId];
    ReplyQueue.typingSet.delete(sessionId);
    ReplyQueue.persist();
    window.dispatchEvent(new CustomEvent("sg:typing", { detail: { sessionId, typing: false } }));
  }
};

/* ---------- 07.8 主动消息调度 ProactiveScheduler（角色按间隔主动发消息） ---------- */
const REDPACKET_THANKS = ["哇，谢谢！", "红包收到啦，爱你~", "哇塞，这么大方！", "谢谢老板！", "嘿嘿，收下啦！"];
const SURVEY_TEXT_ANSWERS = ["嗯，这个嘛……", "都可以呀", "我觉得都行，你定吧", "不太确定，再看看", "当然可以！", "这个真不错"];

const ProactiveScheduler = {
  timer: null,
  start(){
    if (ProactiveScheduler.timer) return;
    ProactiveScheduler.timer = setInterval(() => ProactiveScheduler.tick(), 15000);
  },
  tick(){
    if (!Store.data || !Store.data.sessions) return;
    const now = Date.now();
    Object.values(Store.data.sessions).forEach(s => {
      if (s.type !== "dm") return;
      const st = s.settings || defaultSettings();
      if (!st.proactive) return;
      const gap = Math.max(0.5, st.proactiveMin || 2) * 60000;
      const last = s.lastProactiveAt || 0;
      if (now - last < gap) return;
      /* 主动发一条（带 1.2s 输入动画） */
      s.lastProactiveAt = now;
      ReplyQueue.typingSet.add(s.id);
      window.dispatchEvent(new CustomEvent("sg:typing", { detail: { sessionId: s.id, typing: true } }));
      setTimeout(() => {
        const session = Store.data.sessions[s.id];
        if (!session) return;
        const draw = Lib.draw(s.peerId);
        const msg = { id: uid(), from: s.peerId, type: draw.type, content: draw.content, ts: Date.now() };
        if (draw.type === "image") msg.image = draw.content;
        session.messages.push(msg);
        session.updatedAt = Date.now();
        if (window.__sgSid !== s.id) session.unread = (session.unread || 0) + 1;
        Store.save();
        ReplyQueue.typingSet.delete(s.id);
        window.dispatchEvent(new CustomEvent("sg:typing", { detail: { sessionId: s.id, typing: false } }));
        window.dispatchEvent(new CustomEvent("sg:reply", { detail: { sessionId: s.id } }));
      }, 1200);
    });
  }
};

/* ---------- 07.7 辅助函数 ---------- */function getChar(id){ return Store.data.characters.find(c => c.id === id); }
function getGroup(id){ return Store.data.groups.find(g => g.id === id); }
function getSessionId(type, peerId){ return (type === "dm" ? "dm-" : "group-") + peerId; }
function ensureSession(type, peerId){
  const sid = getSessionId(type, peerId);
  if (!Store.data.sessions[sid]) {
    Store.data.sessions[sid] = { id: sid, type, peerId, messages: [], updatedAt: Date.now(), unread: 0, settings: defaultSettings(), lastProactiveAt: 0 };
    Store.save();
  }
  return sid;
}
/* 会话展示名：角色或群名（已删除时显示占位） */
function sessionDisplayName(session){
  if (session.type === "group") {
    const g = getGroup(session.peerId);
    return g ? g.name : "已删除群";
  }
  const c = getChar(session.peerId);
  return c ? c.name : "已删除角色";
}
function sessionDisplayAvatar(session){
  if (session.type === "group") {
    const g = getGroup(session.peerId);
    return g ? g.avatar : "";
  }
  const c = getChar(session.peerId);
  return c ? c.avatar : "";
}

/* ---------- 07.3 交互层 Actions ---------- */
const Actions = {
  deleteSession(sessionId){
    delete Store.data.sessions[sessionId];
    ReplyQueue.cancel(sessionId);
    Store.save();
    window.dispatchEvent(new Event("sg:data"));
    toast("会话已删除");
  },
  clearMessages(sessionId){
    const session = Store.data.sessions[sessionId];
    if (!session) return;
    session.messages = [];
    ReplyQueue.cancel(sessionId);
    Store.save();
    window.dispatchEvent(new Event("sg:data"));
    toast("聊天记录已清空");
  },
  sendMessage(sessionId, text){
    Actions.sendMessageEx(sessionId, { type: "text", content: text.trim() });
  },
  /* 通用发送：push 任意类型消息并触发角色回复（私聊固定角色 / 群聊轮流） */
  sendMessageEx(sessionId, msg){
    const session = Store.data.sessions[sessionId];
    if (!session) return;
    const full = Object.assign({ id: uid(), from: "me", ts: Date.now() }, msg);
    session.messages.push(full);
    session.updatedAt = Date.now();
    Store.save();
    let fromId = null;
    if (session.type === "dm") fromId = session.peerId;
    else fromId = ReplyQueue.pickSpeaker(session);
    if (fromId) ReplyQueue.schedule(sessionId, fromId, full.id);
    window.dispatchEvent(new Event("sg:data"));
  },
  /* 发送图片（相册/拍照）：压缩后作为表情包消息，同文字一样触发角色回复 */
  sendMedia(sessionId, dataURL){
    Actions.sendMessageEx(sessionId, { type: "image", content: dataURL, image: dataURL });
  },
  createCharacter(data){
    if (!data.name || !data.name.trim()) { toast("名字不能为空"); return null; }
    const ch = { id: uid(), name: data.name.trim(), avatar: data.avatar || "", bio: (data.bio || "").trim() };
    Store.data.characters.push(ch);
    Lib.perLib(ch.id);   /* 初始化专属词库 */
    Store.save();
    window.dispatchEvent(new Event("sg:data"));
    toast("角色创建成功");
    return ch;
  },
  updateCharacter(id, data){
    const ch = getChar(id);
    if (!ch) return;
    if (!data.name || !data.name.trim()) { toast("名字不能为空"); return; }
    ch.name = data.name.trim();
    ch.avatar = data.avatar || "";
    ch.bio = (data.bio || "").trim();
    Store.save();
    window.dispatchEvent(new Event("sg:data"));
    toast("角色已更新");
  },
  deleteCharacter(id){
    const sid = getSessionId("dm", id);
    delete Store.data.sessions[sid];
    ReplyQueue.cancel(sid);
    Store.data.groups.forEach(g => { g.memberIds = g.memberIds.filter(m => m !== id); });
    Store.data.characters = Store.data.characters.filter(c => c.id !== id);
    delete Store.data.library.per[id];
    Store.save();
    window.dispatchEvent(new Event("sg:data"));
    toast("角色已删除");
  },
  createGroup(data){
    if (!data.name || !data.name.trim()) { toast("群名不能为空"); return null; }
    if (!data.memberIds || !data.memberIds.length) { toast("请至少选择 1 位成员"); return null; }
    const g = { id: uid(), name: data.name.trim(), avatar: data.avatar || "", memberIds: data.memberIds };
    Store.data.groups.push(g);
    Store.save();
    window.dispatchEvent(new Event("sg:data"));
    toast("群聊创建成功");
    return g;
  },
  updateGroup(id, data){
    const g = getGroup(id);
    if (!g) return;
    if (!data.name || !data.name.trim()) { toast("群名不能为空"); return; }
    g.name = data.name.trim();
    g.avatar = data.avatar || "";
    g.memberIds = data.memberIds || [];
    Store.save();
    window.dispatchEvent(new Event("sg:data"));
    toast("群聊已更新");
  },
  deleteGroup(id){
    const sid = getSessionId("group", id);
    delete Store.data.sessions[sid];
    ReplyQueue.cancel(sid);
    Store.data.groups = Store.data.groups.filter(g => g.id !== id);
    Store.save();
    window.dispatchEvent(new Event("sg:data"));
    toast("群聊已删除");
  }
};

/* ---------- 07.6 弹窗系统 Modal ---------- */
const Modal = {
  open(html){
    const root = $("#modalRoot");
    root.innerHTML = `<div class="modal-mask"><div class="modal">${html}</div></div>`;
    const mask = root.querySelector(".modal-mask");
    mask.addEventListener("click", (e) => {
      if (e.target === mask || e.target.closest(".modal-close") || e.target.closest("[data-close]")) Modal.close();
    });
  },
  close(){
    $("#modalRoot").innerHTML = "";
  },
  confirm(title, text, onOk){
    Modal.open(`
      <div class="modal-head">${esc(title)}<button class="modal-close">×</button></div>
      <div class="modal-body" style="font-size:14px;line-height:1.7">${esc(text)}</div>
      <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-danger" id="cf-ok">确认</button></div>
    `);
    const ok = $("#cf-ok");
    if (ok) ok.addEventListener("click", () => { Modal.close(); if (onOk) onOk(); });
  }
};

/* ---------- 头像选择（底部菜单：拍照 / 本地图片 / 图片链接） ----------
   menuItems 可传子集：["camera","upload","url"]，默认全部 */
function bindAvatarPicker(prefix, avatarMax, menuItems){
  const avatarEl = $("#" + prefix + "-avatar");
  const urlVal = $("#" + prefix + "-urlval");
  const urlOk = $("#" + prefix + "-urlok");
  const nameInput = $("#" + prefix + "-name");
  const maxSize = avatarMax || 256;
  const items = menuItems || ["camera", "upload", "url"];
  let _avatar = "";
  const refresh = () => {
    const name = nameInput ? (nameInput.value.trim() || "新角色") : "新角色";
    const c = avatarColor(name);
    avatarEl.style.background = c;
    avatarEl.innerHTML = esc(name.slice(0, 1)) + (_avatar ? `<img src="${esc(_avatar)}" alt="" onerror="this.remove()">` : "");
  };
  const pickFile = (capture) => {
    fileInput("image/*", async (input) => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        _avatar = await readImageFile(file, maxSize);
        refresh();
        toast("头像已设置");
      } catch (e) { toast("图片读取失败：" + e.message); }
    }, capture);
  };
  const pickUrl = () => {
    const url = urlVal.value.trim();
    if (!url) { toast("请粘贴图片链接"); return; }
    checkImageUrl(url).then(ok => {
      if (!ok) { toast("链接失效或不是图片，未更新头像"); return; }
      _avatar = url;
      refresh();
      toast("头像已更新");
    });
  };
  /* 点击头像框 → 底部菜单 */
  if (avatarEl) {
    avatarEl.addEventListener("click", () => {
      const rows = [
        items.includes("camera") ? `<div class="sheet-item" data-sheet="camera">拍照</div>` : "",
        items.includes("upload") ? `<div class="sheet-item" data-sheet="upload">本地图片上传</div>` : "",
        items.includes("url") ? `<div class="sheet-item" data-sheet="url">图片链接</div>` : ""
      ].join("");
      Modal.open(`
        <div class="sheet">
          ${rows}
          <div class="sheet-item cancel" data-close>取消</div>
        </div>
      `);
      const sheet = $("#modalRoot");
      sheet.querySelector(".sheet").addEventListener("click", (e) => {
        const item = e.target.closest(".sheet-item[data-sheet]");
        if (!item) return;
        Modal.close();
        if (item.dataset.sheet === "camera") pickFile(true);
        else if (item.dataset.sheet === "upload") pickFile(false);
        else if (item.dataset.sheet === "url") {
          Modal.open(`
            <div class="modal-head">使用图片链接<button class="modal-close">×</button></div>
            <div class="modal-body">
              <input type="text" id="${prefix}-urlval" placeholder="粘贴图片链接（https://…）" style="width:100%;border:1px solid #dcdcdc;border-radius:6px;padding:9px 12px;font-size:14px;outline:none">
            </div>
            <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="${prefix}-urlok">使用</button></div>
          `);
          const val = $("#" + prefix + "-urlval");
          val.focus();
          $("#" + prefix + "-urlok").addEventListener("click", () => {
            const url = val.value.trim();
            if (!url) { toast("请粘贴图片链接"); return; }
            checkImageUrl(url).then(ok => {
              if (!ok) { toast("链接失效或不是图片，未更新头像"); return; }
              _avatar = url;
              refresh();
              Modal.close();
              toast("头像已更新");
            });
          });
        }
      });
    });
  }
  return {
    getAvatar: () => _avatar,
    setAvatar: (v) => { _avatar = v || ""; }
  };
}

/* ---------- 弹窗：编辑角色（名字 + 头像 + 简介；词库去「词库管理」） ---------- */
function openCardModal(charId){
  const ch = charId ? getChar(charId) : null;
  const prefix = "cf";
  Modal.open(`
    <div class="modal-head">${ch ? "编辑角色" : "新建角色"}<button class="modal-close">×</button></div>
    <div class="modal-body">
      <div class="field"><label>名字 <span class="required">*</span></label>
        <input type="text" id="cf-name" maxlength="12" placeholder="给角色起个名字" value="${ch ? esc(ch.name) : ""}"></div>
      <div class="field"><label>头像（点击头像选择：拍照 / 上传 / 链接）</label>
        <div class="avatar-pick">
          <div class="avatar" id="cf-avatar"></div>
        </div>
        <div class="url-input" id="cf-urlrow">
          <input type="text" id="cf-urlval" placeholder="粘贴图片链接（https://…）">
          <button class="btn" id="cf-urlok">使用</button>
        </div>
      </div>
      <div class="field"><label>简介（可选）</label>
        <textarea id="cf-bio" maxlength="60" placeholder="这个角色是什么？一句话介绍">${ch ? esc(ch.bio) : ""}</textarea></div>
      <div class="field hint" style="font-size:12px;color:#b0b0b0">角色说的话来自「词库」：可在底部导航「词库」页配置它的专属台词、Emoji 和表情包。</div>
    </div>
    <div class="modal-foot">
      ${ch ? '<button class="btn btn-danger" id="cf-delete">删除角色</button><div style="flex:1"></div>' : ""}
      <button class="btn" data-close>取消</button><button class="btn btn-primary" id="cf-save">保存</button>
    </div>
  `);
  const picker = bindAvatarPicker("cf");
  if (ch) picker.setAvatar(ch.avatar);
  const nameInput = $("#cf-name");
  const refresh = () => {
    const c = avatarColor(nameInput.value.trim() || "新角色");
    const el = $("#cf-avatar");
    el.style.background = c;
    el.innerHTML = esc((nameInput.value.trim() || "新角色").slice(0, 1)) + (picker.getAvatar() ? `<img src="${esc(picker.getAvatar())}" alt="" onerror="this.remove()">` : "");
  };
  nameInput.addEventListener("input", refresh);
  refresh();
  if (ch) {
    const delBtn = $("#cf-delete");
    if (delBtn) delBtn.addEventListener("click", () => {
      Modal.confirm("删除角色", "将删除该角色、相关聊天记录，并从所有群聊中移除。此操作无法恢复。", () => {
        Actions.deleteCharacter(ch.id);
        Modal.close();
      });
    });
  }
  $("#cf-save").addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) { toast("请填写名字"); nameInput.focus(); return; }
    const data = { name, avatar: picker.getAvatar(), bio: $("#cf-bio").value.trim() };
    if (ch) Actions.updateCharacter(ch.id, data);
    else Actions.createCharacter(data);
    Modal.close();
  });
}

/* ---------- 弹窗：编辑群（名字 + 头像 + 成员） ---------- */
function openGroupModal(groupId){
  const g = groupId ? getGroup(groupId) : null;
  const prefix = "gf";
  const selected = new Set(g ? g.memberIds : []);
  const chars = Store.data.characters;
  Modal.open(`
    <div class="modal-head">${g ? "编辑群聊" : "新建群聊"}<button class="modal-close">×</button></div>
    <div class="modal-body">
      <div class="field"><label>群名 <span class="required">*</span></label>
        <input type="text" id="gf-name" maxlength="12" placeholder="给群起个名字" value="${g ? esc(g.name) : ""}"></div>
      <div class="field"><label>头像（点击头像选择）</label>
        <div class="avatar-pick">
          <div class="avatar" id="gf-avatar"></div>
        </div>
      </div>
      <div class="field"><label>选择成员 <span class="required">*</span></label>
        <div class="member-pick" id="gf-members">
          ${chars.length ? chars.map(c => `
            <div class="member-opt${selected.has(c.id) ? " on" : ""}" data-cid="${c.id}">
              ${avatarHTML(c.avatar, c.name, true)}
              <div class="mname">${esc(c.name)}</div>
              <div class="member-check"><span class="checkmark">✓</span></div>
            </div>`).join("") : `<div class="empty" style="padding:16px">还没有角色，请先新建角色</div>`}
        </div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn" data-close>取消</button><button class="btn btn-primary" id="gf-save">保存</button></div>
  `);
  const picker = bindAvatarPicker("gf");
  if (g) picker.setAvatar(g.avatar);
  const refresh = () => {
    const c = avatarColor($("#gf-name").value.trim() || "新群");
    const el = $("#gf-avatar");
    el.style.background = c;
    el.innerHTML = esc(($("#gf-name").value.trim() || "新群").slice(0, 1)) + (picker.getAvatar() ? `<img src="${esc(picker.getAvatar())}" alt="" onerror="this.remove()">` : "");
  };
  $("#gf-name").addEventListener("input", refresh);
  refresh();
  $("#gf-members").addEventListener("click", (e) => {
    const opt = e.target.closest(".member-opt");
    if (opt) opt.classList.toggle("on");
  });
  $("#gf-save").addEventListener("click", () => {
    const name = $("#gf-name").value.trim();
    if (!name) { toast("请填写群名"); $("#gf-name").focus(); return; }
    const memberIds = Array.from($$("#gf-members .member-opt.on")).map(el => el.dataset.cid);
    if (!memberIds.length) { toast("请至少选择 1 位成员"); return; }
    const data = { name, avatar: picker.getAvatar(), memberIds };
    if (g) Actions.updateGroup(g.id, data);
    else Actions.createGroup(data);
    Modal.close();
  });
}

/* ---------- 07.8.1 全站自动启动主动消息调度（任意页面生效） ---------- */
ProactiveScheduler.start();
