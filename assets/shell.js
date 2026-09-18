/* ─────────────────────────────────────────────
   Sinshow 공용 사이드바
   페이지 <head> 에 아래 두 줄만 넣으면 사이드바가 붙습니다.
     <link rel="stylesheet" href="../assets/shell.css">
     <script src="../assets/shell.js" defer></script>
   (루트에 있는 index.html 은 ../ 없이 assets/… 로)

   ▶ 메뉴 추가는 바로 아래 NAV 목록에 한 줄 넣으면 끝입니다.
       path  : 폴더 이름. 끝에 슬래시. 홈은 "" 입니다.
       label : 사이드바에 보일 이름
       icon  : 앞에 붙는 기호 (아무 글자나 가능)
       desc  : 홈 화면 카드에 들어갈 한 줄 설명
       soon  : true 면 회색 '준비중' 으로 표시되고 눌리지 않습니다
       home  : false 면 홈 카드 목록에서만 뺍니다 (사이드바에는 남음)
   ───────────────────────────────────────────── */

var NAV = [
  { path:"",            label:"홈",            icon:"⌂", home:false },

  { group:"광고 운영" },
  { path:"merger/",     label:"SPO 도구",       icon:"⊞",
    desc:"매체 리포트를 하나로 합치고, 상품코드로 캠페인을 분류합니다." },
  { path:"sa-report/",  label:"SA 일일 리포트", icon:"▤",
    desc:"네이버·구글·브랜드검색 리포트를 합쳐 붙여넣기용 엑셀로 만듭니다." }
];

(function(){
  "use strict";

  var me = document.currentScript ||
           (function(){ var s = document.getElementsByTagName("script"); return s[s.length-1]; })();
  // assets/shell.js 의 한 단계 위가 사이트 루트입니다 (예: /Sinshow/)
  var BASE = new URL("../", me.src).pathname;

  function norm(p){
    p = p.replace(/index\.html$/, "");
    return p.endsWith("/") ? p : p + "/";
  }

  function build(){
    var here = norm(location.pathname);

    var rail = document.createElement("aside");
    rail.className = "shell-rail";

    var brand = document.createElement("a");
    brand.className = "shell-brand";
    brand.href = BASE;
    brand.innerHTML =
      '<span class="shell-mark">S</span>' +
      '<span><b>Sinshow</b><span>광고 운영 도구</span></span>';
    rail.appendChild(brand);

    var nav = document.createElement("nav");
    nav.className = "shell-nav";

    NAV.forEach(function(item){
      if(item.group){
        var g = document.createElement("div");
        g.className = "shell-group";
        g.textContent = item.group;
        nav.appendChild(g);
        return;
      }
      var a = document.createElement("a");
      a.className = "shell-link" + (item.soon ? " soon" : "");
      a.href = item.soon ? "#" : BASE + item.path;
      a.innerHTML = '<span class="ico">' + (item.icon || "·") + "</span>";
      a.appendChild(document.createTextNode(item.label));
      if(!item.soon && norm(BASE + item.path) === here) a.setAttribute("aria-current", "page");
      nav.appendChild(a);
    });
    rail.appendChild(nav);

    var foot = document.createElement("div");
    foot.className = "shell-foot";
    foot.textContent = "내부 업무용";
    rail.appendChild(foot);

    // 기존 본문을 통째로 감싸서 사이드바 옆으로 밀어냅니다
    var content = document.createElement("div");
    content.className = "shell-content";
    while(document.body.firstChild) content.appendChild(document.body.firstChild);

    var toggle = document.createElement("button");
    toggle.className = "shell-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "메뉴 열기");
    toggle.textContent = "☰";

    var veil = document.createElement("div");
    veil.className = "shell-veil";

    function close(){ document.body.classList.remove("rail-open"); }
    toggle.onclick = function(){ document.body.classList.toggle("rail-open"); };
    veil.onclick = close;
    document.addEventListener("keydown", function(e){ if(e.key === "Escape") close(); });

    document.body.appendChild(rail);
    document.body.appendChild(veil);
    document.body.appendChild(toggle);
    document.body.appendChild(content);

    // 홈 화면이 카드 목록을 그릴 때 씁니다
    window.SINSHOW = { base: BASE, nav: NAV };
    document.dispatchEvent(new CustomEvent("shell:ready"));
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
