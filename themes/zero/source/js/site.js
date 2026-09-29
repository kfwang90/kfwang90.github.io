/* 全站公共交互：移动端导航展开 / 收起 */
(function () {
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('navLinks');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    nav.classList.toggle('open');
  });

  /* 点击导航项后收起菜单 */
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') nav.classList.remove('open');
  });
})();
