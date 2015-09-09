(function ($)
{
    "use strict";

    /**
     * Default Configuration
     *
     * @type {{tagClass: tagClass, itemValue: itemValue, itemText: itemText, itemTitle: itemTitle, freeInput: boolean, addOnBlur: boolean, maxTags: undefined, maxChars: undefined, confirmKeys: number[], onTagExists: onTagExists, trimValue: boolean, allowDuplicates: boolean}}
     */
    var defaultOptions = {
        tagClass        : tagClass,
        itemValue       : itemValue,
        itemText        : itemText,
        itemTitle       : itemTitle,
        freeInput       : true,
        addOnBlur       : true,
        maxTags         : undefined,
        maxChars        : undefined,
        confirmKeys     : [13, 44],
        onTagExists     : onTagExists,
        trimValue       : true,
        allowDuplicates : false
    };

    function tagClass(item)
    {
        return 'badge';
    }

    function itemValue(item)
    {
        return item ? item.toString() : item;
    }

    function itemText(item)
    {
        return this.itemValue(item);
    }

    function itemTitle(item)
    {
        return null;
    }

    function onTagExists(item, $tag)
    {
        $tag.hide().fadeIn();
    }

    /**
     * Constructor function
     *
     * @param element
     * @param options
     * @constructor
     */
    function TagsMaterialize(element, options)
    {
        this.itemsArray = [];

        this.$element = $(element);
        this.$element.hide();

        this.objectItems     = options && options.itemValue;
        this.placeholderText = element.hasAttribute('placeholder') ? this.$element.attr('placeholder') : '';
        this.inputSize       = Math.max(1, this.placeholderText.length);

        this.$container = $('<div class="materialize-tags"></div>');
        this.$input     = $('<input type="text" class="n-tag"  placeholder="' + this.placeholderText + '"/>').appendTo(this.$container);
        this.$label     = this.$element.parent().find('label');

        this.$element.before(this.$container);
        this.build(options);

        this.$label.on('click', function ()
        {
            $(this).addClass('active');
            $(this).next('.materialize-tags').find('input.n-tag').focus();
        });

        this.$input.on('focus', function ()
        {
            var label = $(this).parents('.materialize-tags').parent().find('label');
            $(this).parents('.materialize-tags').addClass('active');

            if (!label.hasClass('active'))
            {
                label.addClass('active');
            }
        }).on('focusout', function ()
        {
            var parentContainer = $(this).parents('.materialize-tags'),
                tags            = parentContainer.find('span.tag');
            parentContainer.removeClass('active');
            // Verify if is empty and remove "active" class from label
            if (tags.length == 0)
            {
                parentContainer.parent().find('label').removeClass('active');
            }
        });
    }

    TagsMaterialize.prototype = {
        constructor : TagsMaterialize,

        /**
         * Adds the given item as a new tag. Pass true to dontPushVal to prevent
         * updating the elements val()
         *
         * @param item
         * @param dontPushVal
         * @param options
         */
        add : function (item, dontPushVal, options)
        {
            var self = this;

            if (self.options.maxTags && self.itemsArray.length >= self.options.maxTags)
            {
                return;
            }

            // Ignore false values, except false
            if (item !== false && !item)
            {
                return;
            }

            // Trim value
            if (typeof item === "string" && self.options.trimValue)
            {
                item = $.trim(item);
            }

            // Throw an error when trying to add an object while the itemValue option was not set
            if (typeof item === "object" && !self.objectItems)
            {
                throw("Can't add objects when itemValue option is not set");
            }

            // Ignore strings only contain whitespace
            if (item.toString().match(/^\s*$/))
            {
                return;
            }

            if (typeof item === "string" && this.$element[0].tagName === 'INPUT')
            {
                var items = item.split(',');
                if (items.length > 1)
                {
                    for (var i = 0; i < items.length; i++)
                    {
                        this.add(items[i], true);
                    }

                    if (!dontPushVal)
                    {
                        self.pushVal();
                    }
                    return;
                }
            }

            var itemValue = self.options.itemValue(item),
                itemText  = self.options.itemText(item),
                tagClass  = self.options.tagClass(item),
                itemTitle = self.options.itemTitle(item);

            // Ignore items all ready added
            var existing = $.grep(self.itemsArray, function (item) { return self.options.itemValue(item) === itemValue; })[0];
            if (existing && !self.options.allowDuplicates)
            {
                // Invoke onTagExists
                if (self.options.onTagExists)
                {
                    var $existingTag = $(".tag", self.$container).filter(function () { return $(this).data("item") === existing; });
                    self.options.onTagExists(item, $existingTag);
                }
                return;
            }

            // if length greater than limit
            if (self.items().toString().length + item.length + 1 > self.options.maxInputLength)
            {
                return;
            }

            // raise beforeItemAdd arg
            var beforeItemAddEvent = $.Event('beforeItemAdd', {item : item, cancel : false, options : options});
            self.$element.trigger(beforeItemAddEvent);
            if (beforeItemAddEvent.cancel)
            {
                return;
            }

            // register item in internal array and map
            self.itemsArray.push(item);

            // add a tag element
            var $tag = $('<span class="tag ' + htmlEncode(tagClass) + (itemTitle !== null ? ('" title="' + itemTitle) : '') + '">' + htmlEncode(itemText) + '<span class="mdi-content-clear right" data-role="remove"></span></span>');
            $tag.data('item', item);
            self.findInputWrapper().before($tag);
            $tag.after(' ');

            if (!dontPushVal)
            {
                self.pushVal();
            }

            // Add class when reached maxTags
            if (self.options.maxTags === self.itemsArray.length || self.items().toString().length === self.options.maxInputLength)
            {
                self.$container.addClass('materialize-tags-max');
            }

            self.$element.trigger($.Event('itemAdded', {item : item, options : options}));
        },

        /**
         * Removes the given item. Pass true to dontPushVal to prevent updating the
         * elements val()
         *
         * @param item
         * @param dontPushVal
         * @param options
         */
        remove : function (item, dontPushVal, options)
        {
            var self = this;

            if (self.objectItems)
            {
                if (typeof item === "object")
                {
                    item = $.grep(self.itemsArray, function (other) { return self.options.itemValue(other) == self.options.itemValue(item); });
                }
                else
                {
                    item = $.grep(self.itemsArray, function (other) { return self.options.itemValue(other) == item; });
                }

                item = item[item.length - 1];
            }

            if (item)
            {
                var beforeItemRemoveEvent = $.Event('beforeItemRemove', {
                    item    : item,
                    cancel  : false,
                    options : options
                });
                self.$element.trigger(beforeItemRemoveEvent);
                if (beforeItemRemoveEvent.cancel)
                {
                    return;
                }

                $('.tag', self.$container).filter(function () { return $(this).data('item') === item; }).remove();

                if ($.inArray(item, self.itemsArray) !== -1)
                {
                    self.itemsArray.splice($.inArray(item, self.itemsArray), 1);
                }
            }

            if (!dontPushVal)
            {
                self.pushVal();
            }

            // Remove class when reached maxTags
            if (self.options.maxTags > self.itemsArray.length)
            {
                self.$container.removeClass('materialize-tags-max');
            }

            self.$element.trigger($.Event('itemRemoved', {item : item, options : options}));
        },

        /**
         * Removes all items
         */
        removeAll : function ()
        {
            var self = this;

            $('.tag', self.$container).remove();

            while (self.itemsArray.length > 0)
            {
                self.itemsArray.pop();
            }

            self.pushVal();
        },

        /**
         * Refreshes the tags so they match the text/value of their corresponding
         * item.
         */
        refresh : function ()
        {
            var self = this;
            $('.tag', self.$container).each(function ()
            {
                var $tag        = $(this),
                    item        = $tag.data('item'),
                    itemValue   = self.options.itemValue(item),
                    itemText    = self.options.itemText(item),
                    tagClass    = self.options.tagClass(item);

                // Update tag's class and inner text
                $tag.attr('class', null);
                $tag.addClass('tag ' + htmlEncode(tagClass));
                $tag.contents().filter(function ()
                {
                    return this.nodeType == 3;
                })[0].nodeValue = htmlEncode(itemText);

            });
        },

        /**
         * Returns the items added as tags
         */
        items : function ()
        {
            return this.itemsArray;
        },

        /**
         * Assembly value by retrieving the value of each item, and set it on the
         * element.
         */
        pushVal : function ()
        {
            var self = this,
                val  = $.map(self.items(), function (item)
                {
                    return self.options.itemValue(item).toString();
                });

            self.$element.val(val, true).trigger('change');
        },

        /**
         * Initializes the tags input behaviour on the element
         *
         * @param options
         */
        build : function (options)
        {
            var self = this;

            self.options = $.extend({}, defaultOptions, options);
            // When itemValue is set, freeInput should always be false
            if (self.objectItems)
            {
                self.options.freeInput = false;
            }

            makeOptionItemFunction(self.options, 'itemValue');
            makeOptionItemFunction(self.options, 'itemText');
            makeOptionFunction(self.options, 'tagClass');

            // Typeahead.js
            if (self.options.typeaheadjs)
            {
                var typeaheadConfig   = null;
                var typeaheadDatasets = {};

                // Determine if main configurations were passed or simply a dataset
                var typeaheadjs = self.options.typeaheadjs;
                if ($.isArray(typeaheadjs))
                {
                    typeaheadConfig   = typeaheadjs[0];
                    typeaheadDatasets = typeaheadjs[1];
                }
                else
                {
                    typeaheadDatasets = typeaheadjs;
                }

                self.$input.typeahead(typeaheadConfig, typeaheadDatasets).on('typeahead:selected', $.proxy(function (obj, datum)
                {
                    if (typeaheadDatasets.valueKey)
                    {
                        self.add(datum[typeaheadDatasets.valueKey]);
                    }
                    else
                    {
                        self.add(datum);
                    }
                    self.$input.typeahead('val', '');
                }, self));
            }

            self.$container.on('click', $.proxy(function (event)
            {
                if (!self.$element.attr('disabled'))
                {
                    self.$input.removeAttr('disabled');
                }
                self.$input.focus();
            }, self));

            if (self.options.addOnBlur && self.options.freeInput)
            {
                self.$input.on('focusout', $.proxy(function (event)
                {
                    // HACK: only process on focusout when no typeahead opened, to
                    //       avoid adding the typeahead text as tag
                    if ($('.typeahead, .twitter-typeahead', self.$container).length === 0)
                    {
                        self.add(self.$input.val());
                        self.$input.val('');
                    }
                }, self));
            }

            self.$container.on('keydown', 'input', $.proxy(function (event)
            {
                var $input        = $(event.target),
                    $inputWrapper = self.findInputWrapper();

                if (self.$element.attr('disabled'))
                {
                    self.$input.attr('disabled', 'disabled');
                    return;
                }

                switch (event.which)
                {
                    // BACKSPACE
                    case 8:
                        if (doGetCaretPosition($input[0]) === 0)
                        {
                            var prev = $inputWrapper.prev();
                            if (prev)
                            {
                                self.remove(prev.data('item'));
                            }
                        }
                        break;

                    // DELETE
                    case 46:
                        if (doGetCaretPosition($input[0]) === 0)
                        {
                            var next = $inputWrapper.next();
                            if (next)
                            {
                                self.remove(next.data('item'));
                            }
                        }
                        break;

                    // LEFT ARROW
                    case 37:
                        // Try to move the input before the previous tag
                        var $prevTag = $inputWrapper.prev();
                        if ($input.val().length === 0 && $prevTag[0])
                        {
                            $prevTag.before($inputWrapper);
                            $input.focus();
                        }
                        break;
                    // RIGHT ARROW
                    case 39:
                        // Try to move the input after the next tag
                        var $nextTag = $inputWrapper.next();
                        if ($input.val().length === 0 && $nextTag[0])
                        {
                            $nextTag.after($inputWrapper);
                            $input.focus();
                        }
                        break;
                    default:
                    // ignore
                }

                // Reset internal input's size
                var textLength = $input.val().length,
                    wordSpace  = Math.ceil(textLength / 5),
                    size       = textLength + wordSpace + 1;
                $input.attr('size', Math.max(this.inputSize, $input.val().length));
            }, self));

            self.$container.on('keypress', 'input', $.proxy(function (event)
            {
                var $input = $(event.target);

                if (self.$element.attr('disabled'))
                {
                    self.$input.attr('disabled', 'disabled');
                    return;
                }

                var text             = $input.val(),
                    maxLengthReached = self.options.maxChars && text.length >= self.options.maxChars;
                if (self.options.freeInput && (keyCombinationInList(event, self.options.confirmKeys) || maxLengthReached))
                {
                    self.add(maxLengthReached ? text.substr(0, self.options.maxChars) : text);
                    $input.val('');
                    event.preventDefault();
                }

                // Reset internal input's size
                var textLength = $input.val().length,
                    wordSpace  = Math.ceil(textLength / 5),
                    size       = textLength + wordSpace + 1;
                $input.attr('size', Math.max(this.inputSize, $input.val().length));
            }, self));

            // Remove icon clicked
            self.$container.on('click', '[data-role=remove]', $.proxy(function (event)
            {
                if (self.$element.attr('disabled'))
                {
                    return;
                }
                self.remove($(event.target).closest('.tag').data('item'));
            }, self));

            // Only add existing value as tags when using strings as tags
            if (self.options.itemValue === defaultOptions.itemValue)
            {
                if (self.$element[0].tagName === 'INPUT')
                {
                    self.add(self.$element.val());
                }
            }
        },

        /**
         * Removes all materialtags behaviour and unregsiter all event handlers
         */
        destroy : function ()
        {
            var self = this;

            // Unbind events
            self.$container.off('keypress', 'input');
            self.$container.off('click', '[role=remove]');

            self.$container.remove();
            self.$element.removeData('materialtags');
            self.$element.show();
        },

        /**
         * Sets focus on the materialtags
         */
        focus : function ()
        {
            this.$input.focus();
        },

        /**
         * Returns the internal input element
         */
        input : function ()
        {
            return this.$input;
        },

        /**
         * Returns the element which is wrapped around the internal input. This
         * is normally the $container, but typeahead.js moves the $input element.
         */
        findInputWrapper : function ()
        {
            var elt       = this.$input[0],
                container = this.$container[0];
            while (elt && elt.parentNode !== container)
            {
                elt = elt.parentNode;
            }

            return $(elt);
        }
    };

    /**
     * Register JQuery plugin
     *
     * @param arg1
     * @param arg2
     * @param arg3
     * @returns {Array}
     */
    $.fn.materialtags = function (arg1, arg2, arg3)
    {
        var results = [];

        this.each(function ()
        {
            var materialtags = $(this).data('materialtags');
            // Initialize a new material tags input
            if (!materialtags)
            {
                materialtags = new TagsMaterialize(this, arg1);
                $(this).data('materialtags', materialtags);
                results.push(materialtags);

                // Init tags from $(this).val()
                $(this).val($(this).val());
            }
            else if (!arg1 && !arg2)
            {
                // materialtags already exists
                // no function, trying to init
                results.push(materialtags);
            }
            else if (materialtags[arg1] !== undefined)
            {
                // Invoke function on existing tags input
                if (materialtags[arg1].length === 3 && arg3 !== undefined)
                {
                    var retVal = materialtags[arg1](arg2, null, arg3);
                }
                else
                {
                    var retVal = materialtags[arg1](arg2);
                }
                if (retVal !== undefined)
                {
                    results.push(retVal);
                }
            }
        });

        if (typeof arg1 == 'string')
        {
            // Return the results from the invoked function calls
            return results.length > 1 ? results : results[0];
        }
        else
        {
            return results;
        }
    };

    $.fn.materialtags.Constructor = TagsMaterialize;

    /**
     * Most options support both a string or number as well as a function as
     * option value. This function makes sure that the option with the given
     * key in the given options is wrapped in a function
     *
     * @param options
     * @param key
     */
    function makeOptionItemFunction(options, key)
    {
        if (typeof options[key] !== 'function')
        {
            var propertyName = options[key];
            options[key]     = function (item) { return item[propertyName]; };
        }
    }

    function makeOptionFunction(options, key)
    {
        if (typeof options[key] !== 'function')
        {
            var value    = options[key];
            options[key] = function () { return value; };
        }
    }

    /**
     * HtmlEncodes the given value
     */
    var htmlEncodeContainer = $('<div />');

    function htmlEncode(value)
    {
        if (value)
        {
            return htmlEncodeContainer.text(value).html();
        }
        else
        {
            return '';
        }
    }

    /**
     * Returns the position of the caret in the given input field
     * http://flightschool.acylt.com/devnotes/caret-position-woes/
     *
     * @param oField
     * @returns {number}
     */
    function doGetCaretPosition(oField)
    {
        var iCaretPos = 0;
        if (document.selection)
        {
            oField.focus();
            var oSel  = document.selection.createRange();
            oSel.moveStart('character', -oField.value.length);
            iCaretPos = oSel.text.length;
        }
        else if (oField.selectionStart || oField.selectionStart == '0')
        {
            iCaretPos = oField.selectionStart;
        }
        return (iCaretPos);
    }

    /**
     * Returns boolean indicates whether user has pressed an expected key combination.
     * http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
     * [13, {which: 188, shiftKey: true}]
     *
     * @param keyPressEvent
     * @param lookupList
     * @returns {boolean}
     */
    function keyCombinationInList(keyPressEvent, lookupList)
    {
        var found = false;
        $.each(lookupList, function (index, keyCombination)
        {
            if (typeof (keyCombination) === 'number' && keyPressEvent.which === keyCombination)
            {
                found = true;
                return false;
            }

            if (keyPressEvent.which === keyCombination.which)
            {
                var alt   = !keyCombination.hasOwnProperty('altKey') || keyPressEvent.altKey === keyCombination.altKey,
                    shift = !keyCombination.hasOwnProperty('shiftKey') || keyPressEvent.shiftKey === keyCombination.shiftKey,
                    ctrl  = !keyCombination.hasOwnProperty('ctrlKey') || keyPressEvent.ctrlKey === keyCombination.ctrlKey;
                if (alt && shift && ctrl)
                {
                    found = true;
                    return false;
                }
            }
        });

        return found;
    }

    /**
     * Initialize materialtags behaviour on inputs which have
     * data-role=materialtags
     */
    $(function ()
    {
        $("input[data-role=materialtags]").materialtags();
    });
})(window.jQuery);