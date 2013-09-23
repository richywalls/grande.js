function getFocusNode() {
  return window.getSelection().focusNode;
}

function preprocessKeyDown(event) {
  var parentParagraph;
  if (event.keyCode === 13 && (parentParagraph = getParentWithTag(window.getSelection().anchorNode, "p"))) {
    // Stop enters from creating another <p> after a <hr> on enter
    if (parentParagraph.previousSibling && parentParagraph.previousSibling.nodeName === "HR" && !parentParagraph.textContent.length) {
      event.preventDefault();
    }
  }
}

function triggerNodeAnalysis(event) {
  var sel = window.getSelection(),
    anchorNode,
    parentParagraph;

  if (event.keyCode === 13) {

    // Enters should replace it's parent <div> with a <p>
    if (sel.anchorNode.nodeName === "DIV") {
      toggleFormatBlock("p");
    }

    parentParagraph = getParentWithTag(sel.anchorNode, "p");

    if (parentParagraph) {
      insertHorizontalRule(parentParagraph);
    }
  }
}

function insertHorizontalRule(parentParagraph) {
  var prevSibling,
    prevPrevSibling,
    hr;

  prevSibling = parentParagraph.previousSibling;
  prevPrevSibling = prevSibling;

  while (prevPrevSibling = prevPrevSibling.previousSibling) {
    if (prevPrevSibling.nodeType != Node.TEXT_NODE) break;
  }

  if (prevSibling.nodeName === "P" && !prevSibling.textContent.length && prevPrevSibling.nodeName !== "HR") {
    hr = document.createElement("hr");
    hr.contentEditable = false;
    parentParagraph.parentNode.replaceChild(hr, prevSibling);
  }
}

function getTextProp(el) {
  var textProp;

  if (el.nodeType === Node.TEXT_NODE) {
    textProp = "data";
  } else if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
    textProp = "textContent";
  } else {
    textProp = "innerText";
  }

  return textProp;
}

function insertListOnSelection(sel, textProp, listType) {
  var execListCommand = listType === "ol" ? "insertOrderedList" : "insertUnorderedList",
    nodeOffset = listType === "ol" ? 3 : 2;

  document.execCommand(execListCommand);
  sel.anchorNode[textProp] = sel.anchorNode[textProp].substring(nodeOffset);

  return getParentWithTag(sel.anchorNode, listType);
}

function triggerTextParse(event) {
  var sel = window.getSelection(),
    textProp,
    subject,
    insertedNode,
    unwrap,
    node,
    parent,
    range;

  // FF will return sel.anchorNode to be the parentNode when the triggered keyCode is 13
  if (!sel.isCollapsed || !sel.anchorNode || sel.anchorNode.nodeName === "ARTICLE") {
    return;
  }

  textProp = getTextProp(sel.anchorNode);
  subject = sel.anchorNode[textProp];

  if (subject.match(/^-\s/) && sel.anchorNode.parentNode.nodeName !== "LI") {
    insertedNode = insertListOnSelection(sel, textProp, "ul");
  }

  if (subject.match(/^1\.\s/) && sel.anchorNode.parentNode.nodeName !== "LI") {
    insertedNode = insertListOnSelection(sel, textProp, "ol");
  }

  unwrap = insertedNode &&
    ["ul", "ol"].indexOf(insertedNode.nodeName.toLocaleLowerCase()) >= 0 &&
    ["p", "div"].indexOf(insertedNode.parentNode.nodeName.toLocaleLowerCase()) >= 0;

  if (unwrap) {
    node = sel.anchorNode;
    parent = insertedNode.parentNode;
    parent.parentNode.insertBefore(insertedNode, parent);
    parent.parentNode.removeChild(parent);
    moveCursorToBeginningOfSelection(sel, node);
  }
}

