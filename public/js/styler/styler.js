var styler = function () {
	//default settings
	var settings = {
		init: false,
		styleFile: './styleTemplate.jrnl.html',
		selRange: ''
	};
	var initialize = function (params) {
		var sourceContainer = params.sourceContainer;
		var stylePalette = params.stylePalette;
		var styleFile = params.styleFile ? params.styleFile : settings.styleFile;
		if (typeof (rangy) != 'object') {
			alert('Please load "rangy" library');
			return false;
		}
		if (typeof (jQuery) != 'function') {
			alert('Please load "JQuery" library');
			return false;
		}
		if ($(sourceContainer).length != 1) {
			alert('Please provide one element to apply style');
			return false;
		}
		settings.sourceContainer = $(sourceContainer);
		if ($(stylePalette).length != 1) {
			alert('Please provide an element for style palette container');
			return false;
		}
		if ($(stylePalette).find('#stylePalette').length != 1) {
			alert('Please provide an element to load style template');
			return false;
		}
		var status = styler.loadData(styleFile, $(stylePalette).find('#stylePalette'), true);
		if (status.status != 200) {
			alert('Failed to load style file. Please check if the file exists and readable');
			return false;
		}
		// tabindex attribute is important to capture the keydown event. if not present add one
		if (!sourceContainer.attr('tabindex')) {
			sourceContainer.attr('tabindex', 1000);
		}

		styler.initEvent(sourceContainer, stylePalette);
		$('.la-container').css('display', 'none');
		settings.init = true;
	};

	var get = function (key) {
		return settings[key];
	};

	var get = function (key) {
		return settings[key];
	};

	return {
		init: initialize,
		get: get
	};
}();

/**
 * initialise events to detect selection change
 */
(function (styler) {
	styler.initEvent = function (sourceContainer, stylePalette) {
		$(sourceContainer)
			.on('dblclick', function (event) {
				$(event.target).data('double', 2);
				$(event.target).data('mouseup', 1);
				//styler.onSelectionChanged('dblclick');
			})
			.on('mouseup', function (event) {
				// if not left click, do nothing
				if (event.button != 0) {
					$(event.target).data('double', 0);
					return true;
				}
				/**
				 * mechanism to determine if the mouseup was due to single or double mouseclick
				 * in the dblclick event we set data 'double' as '2' and `mouseup` as `1` on the clicked node
				 * then in the mouseup event we do a check for double click.
				 * if its a double click we will get 2 mouseup events
				 * based on the data values and timeout we differentiate single and double mouse click
				 */
				setTimeout(function () {
					var dblclick = parseInt($(event.target).data('double'), 10);
					var mouseup = parseInt($(event.target).data('mouseup'), 10);
					if ((mouseup == 1) && (dblclick > 0)) {
						$(event.target).data('mouseup', 2);
					}
					else if (dblclick > 0) {
						console.log('double click');
						$(event.target).data('double', 0);
						$(event.target).data('mouseup', 0);
						styler.onSelectionChanged('mouseup', 'dblclick');
					} else {
						console.log('single click');
						$(event.target).data('double', 0);
						$(event.target).data('mouseup', 0);
						styler.onSelectionChanged('mouseup', 'click');
					}
				}, 300);
			})
			.on('keyup', function (event) {
				if (/arrow/gi.test(event.key)) {
					styler.onSelectionChanged('keyup', 'arrow');
				}
				if (/page/gi.test(event.key)) {
					styler.onSelectionChanged('keyup', 'page');
				}
			});
		$(stylePalette)
			.on('click', '.styleType', function (e) {
				$(e.target).parent().parent().attr('data-type', $(e.target).attr('data-type'));
			})
			.on('click', '.styleName', function (e) {
				var styleName = $(e.target).text();
				var param = {
					"tagName": $(e.target).attr('data-tag') ? $(e.target).attr('data-tag') : 'p',
					"className": $(e.target).attr('data-style') ? $(e.target).attr('data-style') : 'jrnlSecPara',
					"styleName": styleName.replace(/^[\s\t\r\n]+|[\s\t\r\n]+$/g, ''),
					"styleCount": $(e.target).attr('data-count') ? $(e.target).attr('data-count') : -1, // if a style can be applied only once, then restrict
					"parentClass": $(e.target).attr('data-parent'),
					"keepStyling": $(e.target).attr('data-next') ? 4 : 0
				}

				if ($(e.target).attr('data-type') == 'block') {
					styler.applyParaStyle(param);
				}
				else {
					styler.applyCharStyle(param);
				}
				console.log($(e.target).attr('data-style'));
			})
	};

	styler.onWindowResize = function (sourceContainer) {
		$(sourceContainer).css('height', (window.innerHeight - $(sourceContainer).position().top) + 'px');
	};

	styler.loadData = function (url, container, sync) {
		var sync = sync ? false : true;
		return $.ajax({
			url: url,
			type: 'GET',
			async: sync,
			success: function (data) {
				$(container).html(data);
			},
			error: function (error) {
			}
		});
	};
	return styler;
})(styler || {});

