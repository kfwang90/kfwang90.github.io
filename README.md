# 零度の栈 · IT 博客

纯静态站点（HTML + CSS + JS），通过 GitHub Pages 发布。**首页只做目录索引**，每篇文章的正文放在独立目录中，由首页卡片跳转进入。

## 目录结构

```
.
├── index.html                          # 首页：文章目录 / 标签 / 关于，不放正文
├── assets/                             # 全站公共资源（首页与所有文章页共用）
│   ├── css/site.css                    # 主题变量、导航、卡片、页脚、响应式
│   └── js/site.js                      # 移动端导航展开 / 收起
├── posts/                              # 所有文章：分类 / 日期 / 文章
│   └── ansible/
│       └── 2026-09-29-ssh-trust/       # 日期 + 英文短标题
│           ├── index.html              # 文章正文页
│           ├── css/style.css           # 该文章专用样式（排版、代码块、复制按钮）
│           └── js/main.js              # 该文章专用交互（代码复制、返回顶部）
└── .github/workflows/static.yml        # Pages 自动部署（整仓库发布）
```

## 命名约定

| 层级 | 规则 | 示例 |
| --- | --- | --- |
| 分类目录 | 小写英文，与首页卡片上的「分类」一致 | `ansible` / `linux` / `k8s` |
| 文章目录 | `YYYY-MM-DD-英文短标题` | `2026-09-29-ssh-trust` |
| 入口文件 | 固定用 `index.html`，站内链接写成**显式的 `index.html`** | `posts/ansible/2026-09-29-ssh-trust/index.html` |
| 文章内资源 | `css/style.css`、`js/main.js`，图片放 `images/`（可选） | — |

共用资源放 `assets/`，只有该文章才用的样式和脚本放各自目录里，避免首页与文章页互相污染。

站内链接不要写成 `目录/` 形式（如 `posts/ansible/2026-09-29-ssh-trust/`）：GitHub Pages 会自动加载该目录下的 `index.html`，但本地直接双击打开时浏览器只会显示目录列表，必须写成 `…/index.html` 才能两种场景一致。

## 新增一篇文章

1. 在 `posts/<分类>/` 下新建目录 `YYYY-MM-DD-<slug>/`
2. 把现有文章目录（如 `posts/ansible/2026-09-29-ssh-trust/`）整个复制过来当模板，替换标题与正文
3. 文章页 `<head>` / 页尾按需引用（相对路径按目录层级调整）：

   ```html
   <link rel="stylesheet" href="../../../assets/css/site.css">
   <link rel="stylesheet" href="css/style.css">

   <script src="../../../assets/js/site.js" defer></script>
   <script src="js/main.js" defer></script>
   ```

4. 在首页 `index.html` 的 `#posts` 区域加一张卡片，`href` 指向新目录下的 `index.html`
5. 同步更新首页 `sec-head` 里的「共 N 篇 · 已迁移 M 篇」
6. 新文章的分类建议同时补进首页标签云 `#tags`

## 本地预览

直接双击打开 `index.html` 即可（站内链接都用显式 `index.html`，双击预览与线上表现一致）；也可以在项目根目录起一个静态服务：

```bash
python -m http.server 8000
```

## 待办

首页中标记「待迁移」的 6 篇文章目前仍是占位卡片（标题不可点击），后续按同一结构逐篇拆分为独立页面。
