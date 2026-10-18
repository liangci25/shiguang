"use strict";
/* 新建选择页 js/new.js */
function init(){
  Store.load();
  $("#newCharBtn").addEventListener("click", () => location.href = "new-char.html");
  $("#newGroupBtn").addEventListener("click", () => location.href = "new-group.html");
}
init();
