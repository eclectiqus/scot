var React               = require('react')
var SearchkitProvider   = require('../../../node_modules/searchkit').SearchkitProvider;
var SearchkitManager    = require('../../../node_modules/searchkit').SearchkitManager;
var SearchBox           = require('../../../node_modules/searchkit').SearchBox;
var Hits                = require('../../../node_modules/searchkit').Hits;
var FilteredQuery       = require('../../../node_modules/searchkit').FilteredQuery;
var TermQuery           = require('../../../node_modules/searchkit').TermQuery;
var BoolShould          = require('../../../node_modules/searchkit').BoolShould;
var LayoutBody          = require('../../../node_modules/searchkit').LayoutBody;
var LayoutResults       = require('../../../node_modules/searchkit').LayoutResults;
var Pagination          = require('../../../node_modules/searchkit').Pagination;
const searchkit         = new SearchkitManager("/scot/api/v2/search/")
var Draggable           = require('react-draggable');
var type = ''
var id = 0
var sourceid = ''
var body = ''
var owner = ''
var typeid = ''
class Results extends React.Component{
    render() {
        if(this.props.result._type == 'entry'){
            type = this.props.result._source.target.type
            id   = this.props.result._source.target.id
            if(type == 'alert'){
                type  = 'alert'
                id    = this.props.result._source.target.id
            }
        }
        else if(this.props.result._type == 'alert'){
            type    = 'alert'
            id      = this.props.result._source.id 
        }
        else {
            id      = this.props.result._id
            type    = this.props.result._type
        }
        if(this.props.result._source.id != undefined){
            sourceid = this.props.result._source.id
        }
        if(this.props.result._source.body_plain != undefined){
            body = this.props.result._source.body_plain
        }
        if(this.props.result._source.owner != undefined){
            owner = this.props.result._source.owner
        }
        if(this.props.result._source.type != undefined){
            typeid = this.props.result._source.type
        }
        return (
            searchboxtext ? 
            React.createElement('div', null,
                React.createElement('div', {style: {display: 'inline-flex'}},
                        React.createElement("div", {className: "wrapper attributes "},
                        React.createElement('div', {className: 'wrapper status-owner-severity'},
                        React.createElement('div', {className: 'wrapper status-owner status-owner-wide'},
                        React.createElement('a',   {href: '/#/'+type+'/' + id, className: 'column owner'}, id))),
                        React.createElement('div', {className: 'wrapper status-owner-severity'},
                        React.createElement('div', {className: 'wrapper status-owner status-owner-wide'},
                        React.createElement('a',   {href: '/#/'+type+'/' + id, className: 'column owner'}, type))),
                        React.createElement('div', {className: 'wrapper title-comment-module-reporter'},
                        React.createElement('div', {className: 'wrapper title-comment'},
                        React.createElement('a',   {style: {width: '1200px'},href: '/#/'+type+'/' + id, className: 'column title'}, sourceid + ' ' + body + ' ' + owner + ' ' + typeid)))))) : null
    )
    }
}

