(function () {
  "use strict";
  var root = document.documentElement;
  var body = document.body;
  var themeBtn = document.getElementById("themeBtn");

  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }
  function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function normalize(text) {
    return String(text || "").toLocaleLowerCase("fa").replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/\s+/g," ").trim();
  }
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, done);
    else {
      var area=document.createElement("textarea"); area.value=text; area.style.cssText="position:fixed;opacity:0";
      body.appendChild(area); area.select(); try { document.execCommand("copy"); } catch(e) {} area.remove(); done();
    }
  }

  function setTheme(value) {
    root.setAttribute("data-theme", value);
    if (themeBtn) {
      themeBtn.textContent = value === "light" ? "🌙" : "☀️";
      themeBtn.setAttribute("aria-label", value === "light" ? "فعال‌کردن تم تیره" : "فعال‌کردن تم روشن");
    }
    store("kali-guide-theme", value);
  }
  setTheme(load("kali-guide-theme") || (window.matchMedia && matchMedia("(prefers-color-scheme:light)").matches ? "light" : "dark"));
  if (themeBtn) themeBtn.addEventListener("click", function(){ setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light"); });

  document.querySelectorAll(".codewrap").forEach(function(wrap){
    var button=wrap.querySelector(".copybtn"), code=wrap.querySelector("code"); if(!button||!code)return;
    button.setAttribute("aria-label","کپی دستور");
    button.addEventListener("click",function(){
      copyText(code.textContent.replace(/\n$/, ""),function(){
        button.classList.add("ok"); button.textContent="کپی شد ✓";
        setTimeout(function(){button.classList.remove("ok");button.textContent="کپی";},1500);
      });
    });
  });

  document.querySelectorAll(".permalink").forEach(function(button){
    button.addEventListener("click",function(){
      var url=location.href.split("#")[0]+"#"+button.getAttribute("data-link");
      copyText(url,function(){button.classList.add("ok");button.textContent="✓";setTimeout(function(){button.classList.remove("ok");button.textContent="🔗";},1300);});
    });
  });

  var studied={};
  try{studied=JSON.parse(load("kali-study-progress")||"{}");}catch(e){studied={};}
  var studyButtons=Array.prototype.slice.call(document.querySelectorAll(".study-toggle"));
  var studyProgress=document.getElementById("studyProgress");
  function renderStudy(){
    var count=0;
    studyButtons.forEach(function(button){
      var id=button.getAttribute("data-study"), done=!!studied[id]; if(done)count++;
      button.classList.toggle("done",done); button.setAttribute("aria-pressed",String(done));
      button.setAttribute("title",done?"حذف علامت مطالعه":"علامت‌گذاری به‌عنوان مطالعه‌شده");
      var card=document.getElementById(id); if(card)card.classList.toggle("studied",done);
    });
    if(studyProgress)studyProgress.textContent="مطالعه‌شده: "+count.toLocaleString("fa-IR")+" از "+studyButtons.length.toLocaleString("fa-IR");
    store("kali-study-progress",JSON.stringify(studied));
  }
  studyButtons.forEach(function(button){button.addEventListener("click",function(){var id=button.getAttribute("data-study");if(studied[id])delete studied[id];else studied[id]=true;renderStudy();});});
  var clearStudy=document.getElementById("clearStudy");
  if(clearStudy)clearStudy.addEventListener("click",function(){studied={};renderStudy();});
  renderStudy();

  var search=document.getElementById("siteSearch");
  var filter=document.getElementById("sectionFilter");
  var scopeFilter=document.getElementById("scopeFilter");
  var resultsBar=document.getElementById("resultsBar");
  var referenceCommands=Array.prototype.slice.call(document.querySelectorAll(".cmd[data-section]"));
  var securityCommands=Array.prototype.slice.call(document.querySelectorAll(".security-tool[data-section]"));
  var commands=referenceCommands.concat(securityCommands);
  var guideCards=Array.prototype.slice.call(document.querySelectorAll(".guide-card"));

  function matchesTokens(element,tokens){
    var hay=normalize((element.getAttribute("data-search")||"")+" "+element.textContent);
    return tokens.every(function(token){return hay.indexOf(token)!==-1;});
  }
  function applyFilters(updateUrl){
    if(!search)return;
    var query=normalize(search.value), tokens=query?query.split(" "):[];
    var section=filter?filter.value:"all", scope=scopeFilter?scopeFilter.value:"all", visible=0;
    commands.forEach(function(card){
      var isSecurity=card.classList.contains("security-tool");
      var scopeMatch=scope==="all"||(scope==="security"&&isSecurity)||(scope==="reference"&&!isSecurity);
      var sectionMatch=section==="all"||(!isSecurity&&card.getAttribute("data-section")===section);
      var show=scopeMatch&&sectionMatch&&matchesTokens(card,tokens);
      card.classList.toggle("filtered-out",!show); if(show)visible++;
    });
    guideCards.forEach(function(card){
      var isSecurity=!!card.closest(".security-course-toc");
      var sid=(card.getAttribute("href")||"").replace("#","");
      var scopeMatch=scope==="all"||(scope==="security"&&isSecurity)||(scope==="reference"&&!isSecurity);
      var sectionMatch=section==="all"||(!isSecurity&&sid===section);
      var show=scopeMatch&&sectionMatch&&matchesTokens(card,tokens);
      card.classList.toggle("filtered-out",!show);
    });
    document.querySelectorAll(".part").forEach(function(part){
      var owned=part.querySelectorAll(".cmd[data-section]");
      if(owned.length) part.classList.toggle("filtered-section",!part.querySelector(".cmd[data-section]:not(.filtered-out)"));
    });
    document.querySelectorAll(".security-chapter").forEach(function(part){
      part.classList.toggle("filtered-section",!part.querySelector(".security-tool:not(.filtered-out)"));
    });
    var securityCourse=document.getElementById("security-course");
    if(securityCourse)securityCourse.classList.toggle("filtered-section",scope==="reference"||section!=="all"||!securityCourse.querySelector(".security-tool:not(.filtered-out)"));
    if(resultsBar){
      var total=scope==="reference"?referenceCommands.length:(scope==="security"?securityCommands.length:commands.length);
      var active=query||section!=="all"||scope!=="all";
      resultsBar.style.display=active?"block":"none";
      resultsBar.textContent=visible?visible.toLocaleString("fa-IR")+" درس از "+total.toLocaleString("fa-IR")+" نمایش داده می‌شود":"نتیجه‌ای پیدا نشد؛ عبارت، دامنه یا فصل را تغییر دهید.";
    }
    if(updateUrl&&history.replaceState&&location.protocol!=="file:"){
      var url=new URL(location.href); query?url.searchParams.set("q",search.value.trim()):url.searchParams.delete("q");
      section!=="all"?url.searchParams.set("section",section):url.searchParams.delete("section");
      scope!=="all"?url.searchParams.set("scope",scope):url.searchParams.delete("scope"); history.replaceState(null,"",url);
    }
  }
  if(search){
    search.addEventListener("input",function(){applyFilters(true);});
    if(filter)filter.addEventListener("change",function(){if(filter.value!=="all"&&scopeFilter&&scopeFilter.value==="security")scopeFilter.value="reference";applyFilters(true);});
    if(scopeFilter)scopeFilter.addEventListener("change",function(){if(scopeFilter.value==="security"&&filter)filter.value="all";applyFilters(true);});
    try{
      var params=new URLSearchParams(location.search), q=params.get("q"), s=params.get("section"), sc=params.get("scope");
      if(q)search.value=q; if(s&&filter&&filter.querySelector('option[value="'+CSS.escape(s)+'"]'))filter.value=s;
      if(sc&&scopeFilter&&scopeFilter.querySelector('option[value="'+CSS.escape(sc)+'"]'))scopeFilter.value=sc;
      if(scopeFilter&&scopeFilter.value==="security"&&filter)filter.value="all";
    }catch(e){}
    applyFilters(false);
  }
  var clear=document.getElementById("clearFilters");
  if(clear)clear.addEventListener("click",function(){if(search)search.value="";if(filter)filter.value="all";if(scopeFilter)scopeFilter.value="all";applyFilters(true);if(search)search.focus();});

  var densityBtn=document.getElementById("densityBtn");
  function setDensity(compact){body.classList.toggle("compact",compact);if(densityBtn){densityBtn.textContent=compact?"☰":"☷";densityBtn.setAttribute("aria-pressed",String(compact));}store("kali-density",compact?"compact":"comfortable");}
  setDensity(load("kali-density")==="compact");
  if(densityBtn)densityBtn.addEventListener("click",function(){setDensity(!body.classList.contains("compact"));});

  document.addEventListener("keydown",function(event){
    var tag=document.activeElement&&document.activeElement.tagName; var typing=/INPUT|TEXTAREA|SELECT/.test(tag);
    if(event.key==="/"&&!typing&&search){event.preventDefault();search.focus();}
    if(event.key==="Escape"&&search&&(document.activeElement===search||search.value)){search.value="";if(filter)filter.value="all";if(scopeFilter)scopeFilter.value="all";applyFilters(true);search.blur();}
    if(!typing&&(event.key.toLowerCase()==="j"||event.key.toLowerCase()==="k")){
      var visible=commands.filter(function(c){return !c.classList.contains("filtered-out")&&!c.closest(".filtered-section");}); if(!visible.length)return;
      var current=visible.findIndex(function(c){var r=c.getBoundingClientRect();return r.top>=60&&r.top<innerHeight*.55;});
      var next=event.key.toLowerCase()==="j"?Math.min((current<0?0:current+1),visible.length-1):Math.max((current<0?visible.length-1:current-1),0);
      visible[next].scrollIntoView({behavior:"smooth",block:"start"}); visible[next].focus({preventScroll:true});
    }
  });

  var printBtn=document.getElementById("printBtn"); if(printBtn)printBtn.addEventListener("click",function(){window.print();});
  var progress=document.getElementById("progress"), backTop=document.getElementById("backTop");
  function onScroll(){var max=document.documentElement.scrollHeight-innerHeight;if(progress)progress.style.width=(max>0?scrollY/max*100:0)+"%";if(backTop)backTop.classList.toggle("show",scrollY>500);}
  addEventListener("scroll",onScroll,{passive:true});onScroll();if(backTop)backTop.addEventListener("click",function(){scrollTo({top:0,behavior:"smooth"});});

  if("serviceWorker" in navigator&&location.protocol.indexOf("http")===0){addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){});});}
})();