function moveCursorToBeginningOfSelection(selection, node) {
  range = document.createRange();
  range.setStart(node, 0);
  range.setEnd(node, 0);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getParent(node, condition, returnCallback) {
  while (node.parentNode) {
    if (condition(node)) {
      return returnCallback(node);
    }
    node = node.parentNode;
  }
}

function getParentWithTag(node, nodeType) {
  console.log('getParentWithTag');
  var checkNodeType = function(node) {
    return node.nodeName.toLowerCase() === nodeType;
  },
    returnNode = function(node) {
      return node;
    };

  return getParent(node, checkNodeType, returnNode);
}

function hasParentWithTag(node, nodeType) {
  return !!getParentWithTag(node, nodeType);
}


function getParentHref(node) {
  var checkHref = function(node) {
    return typeof node.href !== "undefined";
  },
    returnHref = function(node) {
      return node.href;
    };

  return getParent(node, checkHref, returnHref);
}


function toggleFormatBlock(tag) {
  if (hasParentWithTag(window.getSelection().focusNode, tag)) {
    document.execCommand("formatBlock", false, "p");
    document.execCommand("outdent");
  } else {
    document.execCommand("formatBlock", false, tag);
  }
}

angular.module('project', []).
directive('grande', function($compile) {
  // Runs during compile
  return {
    // name: '',
    // priority: 1,
    // terminal: true,
    scope: {}, // {} = isolate, true = child, false/undefined = no change
    // cont­rol­ler: function($scope, $element, $attrs, $transclue) {},
    // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
    restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
    // template: '<article ng-transclude></article><br>test</br>',
    // template: '',
    // templateUrl: '',
    // replace: true,
    // restrict: 'E',
    //transclude: true,
    // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
    controller: function($scope) {
      $scope.test = 'demo';
      $scope.$watch('visible', function(value) {
        console.log('menu visible: ' + value);
        if (value) {
          var clientRectBounds = document.getSelection().getRangeAt(0).getBoundingClientRect();
          $scope.refresh();
          $scope.textMenu.css('top', (clientRectBounds.top - 5 + window.pageYOffset) + 'px');
          $scope.textMenu.css('left', ((clientRectBounds.left + clientRectBounds.right) / 2) + 'px');
        } else {
          $scope.textMenu.css('top', '-999px');
          $scope.textMenu.css('left', '-999px');
        }
      });
      $scope.refresh = function() {
        var focusNode = window.getSelection().focusNode;
        if (focusNode) {
          for (index in $scope.menuItems) {
            $scope.menuItems[index].active = false;
          }
          while (focusNode.parentNode) {
            focusNode = focusNode.parentNode;
            for (index in $scope.menuItems) {
              console.log(focusNode.nodeName, index);
              if ($scope.menuItems[index].nodeName === focusNode.nodeName)
                $scope.menuItems[index].active = true;
            }
          }
        }
      };
    },
    link: function(scope, iElm, iAttrs, controller) {
      function triggerTextSelection() {
        //is collapse true when no text selection
        if (document.getSelection().isCollapsed) {
          scope.$apply(function() {
            console.log('triggerTextSelection', scope.visible);
            scope.visible = false;
          });
        } else {
          //TODO: false then true so can reposition text, do reposition function..
          scope.$apply(function() {
            scope.visible = false;
          });
          scope.$apply(function() {
            console.log('triggerTextSelection');
            scope.visible = true;
          });
        }
      }
      scope.isurl = false;
      scope.toggleUrl = function() {
        scope.textMenu.css('top', '150px');
        scope.textMenu.css('left', '150px');
        //scope.isurl = !scope.isurl;
      };
      scope.menuItems = {
        bold: {
          nodeName: 'B',
          text: 'B',
          active: false,
          class: 'bold',
          toggle: function($event) {
            $event.stopPropagation();
            console.log('bold-toggle');
            var sel = window.getSelection(),
              selNode = sel.anchorNode;
            document.execCommand('bold', false);
            this.active = !this.active;
          }
        },
        italic: {
          nodeName: 'I',
          text: 'I',
          active: false,
          class: 'italic',
          toggle: function() {
            document.execCommand('italic', false);
            console.log('toggleItalic');
            this.active = !this.active;
          }
        },
        header1: {
          nodeName: 'H1',
          text: 'h1',
          active: false,
          class: '--',
          toggle: function() {
            toggleFormatBlock('h1');
            console.log('toggleH1');
            this.active = !this.active;
          }
        },
        header2: {
          nodeName: 'H2',
          text: 'h2',
          active: false,
          class: '--',
          toggle: function() {
            toggleFormatBlock('h2');
            console.log('toggleH2');
            this.active = !this.active;
          }
        },
        quote: {
          nodeName: 'quote',
          text: '&rdquo;',
          active: false,
          class: '--',
          toggle: function() {
            toggleFormatBlock('blockquote');
            //document.execCommand('blockquote', false);
            console.log('toggle Quote');
            this.active = !this.active;
          }
        }
      };
      scope.textMenu = angular.element("<div class='text-menu' ng-show='visible'><div class='options' ng-class=\"{'url-mode':isurl}\"><span class='no-overflow'>");
      var inputs = angular.element("<span class='ui-inputs'>");
      scope.textMenu.children().children().append(inputs);
      var stop = function(event) {
        event.stopPropagation()
      }
      for (menu in scope.menuItems) {
        var m = scope.menuItems[menu],
          button = angular.element("<button class='" + menu + "' ng-click='menuItems." + menu + ".toggle($event)' ng-class=\"{'active':menuItems." + menu + ".active}\">" + m.text + "</button>");
        button.bind('mousedown', stop);
        button.bind('mouseup', stop);
        inputs.append(button);
        console.log(menu);
      }
      inputs.append("<button class='url useicons' ng-click='toggleUrl()'>&#xe001;</button>");
      scope.urlInput = angular.element("<input class='url-input' type='text' placeholder='Paste or type a link' ng-blur='triggerUrlBlur()' ng-keydown='triggerUrlSet()'/>");
      inputs.append(scope.urlInput);
      iElm.after(scope.textMenu);
      var test = angular.element('<pre>visible: {{visible}}</pre>');
      $compile(test)(scope);
      iElm.after(test);
      $compile(scope.textMenu)(scope);

      var node;
      //if mouse up and down are in the same
      document.onmousedown = function(event) {
        console.log('document.onmouswdown');
        scope.$apply(function() {
          scope.visible = false;
        });
      };
      document.onmouseup = function(event) {
        console.log('document.onmouseup');
        scope.$apply(function() {
          scope.visible = false;
        });
      };

      //TODO
      document.onkeydown = function(event) {
        console.log('document.onkeydown');
        preprocessKeyDown(event);
      }

      iElm.bind('keyup', function(event) {
        var sel = window.getSelection();
        console.log('element.keyup', sel);
        // FF will return sel.anchorNode to be the parentNode when the triggered keyCode is 13
        if (sel.anchorNode && sel.anchorNode.nodeName !== "ARTICLE") {
          triggerNodeAnalysis(event);

          if (sel.isCollapsed) {
            triggerTextParse(event);
          }
        }
      });

      // Handle window resize events
      document.onresize = triggerTextSelection;

      scope.triggerUrlBlur = function() {
        console.log('TODO:triggerUrlBlur');
      }
      scope.triggerUrlSet = function() {
        console.log('TODO:triggerUrlSet');
      }
      //scope.urlInput.bind('onblur',triggerUrlBlur);
      //scope.urlInput.bind('onkeydown', triggerUrlSet);

      iElm.attr('contentEditable', true);
      iElm.bind('mousedown', function(event) {
        event.stopPropagation();
        console.log('doc mouse down');
        triggerTextSelection()
      });
      iElm.bind('mouseup', function(event) {
        event.stopPropagation();
        console.log('doc mouse up');
        triggerTextSelection()
      });
      iElm.bind('keyup', triggerTextSelection);



      //grande.bind(document.querySelectorAll("article"), null, scope);
    }
  };
});


/*(function() {
  var EDGE = -999;

  var root = this, // Root object, this is going to be the window for now
    document = this.document, // Safely store a document here for us to use
    textMenu,
    optionsNode,
    previouslySelectedText,

    tagClassMap = {
      "b": "bold",
      "i": "italic",
      "h1": "header1",
      "h2": "header2",
      "a": "url",
      "blockquote": "quote"
    };

  function triggerTextStyling(node) {
    var className = node.className,
      sel = window.getSelection(),
      selNode = sel.anchorNode,
      tagClass,
      reTag;

    for (var tag in tagClassMap) {
      tagClass = tagClassMap[tag];
      reTag = new RegExp(tagClass);

      if (reTag.test(className)) {
        switch (tag) {
          case "b":
            if (selNode && !hasParentWithTag(selNode, "h1") && !hasParentWithTag(selNode, "h2")) {
              document.execCommand(tagClass, false);
            }
            return;
          case "i":
            document.execCommand(tagClass, false);
            return;

          case "h1":
          case "h2":
          case "h3":
          case "blockquote":
            toggleFormatBlock(tag);
            return;

          case "a":
            toggleUrlInput();
            optionsNode.className = "options url-mode";
            return;
        }
      }
    }

    triggerTextSelection();
  }

  function triggerUrlBlur(event) {
    var url = urlInput.value;

    optionsNode.className = "options";
    window.getSelection().addRange(previouslySelectedText);

    document.execCommand("unlink", false);

    if (url === "") {
      return false;
    }

    if (!url.match("^(http://|https://|mailto:)")) {
      url = "http://" + url;
    }

    document.execCommand("createLink", false, url);

    urlInput.value = "";
  }

  function triggerUrlSet(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      event.stopPropagation();

      urlInput.blur();
    }
  }

  function toggleUrlInput() {
    setTimeout(function() {
      var url = getParentHref(getFocusNode());

      if (typeof url !== "undefined") {
        urlInput.value = url;
      } else {
        document.execCommand("createLink", false, "/");
      }

      previouslySelectedText = window.getSelection().getRangeAt(0);

      urlInput.focus();
    }, 150);
  }
}).call(this);*/