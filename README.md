# 零度の栈 · IT 博客

基于 [Hexo](https://hexo.io/) 8 的静态博客：文章用 Markdown 维护，`hexo generate` 产出纯静态 HTML，由 GitHub Actions 构建并发布到 GitHub Pages。

首页仍然**只做目录索引**（文章目录 / 标签 / 关于），每篇文章的正文由 `source/_posts/` 下的 Markdown 生成。

## 目录结构

```
.
├── _config.yml                     # 站点配置：url、permalink、分页、主题、RSS
├── package.json                    # 依赖与 npm 脚本（hexo 及官方插件）
├── source/
│   └── _posts/                     # 文章源文件：YYYY-MM-DD-slug.md + front-matter
├── themes/zero/                    # 自制主题（原纯静态站的 HTML/CSS/JS 迁移而来）
│   ├── _config.yml                 # 主题配置：导航、Hero、关于、统计、页脚
│   ├── layout/
│   │   ├── layout.njk              # 公共骨架：<head> / 导航 / 页脚 / 返回顶部
│   │   ├── index.njk               # 首页：Hero + 文章目录 + 标签云 + 关于
│   │   ├── post.njk                # 文章页：面包屑 + 正文 + 标签 + 返回目录
│   │   ├── archive.njk             # 标签页 / 分类页 / 归档页（Hexo 自动回落）
│   │   └── _partial/               # 片段：post-card.njk、paginator.njk
│   └── source/
│       ├── css/site.css            # 主题变量、导航、卡片、标签、关于、页脚、响应式
│       ├── css/article.css         # 正文排版、代码块与复制按钮、面包屑、返回顶部
│       ├── js/site.js              # 移动端导航展开 / 收起
│       └── js/article.js           # 代码块一键复制、返回顶部
├── scaffolds/post.md               # `hexo new post` 使用的新文章模板
├── scripts/helpers.js              # 自定义 helper：tag_cloud()、migrated_count()
└── .github/workflows/static.yml    # CI：npm ci → hexo generate → 部署到 Pages
```

## 常用命令

```bash
npm install          # 安装依赖（首次 / 更新依赖后）
npm run server       # 本地预览 http://localhost:4000
npm run build        # 生成静态文件到 public/
npm run clean        # 清除缓存与 public/
npm run new post "文章标题"   # 新建一篇文章
```

## 新增一篇文章

1. `npm run new post "文章标题"`，得到 `source/_posts/YYYY-MM-DD-<slug>.md`
2. 填写 front-matter：

   ```yaml
   ---
   title: 文章标题
   date: 2026-09-29 09:30:00
   categories:
     - Ansible            # 分类，决定 URL 中的目录段
   tags:
     - Ansible
     - Linux
   description: 列表页与 meta description 中显示的摘要
   minutes: 8             # 阅读时长，显示在卡片与文章头部
   ---
   ```

3. 正文用标准 Markdown（围栏代码块、引用块 `>`、二级标题 `##`）
4. 文章写完后**删除 `stub: true`**（占位文章才有该字段），首页「已迁移 N 篇」会自动统计

> 主题模板由 Nunjucks 渲染，`{{ }}` 默认做 HTML 转义：只有输出 HTML 片段时才需要
> 写 `| safe`（如 `{{ body | safe }}`、`{{ page.content | safe }}`、`{{ partial(...) | safe }}`），
> 普通文本不要加，避免注入问题。

## URL 约定

`_config.yml`：

```yaml
permalink: posts/:category/:year-:month-:day-:title/   # 文章地址
filename_case: 1                                       # 分类 / 标签 slug 统一小写
```

因此文章地址为 `posts/<分类>/<日期>-<slug>/`，与旧静态站保持一致，
旧链接 `posts/ansible/2026-09-29-ssh-trust/index.html` 也依然可以访问。
标签页为 `tags/<标签>/`，分类页为 `categories/<分类>/`，归档页为 `archives/`，RSS 为 `/atom.xml`。

站内链接一律写成根路径（`/xxx/`），模板中用 `url_for()` 输出，不要写成 `xxx/index.html`。

## 待迁移

首页标记「待迁移」的 6 篇仍是占位文章（`source/_posts/` 中 `stub: true`，标题不可点击）。
按上文流程补全正文、去掉 `stub: true` 即可上线；新文章的分类 / 标签会自动进入标签云。

## 本地预览

```bash
npm run server
```

## 部署

推送到 `main` 分支后，GitHub Actions 执行 `npm ci && hexo generate`，把 `public/` 发布到 GitHub Pages；
也可以在 Actions 页手动触发 `Deploy Hexo to Pages`。
