"use strict";
/* 设置页 js/settings.js v3 —— 导出 / 导入 / 清空 */
const Render = {
  render(){
    renderNavBadge();
  }
};
function init(){
  Store.load();
  ReplyQueue.restore();
  Render.render();
  const onExport = () => Store.exportJson();
  const onImport = () => $("#importFile").click();
  const onReset = () => Modal.confirm("清空全部数据",
    "将删除所有角色、群聊、会话、聊天记录和词库，回到首次状态。此操作无法恢复！",
    () => { Store.reset(); toast("已清空，即将返回首页"); setTimeout(() => location.href = "index.html", 600); });
  $("#exportBtn").addEventListener("click", onExport);
  $("#importBtn").addEventListener("click", onImport);
  $("#resetBtn").addEventListener("click", onReset);
  $("#importFile").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    Store.importJson(file, () => location.href = "index.html");
    e.target.value = "";
  });
  window.addEventListener("sg:data", () => Render.render());
}
init();
