# -*- coding: utf-8 -*-
"""拾光项目结构检查脚本 —— TESTING.md 的 AUTO-02 / AUTO-03（多页面 v3）
检查项：
  AUTO-02a HTML 标签配对（每个 HTML/*.html 页面都检查，未闭合/多余闭合）
  AUTO-02b 关键 id 存在且唯一；引用的 css/js 文件存在
  AUTO-03   双向命名对照：① NAMING.md 登记的 id/class 在代码中能找到；
                           ② 代码中出现的 id 都能在 NAMING.md 中找到登记
用法：python check_structure.py
"""
import re, sys, os
from html.parser import HTMLParser

BASE = os.path.dirname(os.path.abspath(__file__))
HTML_DIR = os.path.join(BASE, "HTML")
CSS_DIR = os.path.join(BASE, "css")
JS_DIR = os.path.join(BASE, "js")
NAMING = os.path.join(BASE, "NAMING.md")

failures = []

# ---------- AUTO-02a: HTML 标签配对（遍历所有页面） ----------
class PairChecker(HTMLParser):
    VOID = {"meta", "link", "br", "img", "input", "hr"}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []
    def handle_starttag(self, tag, attrs):
        if tag not in self.VOID:
            self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in self.VOID:
            return
        if not self.stack:
            self.errors.append("多余的闭合标签 </%s>" % tag)
        elif self.stack[-1] == tag:
            self.stack.pop()
        elif tag in self.stack:
            while self.stack and self.stack[-1] != tag:
                self.errors.append("未闭合: <%s>" % self.stack.pop())
            self.stack.pop()
        else:
            self.errors.append("无法匹配闭合标签 </%s>" % tag)

html_files = sorted(os.listdir(HTML_DIR))
for hf in html_files:
    if not hf.endswith(".html"):
        continue
    html_text = open(os.path.join(HTML_DIR, hf), encoding="utf-8").read()
    p = PairChecker()
    p.feed(html_text)
    for err in p.errors:
        failures.append("%s 配对: %s" % (hf, err))
    if p.stack:
        failures.append("%s 配对: 未闭合标签 %s" % (hf, ",".join(p.stack)))
print("AUTO-02a HTML标签配对(共%d个页面):" % len([f for f in html_files if f.endswith(".html")]),
      "通过" if not failures else "失败")

# ---------- AUTO-02b: 关键 id 存在且唯一 + 引用文件存在 ----------
all_html = {f: open(os.path.join(HTML_DIR, f), encoding="utf-8").read()
            for f in html_files if f.endswith(".html")}
# 所有页面共有的 id
all_common_ids = ["modalRoot", "toast"]
# 带底部导航的页面
nav_pages = {"index.html", "library.html", "settings.html"}
# 各页面专属 id（每个页面静态写死的 id）
page_ids = {
    "index.html": ["addBtn", "sessionList", "navChatBadge"],
    "library.html": ["mainTabs", "perPick", "perSelect", "subTabs", "libBody", "navChatBadge"],
    "settings.html": ["exportBtn", "importBtn", "resetBtn", "importFile", "navChatBadge"],
    "new.html": ["newCharBtn", "newGroupBtn"],
    "new-char.html": ["nc-close", "nc-name", "nc-avatar", "nc-url", "nc-save"],
    "new-group.html": ["ng-name", "ng-avatar", "ng-count", "ng-total", "ng-members", "ng-save"],
    "conversation.html": ["chatAvatar", "chatName", "chatSub", "moreBtn", "moreMenu",
                          "chatBody", "chatFoot", "msgInput", "sendBtn", "extBtn",
                          "vcall", "vcallPeer", "vcallState", "vcallTime", "vcallHangup"],
    "chat-info.html": ["ci-avatar", "ci-name", "ci-bio", "ci-pin", "ci-bgval"],
    "chat-settings.html": ["cs-min", "cs-max", "cs-min-val", "cs-max-val",
                           "cs-proactive", "cs-proactive-row", "cs-proactive-min",
                           "cs-bubble", "cs-save"],
}
for hf, text in all_html.items():
    html_ids = re.findall(r'id="([^"]+)"', text)
    need = all_common_ids + page_ids.get(hf, [])
    for kid in need:
        cnt = html_ids.count(kid)
        if cnt != 1:
            failures.append("%s id %s 出现次数=%d（应为1）" % (hf, kid, cnt))
    for d in set(html_ids):
        if html_ids.count(d) > 1:
            failures.append("%s 重复id: %s" % (hf, d))
