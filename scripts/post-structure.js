/**
 * 目录结构约束：source/_posts/<分类>/<年>/<月>/<日>/<文章名>.md
 *
 * - 分类固定为「开发 / 运维 / AI / 软件」四大类，文章分类由所在目录自动写入
 *   （URL 中的英文段由 _config.yml 的 category_map 映射）
 * - 文件名不带日期（如 ssh-trust.md），日期只体现在目录层级
 * - 修正 Hexo 默认把整段子目录拼进 slug 的行为，保证地址为
 *   posts/<dev|ops|ai|soft>/<年-月-日>-<文章名>/
 */

const TYPES = ['开发', '运维', 'AI', '软件'];
const LAYOUT = /^_posts\/([^/]+)\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\.[^/.]+$/;
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;

hexo.extend.filter.register('before_generate', async function () {
  const posts = this.model('Post').find({}).toArray();

  for (const post of posts) {
    // 草稿（render_drafts: false）不参与，发布时再校验
    if (post.published === false) continue;

    const matched = LAYOUT.exec(post.source);
    if (!matched) {
      this.log.warn(
        `文章 ${post.source} 不在规定目录中，请移动到 source/_posts/<分类>/<年>/<月>/<日>/<文章名>.md`
      );
      continue;
    }

    const [, type, year, month, day, filename] = matched;

    if (!TYPES.includes(type)) {
      // 只告警不中断：仍按目录归类，避免生成错乱的地址
      this.log.warn(
        `文章 ${post.source} 所在目录「${type}」不是固定分类，可选：${TYPES.join(' / ')}`
      );
    }

    if (DATE_PREFIX.test(filename)) {
      this.log.warn(`文章 ${post.source} 的文件名带了日期，日期已由目录表示，文件名只写文章名即可`);
    }

    // slug 只取文件名，纠正 Hexo 把子目录拼进 slug 导致的地址错乱
    // 注意：查询返回的是文档副本，修改后必须 save() 才会写回模型
    const slug = filename.replace(DATE_PREFIX, '');
    if (post.slug !== slug) {
      post.slug = slug;
      await post.save();
    }

    // URL 中的日期取自 front-matter 的 date，必须与目录层级一致
    const date = post.date.format('YYYY-MM-DD');
    const folderDate = `${year}-${month}-${day}`;
    if (date !== folderDate) {
      this.log.warn(
        `文章 ${post.source} 目录日期 ${folderDate} 与 front-matter 的 date ${date} 不一致`
      );
    }

    // 分类由目录决定，front-matter 不必再写 categories
    const categories = post.categories.map(cat => cat.name);
    if (categories.length !== 1 || categories[0] !== type) {
      if (categories.length) {
        this.log.warn(
          `文章 ${post.source} 的 categories（${categories.join('/')}）与目录分类「${type}」不一致，按目录归类`
        );
      }
      await post.setCategories([type]);
    }
  }
});
