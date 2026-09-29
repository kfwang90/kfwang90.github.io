/* 文章页交互：代码块一键复制、返回顶部 */
(function () {
  /* ---------- 1. 代码块复制按钮 ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* 忽略：浏览器不支持时静默失败 */ }
      document.body.removeChild(ta);
      resolve();
    });
  }

  document.querySelectorAll('.post-detail pre').forEach(function (pre) {
    var wrap = document.createElement('div');
    wrap.className = 'code-block';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy-btn';
    btn.textContent = '复制';
    wrap.appendChild(btn);

    btn.addEventListener('click', function () {
      var text = pre.innerText.replace(/\n+$/, '');
      copyText(text).then(function () {
        btn.textContent = '已复制';
        btn.classList.add('done');
        setTimeout(function () {
          btn.textContent = '复制';
          btn.classList.remove('done');
        }, 1500);
      });
    });
  });

  /* ---------- 2. 返回顶部 ---------- */
  var toTop = document.getElementById('toTop');
  if (!toTop) return;

  function onScroll() {
    toTop.classList.toggle('show', window.scrollY > 400);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
