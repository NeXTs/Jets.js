$(function() {

  var content = {
      tr: [],
      div: [],
      li: []
    },
    peopleJSON = JSON.parse(people);
  for (var i = 0; i < 1000; i++) {
      content.tr.push('<tr><td>' + peopleJSON[i][0] + '</td><td>' + peopleJSON[i][1] + '</td></tr>');
      if(i > 50) continue;
      content.div.push('<div>' + peopleJSON[i][0] + '</div>');
      content.li.push('<li>' + peopleJSON[i][0] + '</li>');
  }

  var $mainDemoContentArea = $('#jetsContent'),
  $runTestBtn = $('#runTestBtn');
  $mainDemoContentArea.html(content.tr.join(''));
  $('#additionalListUl').html(content.li.join(''));
  $('#additionalListDiv').html(content.div.join(''));

  var modes = ['style', 'class', 'jets'];
  window.tutorial = {
    timers: {
      style: [],
      class: [],
      jets: []
    },
    search_phrases: ['Francis Reeves', 'Blake Norton', 'Frank Ford', 'Kathryn Ellis', 'Eva Rios'],
    initTags: function() {
      var people_tags = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: $.map(peopleJSON, function(item){
              return {name: item[0]};
            })
        });
        people_tags.initialize();

        var elt = $('#tagsList');
        elt.materialtags({
            itemValue: 'name',
            itemText: 'name',
            typeaheadjs: {
                name: 'name',
                displayKey: 'name',
                source: people_tags.ttAdapter()
            }
        });
        $.each(tutorial.search_phrases, function(i, phrase) {
          elt.materialtags('add', {name: phrase});
        });
    },
    initCleaner: function() {
      $('.search-row input').on('focus', function() {
        if( ! $runTestBtn.hasClass('disabled')) {
          tutorial.clearListFromAdditionalAttributes();
        }
      });
    },
    updateAverage: function(action) {
      $("#"+action+'Average span').text((tutorial.timers[action].reduce(function(total, val) {
        return total + val;
      }, 0) / tutorial.timers[action].length).toFixed(2)+'');
    },
    resetAverages: function(cb) {
      $.each(tutorial.timers, function(timer){
        tutorial.timers[timer].length = 0;
      });
      clearTimeout(tutorial.addCrownTimeout);
      clearTimeout(tutorial.sunburstTimeout);
      async.each(modes, function(mode, cb) {
        var $this = $("#"+mode+'Average span'), i = 0;
        $this.parent().removeClass('worse worst').find('.show').removeClass('show');
        (function decrease() {
          var val = parseInt($this.text());
          if(val <= 0) return setTimeout(cb, i ? 150 : 0);
          $this.text(val > 100 ? val/2 : --val);
          i++;
          setTimeout(decrease, 15);
        })();
      }, cb);
    },
    logActionAs: function(action) {
      var timer;
      $('#'+action+'Search').prop('disabled', false).off('.search').on('input.search keydown.search', function(e) {
        var $elem = $(this),
          val = $elem.val().toLowerCase(),
          t0 = performance && performance.now && performance.now() || +new Date();
        if( ! val) {
          if(action == 'style') {
            $mainDemoContentArea.children().show();
          } else if(action == 'class') {
            $mainDemoContentArea.children('.hide').removeClass('hide');
          }
          tutorial.logTime(t0, action);
          return 
        }
        if(action == 'style') {
          $mainDemoContentArea.children().hide().filter('[data-jets*="'+val+'"]').show();
        } else if(action == 'class') {
          $mainDemoContentArea.children().filter('.hide').removeClass('hide').end()
            .filter(':not([data-jets*="'+val+'"])').addClass('hide');
        }
        tutorial.logTime(t0, action);
      });
    },
    emulateSearch: function(word, action, end) {
      return $.Deferred(function() {
        var defer = this,
          arr = (word || '').split('')
          $search = $('#' + action + 'Search');
        arr.reduce(function(total, v, i, all){
          var new_val = total + v;
          (function(new_val, i) {
            setTimeout(function() {
              $search.focus().val(new_val);
              tutorial.trigger('keydown', $search.get(0))
              if(i == arr.length-1) {
                setTimeout(function() {
                  $search.focus().val('');
                  tutorial.trigger('keydown', $search.get(0))
                  if(end) $search.blur().attr('disabled', true);
                  defer.resolve();
                }, 100);
              }
            }, i*65);
          }(new_val, i));
          return new_val;
        }, '');
      });
    }, 
    disableSearchInputs: function(condition) {
      $('#searchInputs input:text').prop('disabled', condition);
    },
    trigger: function(evt, element) {
      if (typeof CustomEvent === 'function') {
        var ev = new CustomEvent(evt, {bubbles: true, cancelable: true});
      } else {
        var ev = document.createEvent('Event');
        ev.initEvent(evt, true, true);
      }
      element.dispatchEvent(ev);
    },
    clearListFromAdditionalAttributes: function() {
      $mainDemoContentArea.children().removeAttr('style class');
    },
    setProgress: function(index, mode, phrase) {
      var progress = ((index+1) / tutorial.search_phrases.length * 100),
        speed = phrase.length * 65,
        summaryProgress = ((modes.indexOf(mode)+1) / modes.length) * 100,
        summarySpeed = speed * (tutorial.search_phrases.length);
      tutorial.setProgressCSS(mode, speed, progress);
      tutorial.setProgressCSS('summary', summarySpeed, summaryProgress);
    },
    resetProgress: function() {
      $.each(modes, function(i, mode) {
        tutorial.setProgressCSS(mode, 0, 0);
      });
      tutorial.setProgressCSS('summary', 0, 0);
    },
    setProgressCSS: function(mode, speed, progress) {
      var speedMs = speed + 'ms';
      $('#'+mode+'Progress').css({
        webkitTransitionDuration: speedMs,
        mozTransitionDuration: speedMs,
        MsTransitionDuration: speedMs,
        OTransitionDuration: speedMs,
        transitionDuration: speedMs,
        width: progress + '%'
      });
    },
    logTime: function(t0, action) {
      setTimeout(function() {
        var t1 = performance && performance.now && performance.now() || +new Date();
        tutorial.timers[action].push(t1 - t0);
        tutorial.updateAverage(action);
      }, 0);
    },
    toggleActiveSearchRow: function(toggle, mode) {
      $('#'+mode+'Search').closest('.search-row')[toggle ? 'addClass' : 'removeClass']('active');
    },
    highlightActiveTag: function(phrase) {
      $('#materializeBox .materialize-tags .tag').filter('.active').removeClass('active')
        .end().each(function() {
          var $this = $(this);
          if($this.text() == phrase) {
            $this.addClass('active');
          }
        })
    },
    addCrownTimeout: null,
    sunburstTimeout: null,
    setBadgesColor: function() {
      var results = [],
      difference = ['worst', 'worse'];
      $('.speed-badge-container .badge').removeClass(difference.join(' ')).each(function() {
        var $this = $(this);
        results.push(parseFloat($this.text().trim()));
      });
      results = results.sort(function(a,b){return a-b}).reverse();
      $.each(results, function(i, num) {
        var $badge = $('.speed-badge-container .badge span:contains('+num+')').parent()
        $badge.addClass(difference[i] || '');
        if(i == results.length-1) {
          tutorial.addCrownTimeout = setTimeout(function() {
            $badge.children('.crown').addClass('show');
            tutorial.sunburstTimeout = setTimeout(function() {
              $badge.children('.sunburst-container').addClass('show');
            }, 60);
          }, 500);
        }
      });
    },
    firstRun: true,
    showSearchRows: function(cb) {
      if( ! tutorial.firstRun) return cb();
      $('.search-opening-speech-section').slideUp(110);
      var $hiddenElems = $('.hidden-search-elem');
      $hiddenElems.each(function(i){
        setTimeout(function() {
          $(this).slideDown(250, function() {
            if(i == $hiddenElems.length - 1) cb();
          });
        }.bind(this), i*25);
      });
    },
    clearSearchInputs: function() {
      $(".search-area input:text").val('');
    },
    preventMobileKeyboard: function(val) {
      $('.search-area input').prop('readonly', val);
    },
    runTest: function() {
      if(devtools && devtools.open && window.chrome) {
        Materialize.toast('Please close devtools since it distorts the results', 4000);
      }
      tutorial.search_phrases = $('#tagsList').val().split(',');
      if( ! tutorial.search_phrases.filter(Boolean).length) {
        Materialize.toast('Add search phrases', 4000);
        $('.n-tag.tt-input').focus();
        return
      }
      if($runTestBtn.hasClass('disabled')) return;
      $runTestBtn.addClass('disabled');
      $("#materializeBox").addClass('active');
      tutorial.preventMobileKeyboard(true);
      tutorial.showSearchRows(function() {
        tutorial.firstRun = false;
        tutorial.clearSearchInputs();
        tutorial.resetAverages(function() {
          tutorial.disableSearchInputs(true);
          async.eachSeries(modes, function(mode, cb) {
            tutorial.clearListFromAdditionalAttributes();
            tutorial.logActionAs(mode);
            tutorial.toggleActiveSearchRow(true, mode);
            async.forEachOfSeries(tutorial.search_phrases, function(phrase, index, cb) {
              tutorial.highlightActiveTag(phrase);
              tutorial.emulateSearch(phrase, mode, index == tutorial.search_phrases.length-1).then(cb);
              tutorial.setProgress(index, mode, phrase);
            }, function() {
              tutorial.toggleActiveSearchRow(false, mode);
              cb();
            });
          }, function() {
            tutorial.disableSearchInputs(false);
            tutorial.resetProgress();
            $runTestBtn.removeClass('disabled');
            $("#materializeBox").removeClass('active');
            tutorial.preventMobileKeyboard(false);
            tutorial.highlightActiveTag('');
            setTimeout(function() {
              tutorial.setBadgesColor();
            }, 100);
          });
        });
      })
    }
  }
  $runTestBtn.click(tutorial.runTest.bind(tutorial));

  var jets = new Jets({
    searchTag: '#jetsSearch',
    contentTag: '#jetsContent'
  });
  tutorial.initTags();
  tutorial.initCleaner();

  new Jets({
    searchTag: '#additionalListInput',
    contentTag: '.additional-list',
    hideBy: 'opacity:0; height:0'
  });

  $('.action-demo-toggle').on('mouseenter touchstart', function() {
    $(this).attr('src', $(this).attr('src').replace('.png', '_hover.gif'));
  }).on('mouseleave touchend', function() {
    $(this).attr('src', $(this).attr('src').replace('_hover.gif', '.png'));
  });

  $('.modal-trigger').leanModal();
  $('#materializeInputContainer').fadeIn();

  function fillTweets(amount) {
    var userLang = (navigator.language || navigator.userLanguage).toLowerCase(),
    tweets = shuffle([
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">Jets.js Native CSS search engine  <a href="http://t.co/PU9QWE8YRH">http://t.co/PU9QWE8YRH</a> - do people do filtering like that?</p>&mdash; (((Chris Heilmann))) (@codepo8) <a href="https://twitter.com/codepo8/status/642090324245000192">September 10, 2015</a></blockquote>'},
      {lang: 'ja', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="ja" dir="ltr">高速なインクリメンタルサーチ的なJSライブラリ → Jets.js - Native CSS search engine (Denis Lukov)<a href="http://t.co/B0qNCBsPDi">http://t.co/B0qNCBsPDi</a></p>&mdash; dotHTML5 (@dotHTML5) <a href="https://twitter.com/dotHTML5/status/647002539733426177">September 24, 2015</a></blockquote>'},
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">Clever use of the browser for blazingly fast front-end filtering: <a href="http://t.co/ILvuRSzQ3d">http://t.co/ILvuRSzQ3d</a>.</p>&mdash; Hugo Giraudel (@HugoGiraudel) <a href="https://twitter.com/HugoGiraudel/status/644457289404055552">September 17, 2015</a></blockquote>'},
      {lang: 'ru', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="ru" dir="ltr">Jets.js, фильтрует списки на клиенте очень быстро с помощью CSS-селекторов по атрибутам — <a href="http://t.co/K5qdUBwVfT">http://t.co/K5qdUBwVfT</a> <a href="http://t.co/Zylhzv1pZM">pic.twitter.com/Zylhzv1pZM</a></p>&mdash; Веб-стандарты (@webstandards_ru) <a href="https://twitter.com/webstandards_ru/status/644073329633198080">September 16, 2015</a></blockquote>'},
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">Jets.js: Native <a href="https://twitter.com/hashtag/CSS?src=hash">#CSS</a> search engine - <a href="http://t.co/byxdJLu3Ou">http://t.co/byxdJLu3Ou</a></p>&mdash; Jonathan Torke (@JonathanTorke) <a href="https://twitter.com/JonathanTorke/status/648949396738936832">September 29, 2015</a></blockquote>'},
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">Jets.js Native CSS search engine <a href="http://t.co/hmj39C4Xtt">http://t.co/hmj39C4Xtt</a> <a href="http://t.co/zV40OBzmPv">pic.twitter.com/zV40OBzmPv</a></p>&mdash; Beyond The Desktop (@bdconf) <a href="https://twitter.com/bdconf/status/651025773709516800">October 5, 2015</a></blockquote>'},
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">Jets.js is a <a href="https://twitter.com/hashtag/javascript?src=hash">#javascript</a> library to create native#CSS search engine - <a href="https://t.co/9uS5g6TDOD">https://t.co/9uS5g6TDOD</a></p>&mdash; Ibrahim Jabbari (@ibrahim_jabbari) <a href="https://twitter.com/ibrahim_jabbari/status/657749414761533440">October 24, 2015</a></blockquote>'},
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">Jets.js: A native CSS search engine <a href="https://t.co/Jc3swSXoYx">https://t.co/Jc3swSXoYx</a></p>&mdash; Webdesigner Depot (@DesignerDepot) <a href="https://twitter.com/DesignerDepot/status/659361745618804736">October 28, 2015</a></blockquote>'},
      {lang: 'ja', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="ja" dir="ltr">JavaScript：CSSのセレクターを使ってフィルタリング検索を実装するライブラリー【Jets.js】 <a href="https://t.co/dUg3RqwBR8">https://t.co/dUg3RqwBR8</a></p>&mdash; Webクリエイター ボックス (@webcreatorbox) <a href="https://twitter.com/webcreatorbox/status/659536560514318336">October 29, 2015</a></blockquote>'},
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">Interesting concept, using CSS to implement a tagging / search capability: <a href="https://t.co/ZaPtIg4KvL">https://t.co/ZaPtIg4KvL</a> <a href="https://twitter.com/hashtag/js?src=hash">#js</a> <a href="https://twitter.com/hashtag/css?src=hash">#css</a></p>&mdash; Maks Surguy (@msurguy) <a href="https://twitter.com/msurguy/status/687410649199153152">January 13, 2016</a></blockquote>'},
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">Jets.js - A native CSS search engine <a href="https://t.co/lLNcThBvEL">https://t.co/lLNcThBvEL</a> <a href="https://t.co/wuXrLpHquh">pic.twitter.com/wuXrLpHquh</a></p>&mdash; Speckyboy (@speckyboy) <a href="https://twitter.com/speckyboy/status/756063735043809280">July 21, 2016</a></blockquote>'},
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">JetsJS: A Native CSS search engine <a href="https://t.co/f2U314d2qD">https://t.co/f2U314d2qD</a> via <a href="https://twitter.com/DenisLukov">@denislukov</a> <a href="https://t.co/pgZNDDWAtg">pic.twitter.com/pgZNDDWAtg</a></p>&mdash; Product Hunt (@ProductHunt) <a href="https://twitter.com/ProductHunt/status/756073881291616256">July 21, 2016</a></blockquote>'},
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">Jets.js - Clever use of CSS for doing super fast frontend searches <a href="https://t.co/XkdDwa3JQv">https://t.co/XkdDwa3JQv</a></p>&mdash; Tutorialzine (@Tutorialzine) <a href="https://twitter.com/Tutorialzine/status/756446769509171201">July 22, 2016</a></blockquote>'},
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">Jets.js : Native CSS Search Engine <a href="https://t.co/798iOJhns4">https://t.co/798iOJhns4</a>  <a href="https://twitter.com/hashtag/css?src=hash">#css</a> <a href="https://twitter.com/hashtag/javascript?src=hash">#javascript</a> <a href="https://t.co/9YtubrZqYt">pic.twitter.com/9YtubrZqYt</a></p>&mdash; jQuery Rain (@jquery_rain) <a href="https://twitter.com/jquery_rain/status/756564591685939200">July 22, 2016</a></blockquote>'},
      {lang: 'en', used: false, markup: '<blockquote class="twitter-tweet" data-cards="hidden" data-lang="en"><p lang="en" dir="ltr">Jets.js Native <a href="https://twitter.com/hashtag/CSS?src=hash">#CSS</a> search engine from <a href="https://twitter.com/DenisLukov">@DenisLukov</a> <a href="https://t.co/GFnmwp3WDP">https://t.co/GFnmwp3WDP</a> <a href="https://twitter.com/hashtag/JavaScript?src=hash">#JavaScript</a></p>&mdash; Awwwards (@AWWWARDS) <a href="https://twitter.com/AWWWARDS/status/757544701222412289">July 25, 2016</a></blockquote>'}
    ]),
    result = [];

    for(var i = 0, ii = tweets.length, item; i < ii; i++) {
      item = tweets[i]
      if(item.lang != 'en' && item.lang == userLang && Math.round(Math.random())) {
        item.used = true;
        result.push(item.markup)
      }
    }

    while(result.length < amount) {
      var item = tweets[numRange(0, tweets.length - 1)]
      if(item.used) continue;
      item.used = true;
      result.push(item.markup)
    }

    for(var i = 0; i < result.length; i++) {
      result[i] = '<div class="m6 l4 col '+(i == amount-1 ? 'hide-on-med-and-down' : '')+'">' + result[i] + '</div>';
    }

    $('#tweets').html(result.join(''));

    $(window).on('scroll.tweets', function() {
      if($(window).scrollTop() + window.innerHeight > $(document).height() / 2) {
        $('body').append('<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>');
        $(window).off('scroll.tweets');
      }
    });
  }

  fillTweets(3);

  /**
   * Utils
   */

  function numRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }
});
