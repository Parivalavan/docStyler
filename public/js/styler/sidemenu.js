var sidemenu = function () {
    var initialize = function(focusNode){
        console.log('focusnode', $(focusNode).text());
    };
    var destroy = function(){

    };
    return {
        init: initialize,
        destroy: destroy
    };
}();

(function (sidemenu) {
	return sidemenu;
})(sidemenu || {});