# 引用的 css/js 文件存在
css_files = set(f for f in os.listdir(CSS_DIR) if f.endswith(".css"))
js_files = set(f for f in os.listdir(JS_DIR) if f.endswith(".js"))
for hf, text in all_html.items():
    for ref in re.findall(r'(?:href|src)="\.\./(css|js)/([^"]+)"', text):
        folder, name = ref
        target = css_files if folder == "css" else js_files
        if name not in target:
            failures.append("%s 引用了不存在的文件: %s/%s" % (hf, folder, name))

# ---------- AUTO-03: 双向命名对照 ----------
naming = open(NAMING, encoding="utf-8").read()
registered_ids = set(re.findall(r'`#([a-zA-Z][a-zA-Z0-9-]+)`', naming)) - {"xxx"}
registered_classes = set(re.findall(r'`\.([a-zA-Z][a-zA-Z0-9-]+)`', naming)) - {"xxx"}

all_code = ""
for f in os.listdir(HTML_DIR):
    if f.endswith(".html"):
        all_code += open(os.path.join(HTML_DIR, f), encoding="utf-8").read()
for f in os.listdir(CSS_DIR):
    if f.endswith(".css"):
        all_code += open(os.path.join(CSS_DIR, f), encoding="utf-8").read()
for f in os.listdir(JS_DIR):
    if f.endswith(".js"):
        all_code += open(os.path.join(JS_DIR, f), encoding="utf-8").read()

# 方向①：清单已登记 → 代码中能找到
missing = [x for x in sorted(registered_ids) if x not in all_code]
if missing:
    failures.append("清单已登记但代码中缺失的id: " + ",".join(missing))
missing_c = [x for x in sorted(registered_classes) if x not in all_code]
if missing_c:
    failures.append("清单已登记但代码中缺失的class: " + ",".join(missing_c))

# 方向②：代码中出现的 id → 清单已登记（新增检查，保证命名不漏登记）
code_ids = set()
for f in os.listdir(HTML_DIR):
    if f.endswith(".html"):
        code_ids |= set(re.findall(r'id="([a-zA-Z][a-zA-Z0-9-]*)"',
                        open(os.path.join(HTML_DIR, f), encoding="utf-8").read()))
for f in os.listdir(JS_DIR):
    if f.endswith(".js"):
        js = open(os.path.join(JS_DIR, f), encoding="utf-8").read()
        code_ids |= set(re.findall(r'\$\$?\(\s*"#([a-zA-Z][a-zA-Z0-9-]*)"', js))
        code_ids |= set(re.findall(r'\$\$?\(\s*`#([a-zA-Z][a-zA-Z0-9-]*)', js))
# 排除动态前缀 id（如 ${prefix}-xxx 模板）与合法例外
DYNAMIC_PREFIX = {"cf", "gf", "nc", "ng", "dup", "imgUrl", "newEntry", "editEntry",
                  "groupName", "groupRename", "batch", "checkAll", "selCount",
                  "delSel", "batchAdd", "import", "export", "add", "navChatBadge"}
unregistered = []
for cid in sorted(code_ids):
    if cid in registered_ids:
        continue
    if any(cid.startswith(p + "-") for p in DYNAMIC_PREFIX):
        continue
    unregistered.append(cid)
if unregistered:
    failures.append("代码中出现但清单未登记的id: " + ",".join(unregistered))

print("AUTO-02/03 检查失败项:", len(failures))
for f in failures:
    print(" -", f)
sys.exit(1 if failures else 0)
