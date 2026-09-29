/**
 * 自定义 helper：供主题模板调用（Hexo 启动时自动执行 scripts/ 下的文件）
 */

// 已经拆出正文的文章数（排除 still 待迁移的占位文章）
hexo.extend.helper.register('migrated_count', function migratedCount() {
  return this.site.posts.toArray().filter(post => !post.stub).length;
});

// 标签云数据：按文章数从多到少排序
hexo.extend.helper.register('tag_cloud', function tagCloud() {
  return this.site.tags.toArray().sort((a, b) => b.length - a.length);
});
