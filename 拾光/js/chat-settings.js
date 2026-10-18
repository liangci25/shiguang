"use strict";
/* 聊天设置页 js/chat-settings.js v4 —— 回复频率滑块 / 主动发消息 / 气泡 CSS 实时预览 */

const SID = new URLSearchParams(location.search).get("sid") || "";
let bubbleTimer = null;

function init(){
  Store.load();
  const session = Store.data.sessions[SID];
  if (!session) {
    toast("会话不存在");
    setTimeout(() => location.href = "index.html", 800);
    return;
  }
  const st = session.settings || defaultSettings();
  const minInput = $("#cs-min"), maxInput = $("#cs-max");
  const minVal = $("#cs-min-val"), maxVal = $("#cs-max-val");
  const proactiveSwitch = $("#cs-proactive");
  const proactiveRow = $("#cs-proactive-row");
  const proactiveMin = $("#cs-proactive-min");
  const bubbleInput = $("#cs-bubble");

  minInput.value = st.minReplyMin || 0;
  maxInput.value = st.maxReplyMin || 2;
  const fmtMin = v => v % 1 === 0 ? v + " 分钟" : v.toFixed(1) + " 分钟";
  minVal.textContent = fmtMin(Number(minInput.value));
  maxVal.textContent = fmtMin(Number(maxInput.value));
  /* 最短与最长联动：最短调大时最长自动跟随；最长不能小于最短 */
  minInput.addEventListener("input", () => {
    minVal.textContent = fmtMin(Number(minInput.value));
    if (Number(minInput.value) > Number(maxInput.value)) {
      maxInput.value = minInput.value;
      maxVal.textContent = fmtMin(Number(maxInput.value));
    }
  });
  maxInput.addEventListener("input", () => {
    maxVal.textContent = fmtMin(Number(maxInput.value));
    if (Number(maxInput.value) < Number(minInput.value)) {
      minInput.value = maxInput.value;
      minVal.textContent = fmtMin(Number(minInput.value));
    }
  });

  proactiveSwitch.classList.toggle("on", !!st.proactive);
  proactiveSwitch.textContent = st.proactive ? "已开启" : "已关闭";
  proactiveRow.style.opacity = st.proactive ? 1 : 0.4;
  proactiveMin.value = st.proactiveMin || 2;
  proactiveSwitch.addEventListener("click", () => {
    st.proactive = !st.proactive;
    proactiveSwitch.classList.toggle("on", st.proactive);
    proactiveSwitch.textContent = st.proactive ? "已开启" : "已关闭";
    proactiveRow.style.opacity = st.proactive ? 1 : 0.4;
  });

  bubbleInput.value = st.bubbleCss || "";
  /* 气泡 CSS 实时预览：动态注入 <link> 到预览容器 */
  const applyBubbleCss = (url) => {
    const old = document.querySelector("#bubbleCssPreview");
    if (old) old.remove();
    if (!url) return;
    const link = document.createElement("link");
    link.id = "bubbleCssPreview";
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  };
  bubbleInput.addEventListener("input", () => {
    clearTimeout(bubbleTimer);
    const url = bubbleInput.value.trim();
    bubbleTimer = setTimeout(() => applyBubbleCss(url), 500);
  });
  applyBubbleCss(st.bubbleCss);

  $("#cs-save").addEventListener("click", () => {
    const min = Math.max(0, Math.min(2, Number(minInput.value) || 0));
    const max = Math.max(min, Math.min(20, Number(maxInput.value) || 2));
    st.minReplyMin = min;
    st.maxReplyMin = max;
    st.replyConfigured = true;   /* 配置过 → 回复延迟按滑块区间 */
    st.proactive = !!proactiveSwitch.classList.contains("on");
    st.proactiveMin = Math.max(1, Math.min(120, Math.round(Number(proactiveMin.value) || 2)));
    st.bubbleCss = bubbleInput.value.trim();
    /* 开启主动消息时记录开始时间，之后按间隔主动发 */
    if (st.proactive && !session.lastProactiveAt) session.lastProactiveAt = Date.now();
    Store.save();
    toast("聊天设置已保存");
  });
}
init();
