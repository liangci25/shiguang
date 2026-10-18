"use strict";
/* 加好友页（角色资料填写页）js/new-char.js v3.1
   —— 右上角红叉关闭；左侧圆形头像（拍照/上传）；右侧昵称必填 + URL 实时预览 */

const URL_DEBOUNCE = 400;  /* URL 输入防抖毫秒 */
let urlTimer = null;

function init(){
  Store.load();
  /* 头像选择：菜单只保留【拍照】【本地图片上传】（URL 走右侧输入框） */
  const picker = bindAvatarPicker("nc", 256, ["camera", "upload"]);
  const nameInput = $("#nc-name");
  const urlInput = $("#nc-url");
  const refresh = () => {
    const name = nameInput.value.trim() || "新角色";
    const c = avatarColor(name);
    const el = $("#nc-avatar");
    el.style.background = c;
    el.innerHTML = esc(name.slice(0, 1)) + (picker.getAvatar() ? `<img src="${esc(picker.getAvatar())}" alt="" onerror="this.remove()">` : "");
  };
  nameInput.addEventListener("input", refresh);
  refresh();
  /* 右上角红色叉号：关闭页面回首页 */
  $("#nc-close").addEventListener("click", () => location.href = "index.html");
  /* URL 输入框：防抖实时解析，有效更新预览；无效弹错误不更新 */
  urlInput.addEventListener("input", () => {
    clearTimeout(urlTimer);
    const url = urlInput.value.trim();
    if (!url) { refresh(); return; }
    urlTimer = setTimeout(() => {
      checkImageUrl(url).then(ok => {
        if (!ok) {
          toast("链接失效或不是图片，头像未更新");
          return;
        }
        picker.setAvatar(url);
        refresh();
        toast("头像已更新");
      });
    }, URL_DEBOUNCE);
  });
  /* 底部「添加梦角」 */
  $("#nc-save").addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) { toast("请填写昵称"); nameInput.focus(); return; }
    const ch = Actions.createCharacter({ name, avatar: picker.getAvatar(), bio: "" });
    if (ch) {
      const sid = ensureSession("dm", ch.id);
      location.href = "conversation.html?sid=" + sid;
    }
  });
}
init();
