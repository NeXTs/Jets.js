describe('Jets', function() {

  var people = ['John Doe', 'Mike Doe', 'Alex Smith', 'Alice Vazovsky', 'Denis Koen'],
    $search = $('#jetsSearch'),
    searchNode = $search.get(0),
    $content = $('#jetsContent');


  /*
   * Helper functions
   */
  function trigger(ev, _elem) {
    elem = _elem || searchNode
    if ("createEvent" in document) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(ev, false, true);
        elem.dispatchEvent(evt);
    } else elem.fireEvent("on" + ev);
  }

  function ext(options) {
    return $.extend({
      searchTag: '#jetsSearch',
      contentTag: '#jetsContent'
    }, options || {});
  }

  function make(action) {
    action();
    trigger('change');
  }


  /*
   * Mocha helpers
   */ 
  before(function() {
    $content.html($.map(people, function(val, i){
      var reversed = val.split('').reverse().join('');
      return '<tr><td data-custom="' + reversed + '">' + val + '</td><td>' + i + '</td></tr>'
    }).join(''));
  })

  afterEach(function() {
    jet && jet.destroy();
    $search.val('');
    trigger('change', searchNode);
  })

  after(function() {
    jet && jet.destroy();
    $search.val('');
    $content.find('[data-custom]').removeAttr('data-custom');
  })


  /*
  * Specs
  */

  it('Should hide inappropriate rows', function() {
    jet = new Jets(ext({}));
    make(function() {
      $search.val(people[0]);
    })
    assert.lengthOf($content.children(':visible'), 1);
  })

  it('Should show all rows if search query not specified', function() {
    jet = new Jets(ext({}));
    make(function() {
      $search.val('');
    })
    assert.lengthOf($content.children(':visible'), people.length);
  })

  it('Should hide all rows if no suitable results', function() {
    jet = new Jets(ext({}));
    make(function() {
      $search.val('404');
    })
    assert.lengthOf($content.children(':visible'), 0);
  })

  describe('On init', function() {

    it('Shoud add style tag after init', function() {
      jet = new Jets(ext({}));
      assert.lengthOf($('head').find(jet.styleTag), 1);
    })

    it('Should add "data-jets" attribute', function() {
      jet = new Jets(ext({
        columns: [0]
      }));
      var $firstRow = $content.children(':first');
      assert.equal($firstRow.attr('data-jets'), $firstRow.children(':first').text().trim().toLowerCase());
    })

  })

  describe('On destroy', function() {

    it('Shoud remove style tag after destroy', function() {
      jet = new Jets(ext({}));
      jet.destroy();
      assert.lengthOf($('head').find(jet.styleTag), 0);
    })

    it('Should remove "data-jets" attribute', function() {
      jet = new Jets(ext({}));
      jet.destroy()
      assert.isUndefined($content.children(':first').attr('data-jets'));
    })
    
  })

  describe('Columns option', function() {
    
    it('Should search by any column', function() {
      jet = new Jets(ext({}));
      make(function() {
        $search.val('1');
      })
      assert.lengthOf($content.children(':visible'), 1);
    })

    it('Should find one row by first column', function() {
      jet = new Jets(ext({
        columns: [0]
      }));
      make(function() {
        $search.val(people[0]);
      })
      assert.lengthOf($content.children(':visible'), 1);
    })

    it('Should avoid second column', function() {
      jet = new Jets(ext({
        columns: [0]
      }));
      make(function() {
        $search.val('1');
      })
      assert.lengthOf($content.children(':visible'), 0);
    })
    
  })

  describe('addImportant option', function() {

    it('Should avoid !important by default', function() {
      jet = new Jets(ext({}));
      make(function() {
        $search.val(people[0]);
      })
      assert.notInclude($(jet.styleTag).html(), '!important');
    })

    it('Should add !important', function() {
      jet = new Jets(ext({
        addImportant: true
      }));
      make(function() {
        $search.val(people[0]);
      })
      assert.include($(jet.styleTag).html(), '!important');
    })

  })

  describe('searchSelector option', function() {

    function execute(selector) {
      it('Should use custom selector: ' + selector, function() {
        jet = new Jets(ext({
          searchSelector: selector
        }));
        make(function() {
          $search.val(people[0]);
        })
        assert.include($(jet.styleTag).html(), selector);  
      })
    }

    var selectors = ['^', '$', '~', '|'];
    for(var i = 0, ii = selectors.length; i < ii; i++) {
      execute(selectors[i]);
    }

    it('Should find one result with * selector', function() {

      jet = new Jets(ext({
        searchSelector: '*'
      }));
      make(function() {
        $search.val('John Doe');
      })
      assert.lengthOf($content.children(':visible'), 1);

    })

    it('Should hide all results with * selector and mixed words', function() {

      jet = new Jets(ext({
        searchSelector: '*'
      }));
      make(function() {
        $search.val('Doe John');
      })
      assert.lengthOf($content.children(':visible'), 0);

    })

    it('Should find one result with *AND selector and mixed words', function() {

      jet = new Jets(ext({
        searchSelector: '*AND'
      }));
      make(function() {
        $search.val('Doe John');
      })
      assert.lengthOf($content.children(':visible'), 1);

    })

    it('Should find one result with *AND selector and part of word', function() {

      jet = new Jets(ext({
        searchSelector: '*AND'
      }));
      make(function() {
        $search.val('John oe');
      })
      assert.lengthOf($content.children(':visible'), 1);

    })

    it('Should find three results with *OR selector and part of word', function() {

      jet = new Jets(ext({
        searchSelector: '*OR'
      }));
      make(function() {
        $search.val('John oe');
      })
      assert.lengthOf($content.children(':visible'), 3);

    })

  })

  describe('manualContentHandling option', function() {

    it('Should fetch content by custom rule', function() {
      jet = new Jets(ext({
        manualContentHandling: function(tag) {
          return $(tag).children(0).attr('data-custom')
        }
      }));
      make(function() {
        $search.val(people[0].split('').reverse().join(''));
      })
      assert.lengthOf($content.children(':visible'), 1);
    })

  })

  describe('invert option', function() {

    it('Should invert results', function() {
      jet = new Jets(ext({
        invert: true
      }));
      make(function() {
        $search.val(people[0]);
      })
      assert.lengthOf($content.children(':visible'), 3);
    })

  })

  describe('callSearchManually option', function() {

    it('Should not call search on typing', function() {
      jet = new Jets(ext({
        callSearchManually: true
      }));
      make(function() {
        $search.val(people[0]);
      })
      assert.lengthOf($content.children(':visible'), 5);
    })

    it('Should call search by manual calling .search', function() {
      jet = new Jets(ext({
        callSearchManually: true
      }));
      make(function() {
        $search.val(people[0]);
      })
      jet.search();
      assert.lengthOf($content.children(':visible'), 1);
    })

  })

})