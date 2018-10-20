/*https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/21963136#21963136*/
function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}
//TODO: test
function getSelectedNodes() {
    var selectedNodes = [];
    var sel = rangy.getSelection();
    for (var i = 0; i < sel.rangeCount; ++i) {
        selectedNodes = selectedNodes.concat(sel.getRangeAt(i).getNodes());
    }
    return selectedNodes;
}

function loadData(url, container) {
    $.get(url, function (data) {
        $(container).html(data);
    });
}

function updateHeight(sourceContainer) {
    if (sourceContainer.length) {
        $(sourceContainer).css('height', (window.innerHeight - $(sourceContainer).position().top) + 'px');
    }
}

window.onload = function () {
    // add event listener to table
    var sourceContainer = $('#sourceContainer');
    if (typeof (styler) != 'object') {
        alert('load styler.js');
        return false;
    }
    var params = {
        'sourceContainer': sourceContainer,
        'stylePalette': $('#stylePaletteContainer'),
        'styleFile': 'public/js/styler/styleTemplate.jrnl.html',
        'msgFile': 'public/js/styler/messages/en.json',
        'patternFile': 'public/js/styler/patterns/en.json'
    }
    styler.init(params);
    updateHeight(sourceContainer);

}
window.onresize = function () {
    updateHeight($('#sourceContainer'));
}

$(document).ready(function () {
    // load html - TODO: this should be change later to a practical method
    loadData('samples/DMP_CIA.S182046_clean.html', $('#sourceContainer'));

    // activate click event for tabs
    $('#rightSidebar').on('click', '.tabsHead', function (e) {
        var tabClass = $(e.target).attr('data-tabs');
        $(this).parent().find('.tabsHead').toggleClass('active');
        $(this).parent().parent().find('.tabsBody').removeClass('active');
        $(this).parent().parent().find('.' + tabClass).addClass('active');
    });
})
