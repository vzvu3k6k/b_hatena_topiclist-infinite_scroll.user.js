// ==UserScript==
// @name           はてブの「トピック」を無限スクロール
// @description    
// @version        0.1
// @author         vzvu3k6k
// @match          http://b.hatena.ne.jp/topiclist*
// @match          http://b.hatena.ne.jp/topic/*
// @namespace      http://vzvu3k6k.tk/
// @license        CC0
// ==/UserScript==

var loadPage = function(url){
  return new Promise(function(resolve, reject){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function(){
      if(xhr.status === 200){
        resolve(xhr);
      }else{
        reject(new Error('HTTP status ' + xhr.status));
      }
    };
    xhr.onerror = function(){
      reject(new Error('XHR error'));
    };
    xhr.ontimeout = function(){
      reject(new Error('XHR timeout'));
    };
    xhr.responseType = 'document';
    xhr.send();
  });
};

var toArray = function(list){
  return Array.prototype.slice.call(list);
};

var update = function(responseXML){
  var $newTopicMain = responseXML.querySelector('#topic-main');
  var $oldTopicMain = document.querySelector('#topic-main');

  // <head>内の<link rel="next">, <link rel="prev">を更新
  toArray(document.head.querySelectorAll('link[rel="next"], link[rel="prev"]'))
    .forEach(function(node){ node.remove(); });
  toArray(responseXML.querySelectorAll('link[rel="next"], link[rel="prev"]'))
    .forEach(function(node){ document.head.appendChild(node); });

  // .js-topic-list（トピック一覧）を更新
  var $oldTopicList = $oldTopicMain.querySelector('.js-topic-list');
  toArray($newTopicMain.querySelectorAll('.js-topic-list > *:not(.topic-tab)'))
    .forEach(function(node){ $oldTopicList.appendChild(node); });

  // .topic-month-navi（画面右の日付リスト）を更新
  var $newTopicMonthNavi = $newTopicMain.querySelector('.topic-month-navi');
  var $oldTopicMonthNavi = $oldTopicMain.querySelector('.topic-month-navi');
  toArray($newTopicMonthNavi.children)
    .forEach(function($newMonth){
      var $oldMonth = document.getElementById($newMonth.id);
      if(!$oldMonth){
        // 同じ月のリストがまだ存在しなければそのまま追加
        $oldTopicMonthNavi.appendChild($newMonth);
      }else{
        // 同じ月のリストがすでに存在するなら日付だけ追加
        var $newTopicDataNavi = $newMonth.querySelector('.topic-date-navi');
        var $oldTopicDataNavi = $oldMonth.querySelector('.topic-date-navi');
        toArray($newTopicDataNavi.children)
          .forEach(function($newDay){
            if(!document.getElementById($newDay.id)){
              $oldTopicDataNavi.appendChild($newDay);
            }
          });
      }
    });
};

var getNextUrl = function(){
  var l = document.querySelector('link[rel="next"]');
  return l && l.href;
};

var onScroll = (function(){
  var loading = false;

  return function(event){
    if(loading) return;

    // Copied from autopagerize.user.js by swdyh
    // https://github.com/swdyh/autopagerize/blob/master/autopagerize.user.js
    var scrollHeight = Math.max(document.documentElement.scrollHeight,
                                document.body.scrollHeight);
    if(scrollHeight - window.innerHeight - event.pageY > 1500) return;

    var nextUrl = getNextUrl();
    if(!nextUrl){
      document.removeEventListener('scroll', onScroll);
      return;
    }

    loading = true;

    loadPage(nextUrl)
      .then(function(xhr){
        update(xhr.responseXML);
      })
      .catch(function(error){
        alert('Infinite Scroll Error: ' + error);
        document.removeEventListener('scroll', onScroll);
      })
      .then(function(){
        loading = false;
      });
  };
})();

if(getNextUrl()){
  document.addEventListener('scroll', onScroll);
}