(function (styler) {
	var currSel = 0;

	styler.onSelectionChanged = function (eventName, type) {
		if (!styler.get('init')) {
			alert('Please initialize styler');
			return false;
		}
		console.log(eventName, type);

		currSel = rangy.getSelection();
		// if its a click or doubleclick use rangy expand method to select whole word
		if (type == 'dblclick') {
			currSel.expand("word", {
				wordOptions: {
					wordRegex: /[\(\[\'\‘\"\“]*[a-z0-9]+[\’\”\'\"\)\]\;]*('[a-z0-9]+)*/gi
				}
			});
		}
		var blockNodesLen = styler.getBlockNodes().length;
		console.log('selection changed', type, blockNodesLen, currSel.toString());
		// if the selection contains multiple blocks then do not allow/show character styles/link styles
		$('#stylePaletteHead').removeAttr('data-selection-type');
		if (blockNodesLen > 1) {
			$('#stylePaletteHead').attr('data-selection-type', 'multiple');
		}
		if ((blockNodesLen == 1) && (currSel.toString() == '')) {
			$('#stylePaletteContainer').attr('data-type', 'block');
			$('#stylePaletteHead').attr('data-selection-type', 'block');
		}
		// if there is some text selected, the show/allow character or link styles
		else if (currSel.toString() != '') {
			$('#stylePaletteContainer').attr('data-type', 'inline');
			$('#stylePaletteHead').attr('data-selection-type', 'inline');
		}
		else {
			$('#stylePaletteHead').attr('data-selection-type', 'block');
		}
	}

	/**
	 * if selection contains multiple block level nodes then disable
	 */
	styler.restrictStyles = function () {

	}
	/**
	 * actual style related functions starts from here
	 */
	styler.getBlockNodes = function () {
		var sel = currSel;
		var range = currSel.getRangeAt(0);
		var selectedNodes = [];
		for (var i = 0; i < currSel.rangeCount; ++i) {
			//http://stackoverflow.com/a/4220880/3545167
			//this returns only the block level nodes, which we actually need here
			selectedNodes = range.getNodes([1], styler.isBlockElement);
		}
		//check if the first node is a blockNodeRegex
		//if not get the first possible block node
		if (selectedNodes.length == 0) {
			ancestor = range.commonAncestorContainer;
			var blockElements = styler.isBlockElement(ancestor);
			if (!blockElements) {
				do {
					ancestor = ancestor.parentNode;
					var blockElements = styler.isBlockElement(ancestor);
				} while (!blockElements);
			}
			selectedNodes = [ancestor];
		}
		return selectedNodes;
	};

	/**
	 * check if the given element is a block level element based on the predefined tag names
	 */
	styler.isBlockElement = function (el) {
		return /^(h[1-6]|p|hr|pre|blockquote|ol|ul|li|dl|dt|dd|div|table|caption|colgroup|col|tbody|thead|tfoot|tr|th|td)$/i.test(el.tagName);
	};

	styler.renameNode = function (node, name, className, styleName) {
		var newNodes = [];
		for (var r = 0, rl = node.length; r < rl; r++) {
			var currNode = node[r];
			if (currNode.nodeName == "DIV") return;
			if (typeof (className) != "undefined") {
				currNode.setAttribute('class', className);
			}
			if (typeof (styleName) != "undefined") {
				currNode.setAttribute('data-name', styleName);
			}
			if (currNode.nodeName != name) {
				var newNode = document.createElement(name);
				Array.prototype.slice.call(currNode.attributes).forEach(function (a) {
					newNode.setAttribute(a.name, a.value);
				});
				while (currNode.firstChild) {
					newNode.appendChild(currNode.firstChild);
				}
				currNode.parentNode.replaceChild(newNode, currNode);
				newNodes.push(newNode);
			} else {
				newNodes.push(currNode);
			}
		}
		return newNodes;
	};

	styler.checkUntagged = function (blockNode) {
		$(blockNode).each(function () {
			var untagged = false;
			var clone = $(this).clone(true);
			if ($(this).attr('class') == 'jrnlRefText') {
				clone.find('span[class^="Ref"]').remove();
				var textNodes = textNodesUnder(clone[0]);
				for (var tl = 0, tnLength = textNodes.length; tl < tnLength; tl++) {
					var curNode = textNodes[tl];
					curNode.textContent = curNode.textContent.replace(/([\.\,\;\:\?\"\'\(\[\u0020\u2013\u201C\u201D\u2018\u2019\u0026\-\)\]]+)/ig, '');
					curNode.textContent = curNode.textContent.replace(/(and|doi|in|pp?|eds?|available (to|from))/ig, '');
					curNode.textContent = curNode.textContent.replace(/[\s\u00A0\u0009]+/ig, '');
					if (curNode.textContent != "") {
						untagged = true;
					}
				}
			} else if ($(this).attr('class') == 'jrnlAuthors') {
				clone.find('.jrnlAuthor,.jrnlDegrees,sup,span[class]').remove();
				clone.text(clone.text().replace(/ and[\,\s]+/, ''))
				if (/[a-z]/i.test(clone.text())) {
					untagged = true;
				}
			} else if ($(this).find('.jrnlAuthor').length > 0) {
				//to remove author names, if the current one was author and changed
				$(this).find('.jrnlAuthor,.jrnlDegrees,.jrnlDegree').contents().unwrap();
			}
			if (!untagged) {
				var rid = $(this).attr('data-untag');
				$('#untaggedDivNode [data-untag="' + rid + '"]').remove();
				$(this).removeAttr('data-untag');
			}
		});
	};

	styler.applyParaStyle = function (param) {
		console.log(currSel);
		var tagName = param.tagName;
		var className = param.className;
		var styleName = param.styleName;
		var styleCount = param.styleCount;
		var parentClass = param.parentClass;

		var range = currSel.getRangeAt(0);
		if (currSel.rangeCount) {
			// get All selected elements including text nodes
			var selectedNodes = styler.getBlockNodes();
		}

		// if styleCount is -1 then we need not check
		if (styleCount != -1 && parentClass && selectedNodes.length > 0) {
			var parentNode = selectedNodes[0].closest('.' + parentClass);
			if (parentNode && parentNode.find('.' + className).length >= styleCount) {
				alert('`' + styleName + '` can be applied only ' + styleCount + ' time(s)');
			}
			else {
				var sourceContainer = styler.get('sourceContainer');
				if ($(sourceContainer).find('.' + className).length >= styleCount) {
					alert('`' + styleName + '` can be applied only ' + styleCount + ' time(s)');
					return false;
				}
			}
		}

		var currNodeStyleValue = $(selectedNodes[0]).attr('style');

		selectedNodes = styler.renameNode(selectedNodes, tagName, className, styleName);
		styler.checkUntagged(selectedNodes);
		//to retain the selection
		if (selectedNodes.length > 0) {
			sel = rangy.getSelection();
			range = currSel.getRangeAt(0);
			range.setStart(selectedNodes[0], 1);
			var len = selectedNodes.length - 1;
			range.setEnd(selectedNodes[len], 1);
			currSel.removeAllRanges();
			currSel.addRange(range);
		}
		// next step is to find if the next node is similar to current node visually. if so tag them as same as current
		while (param.keepStyling) {
			if (selectedNodes[0] && param.keepStyling) {
				var nextNode = $(selectedNodes[0]).next();
				if (nextNode) {
					var nextNodeStyleValue = $(nextNode).attr('style');
					if (!nextNodeStyleValue){
						param.keepStyling = 0;
					}
					else if (currNodeStyleValue == nextNodeStyleValue) {
						var range = rangy.createRange();
						range.selectNode($(nextNode)[0]);
						rangy.getSelection().setSingleRange(range);
						currSel = rangy.getSelection();
						param.keepStyling--;
						styler.applyParaStyle(param);
					}
					else {
						param.keepStyling = 0;
					}

				}
				else {
					param.keepStyling = 0;
				}
			}
			else {
				param.keepStyling = 0;
			}
		}
	};

	styler.applyCharStyle = function () {
		var blockNodes = styler.getBlockNodes();
		var blockNodesLen = blockNodes.length;
		if (blockNodesLen == 1)
			console.log(styler.getBlockNodes().length);
	};

	return styler;
})(styler || {});
