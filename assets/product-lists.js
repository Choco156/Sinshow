/* ─────────────────────────────────────────────
   Sinshow 공용 상품 목록
   상품 목록 관리 페이지에서 등록한 백화점·슈퍼브랜드 목록을
   Supabase에서 읽어 와서, 날짜별로 유효한 목록을 골라 줍니다.

   쓰는 페이지 <head> 에 config.js 다음 줄로 넣습니다.
     <script src="../assets/config.js"></script>
     <script src="../assets/product-lists.js"></script>

   ▶ 기간 규칙 (상품 목록 관리 페이지와 같음)
     - 백화점(①②): 시작일이 늦은 버전이 우선. 종료일을 비우면
       다음 버전 시작일 전날까지 이어짐.
     - 슈퍼브랜드(③): 상품별 시작일~종료일 안에서만 적용.
   ───────────────────────────────────────────── */

(function(){
  "use strict";

  var CACHE_KEY = "sinshow_product_lists_v1";   // 상품 목록 관리 페이지와 같은 보관함

  function addDays(iso, n){
    var d = new Date(iso + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function configured(){
    return typeof SUPABASE_URL !== "undefined" && typeof SUPABASE_KEY !== "undefined" &&
           SUPABASE_URL && SUPABASE_KEY && !/^PASTE_/.test(SUPABASE_KEY);
  }

  async function fetchRows(){
    var base = SUPABASE_URL.replace(/\/+$/, "").replace(/\/rest\/v1$/, "");
    var headers = { apikey: SUPABASE_KEY };
    if(!/^sb_/.test(SUPABASE_KEY)) headers.Authorization = "Bearer " + SUPABASE_KEY;
    var res = await fetch(base + "/rest/v1/product_lists?select=*&order=start_date.asc,id.asc", { headers: headers });
    if(!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }

  /* 목록 불러오기
     돌려주는 값: { rows, source, savedAt, error }
       source = "live"  : Supabase에서 방금 읽음
                "cache" : 연결 실패, 마지막으로 받아둔 목록
                "none"  : 둘 다 없음 */
  async function load(){
    var cache = null;
    try{ cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); }catch(e){}
    if(!configured()){
      return { rows: cache ? cache.rows : [], source: cache ? "cache" : "none", savedAt: cache ? cache.at : null,
               error: "assets/config.js에 Supabase 접속 정보가 없습니다." };
    }
    try{
      var rows = await fetchRows();
      try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ at: new Date().toISOString(), rows: rows })); }catch(e){}
      return { rows: rows, source: "live", savedAt: null, error: null };
    }catch(e){
      return { rows: cache ? cache.rows : [], source: cache ? "cache" : "none", savedAt: cache ? cache.at : null,
               error: (e && e.message) ? e.message : String(e) };
    }
  }

  /* 백화점 버전 목록 (kind: "dept_shop" | "dept_power") */
  function versions(rows, kind){
    return rows.filter(function(r){ return r.kind === kind; }).map(function(r){
      return { id: r.id, start: r.start_date, end: r.end_date || null, count: r.item_count,
               codes: new Set((r.items || []).map(function(i){ return String(i.code); })) };
    }).sort(function(a, b){ return a.start < b.start ? -1 : a.start > b.start ? 1 : a.id - b.id; });
  }

  /* 버전이 실제로 끝나는 날 (직접 넣은 종료일과 다음 버전 시작 전날 중 빠른 날, 둘 다 없으면 null = 계속) */
  function effectiveEnd(list, v){
    var next = null;
    list.forEach(function(x){ if(x.start > v.start && (!next || x.start < next)) next = x.start; });
    var cut = next ? addDays(next, -1) : null;
    if(v.end && cut) return v.end < cut ? v.end : cut;
    return v.end || cut;
  }

  /* 그날 유효한 백화점 버전. 없으면 null */
  function deptFor(rows, kind, date){
    var list = versions(rows, kind), hit = null;
    list.forEach(function(v){
      var e = effectiveEnd(list, v);
      if(v.start <= date && (!e || date <= e)) hit = v;
    });
    if(!hit) return null;
    return { id: hit.id, start: hit.start, end: effectiveEnd(list, hit), count: hit.count, codes: hit.codes };
  }

  /* 그날 진행 중인 슈퍼브랜드: { codes:Set, brands:{브랜드:상품수} } */
  function superFor(rows, date){
    var codes = new Set(), brands = {};
    rows.forEach(function(r){
      if(r.kind !== "super" || !(r.start_date <= date && date <= r.end_date)) return;
      (r.items || []).forEach(function(i){ codes.add(String(i.code)); });
      brands[r.brand] = (brands[r.brand] || 0) + (r.item_count || 0);
    });
    return { codes: codes, brands: brands };
  }

  window.SinshowLists = {
    load: load,
    deptFor: deptFor,
    superFor: superFor,
    effectiveEnd: effectiveEnd,
    versions: versions,
    addDays: addDays
  };
})();
