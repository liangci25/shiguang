"use strict";
/* 新建群聊页 js/new-group.js v3 —— 群名 + 群头像 + 勾选成员 */
function init(){
  Store.load();
  const picker = bindAvatarPicker("ng");
  const nameInput = $("#ng-name");
  const refresh = () => {
    const name = nameInput.value.trim() || "新群";
    const c = avatarColor(name);
    const el = $("#ng-avatar");
    el.style.background = c;
    el.innerHTML = esc(name.slice(0, 1)) + (picker.getAvatar() ? `<img src="${esc(picker.getAvatar())}" alt="" onerror="this.remove()">` : "");
  };
  nameInput.addEventListener("input", refresh);
  refresh();
  /* 成员列表 */
  const membersEl = $("#ng-members");
  const chars = Store.data.characters;
  if (!chars.length) {
    membersEl.innerHTML = `<div class="empty">还没有角色<br>请先返回新建一个角色，再来建群</div>`;
  } else {
    membersEl.innerHTML = chars.map(c => `
      <div class="member-opt" data-cid="${c.id}">
        ${avatarHTML(c.avatar, c.name, true)}
        <div class="mname">${esc(c.name)}</div>
        <div class="member-check"><span class="checkmark">✓</span></div>
      </div>`).join("");
  }
  const updateCount = () => {
    const n = membersEl.querySelectorAll(".member-opt.on").length;
    $("#ng-count").textContent = n;
    $("#ng-total").textContent = n + 1;   /* 群内总人数包含用户本人 */
  };
  membersEl.addEventListener("click", (e) => {
    const opt = e.target.closest(".member-opt");
    if (opt) { opt.classList.toggle("on"); updateCount(); }
  });
  $("#ng-save").addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) { toast("请填写群名"); nameInput.focus(); return; }
    const memberIds = Array.from(membersEl.querySelectorAll(".member-opt.on")).map(el => el.dataset.cid);
    if (!memberIds.length) { toast("请至少选择 1 位成员"); return; }
    const g = Actions.createGroup({ name, avatar: picker.getAvatar(), memberIds });
    if (g) {
      const sid = ensureSession("group", g.id);
      location.href = "conversation.html?sid=" + sid;
    }
  });
}
init();
