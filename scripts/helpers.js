/**
 * 自定义 helper：供主题模板调用（Hexo 启动时自动执行 scripts/ 下的文件）
 */

// 标签云数据：按文章数从多到少排序
hexo.extend.helper.register('tag_cloud', function tagCloud() {
  return this.site.tags.toArray().sort((a, b) => b.length - a.length);
});
