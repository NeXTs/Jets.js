$(function() {

  var content = {
      tr: [],
      div: [],
      li: []
    },
    peopleJSON = JSON.parse(people);
  for (var i = 0; i < 1000; i++) {
      content.tr.push('<tr><td>' + peopleJSON[i][0] + '</td><td>' + peopleJSON[i][1] + '</td></tr>');
      if(i > 200) continue;
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
    contentTag: '.additional-list'
  });

  $('.action-demo-toggle').on('mouseenter touchstart', function() {
    $(this).attr('src', $(this).attr('src').replace('.png', '_hover.gif'));
  }).on('mouseleave touchend', function() {
    $(this).attr('src', $(this).attr('src').replace('_hover.gif', '.png'));
  });

  $('.modal-trigger').leanModal();
  $('#materializeInputContainer').fadeIn();
});