var Search = React.createClass({
	render: function(){
        return (
                React.createElement(SearchkitProvider, {searchkit: searchkit},
                    React.createElement('div', {className: 'search'},
                    React.createElement('div', {className: 'search_query'},
                        React.createElement(SearchBox, {autofocus: true, searchOnChange: true})
                            ),
                React.createElement(Draggable, {handle: '#handle1' ,onMouseDown:this.moveDivInit},
                React.createElement("div", {style: {transform: 'translate(117px, 49px)', 'background-color': '#FFF'},id: "dragme1", className: "box react-draggable searchPopUp"},
                    React.createElement("div", {className: 'search_results', id: "search_container", style: {height: '100%', flexFlow: 'column', display: 'none'}},
                        React.createElement("div", {id: "handle1", style: {width:'100%',background:'#7A8092', color:'white', fontWeight:'900', fontSize: 'large', textAlign:'center', cursor:'move',flex: '0 1 auto'}}, React.createElement("div", null, React.createElement("span", {className: "pull-left", style: {paddingLeft:'5px'}}, React.createElement("i", {className: "fa fa-arrows", ariaHidden: "true"})), React.createElement("span", {className: "pull-right", style: {cursor:'pointer',paddingRight:'5px'}}, React.createElement("i", {className: "fa fa-times", onClick: this.close})))),
                        React.createElement("div", {style: {flex: '0 1 auto',marginLeft: '10px'}},
                            React.createElement("h3", {id: "myModalLabel", style: {color: 'black'}}, "Search Results")
                        ),
                        React.createElement("div", {style: {overflow:'auto',flex:'1 1 auto'}},
                        React.createElement("div", {className: "container-fluid2", id: 'container1', style: {/*'max-width': '915px',*//*'min-width': '650px',*/ width: '100%', 'max-height': '100%', 'margin-left': '0px',height: '100%', 'overflow-y': 'auto', 'overflow-x' : 'hidden','padding-left':'5px'}},
                    React.createElement("div", {className: "table-row header ", style: {color: 'black'}},
                        React.createElement("div", {className: "wrapper attributes "},                        
                        React.createElement('div', {className: 'wrapper status-owner-severity'},
                        React.createElement('div', {className: 'wrapper status-owner status-owner-wide'},
                        React.createElement('div', {className: 'column owner'}, 'ID'))),

                        React.createElement('div', {className: 'wrapper status-owner-severity'},
                        React.createElement('div', {className: 'wrapper status-owner status-owner-wide'},
                        React.createElement('div', {className: 'column owner'}, 'Type'))),

                        React.createElement('div', {className: 'wrapper title-comment-module-reporter'},
                        React.createElement('div', {className: 'wrapper title-comment'},
                        React.createElement('div', {className: 'column title'}, 'Snippet(s)')))
                            )), 
                            React.createElement(Hits, {hitsPerPage: 10, itemComponent: Results, mod: 'sk-hits-list', highlightFields:['id']})),
                            React.createElement(Pagination, {showNumbers: true})),
                        React.createElement("div", {onMouseDown: this.initDrag, id: "footer", style: {display: 'block', height: '5px', backgroundColor: 'black', borderTop: '2px solid black', borderBottom: '2px solid black', cursor: 'nwse-resize', overflow: 'hidden'}}
                        )
                    )
                )))))
	},
    close: function(){
        $('.search_results').css('display', 'none')
        $('#dragme1').css('display', 'none') 
    },
    moveDivInit: function(e) {
        document.documentElement.addEventListener('mouseup', this.moveDivStop,false);
        this.blockiFrameMouseEvent();
    },
    moveDivStop: function(e) {
        document.documentElement.removeEventListener('mouseup', this.moveDivStop, false);
        this.allowiFrameMouseEvent();
    },
    blockiFrameMouseEvent: function() {
        $('iframe').each(function(index,ifr){
            $(ifr).addClass('pointerEventsOff')
        })
    },
    allowiFrameMouseEvent: function() {
        $('iframe').each(function(index,ifr){
            $(ifr).removeClass('pointerEventsOff')
        })
    },
    initDrag: function(e) {
        var elem = document.getElementById('dragme1');
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(elem).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(elem).height, 10);
        document.documentElement.addEventListener('mousemove', this.doDrag, false);
        document.documentElement.addEventListener('mouseup', this.stopDrag, false);
        this.blockiFrameMouseEvent();
    },
    doDrag: function(e) {
    var elem = document.getElementById('dragme1')
    elem.style.width = (startWidth + e.clientX - startX) + 'px';
    elem.style.height = (startHeight + e.clientY - startY) + 'px';
     var elem1 = document.getElementById('handle1')
    elem1.style.width = (startWidth + e.clientX - startX) + 'px';
    var elem2 = document.getElementById('container1')
    elem2.style.width = (startWidth + e.clientX - startX) + 'px';
    elem2.style.height = (startHeight + e.clientY - startY - 147) + 'px';   
    },
    stopDrag: function(e) {
        document.documentElement.removeEventListener('mousemove', this.doDrag, false);    document.documentElement.removeEventListener('mouseup', this.stopDrag, false);
        this.allowiFrameMouseEvent();
    }
})


module.exports = Search
