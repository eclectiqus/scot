var React               = require('react')
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
                        React.createElement('a',   {style: {width: '1200px'},href: '/#/'+type+'/' + id, className: 'column title'},         sourceid + ' ' + body + ' ' + owner + ' ' + typeid)))))) : null
        )
    }
}

var Search = React.createClass({
    getInitialState: function() {
        return {
            showSearchToolbar: false,
            searchResults: null,
            entityHeight: '60vh',
        }
    },	
    doSearch: function(string) {
        $.ajax({
            type: 'get',
            url: '/scot/api/v2/esearch',
            data: {qstring:string.target.value},
        }).success(function(response){
            this.setState({results:response.records, showSearchToolbar:true})
        }.bind(this))
    },
    handleEnterKey: function(e) {
        if (e.key == 'Enter') {
            this.doSearch(e);
        }
    },
    render: function(){
        var tableRows = [] ;
        if (this.state.results != undefined) {
            for (var i=0; i < this.state.results.length; i++) {
                tableRows.push(<SearchDataEachRows dataOne={this.state.results[i]} />);
            }
        }
        return (
            <div>
                <input className='esearch-query' style={{marginTop:'3px',padding:'10px 20px', backgroundColor: 'white', color:'black', float:'right', borderRadius:'50px',position:'relative'}} placeholder={'Search...'} onBlur={this.doSearch} onKeyPress={this.handleEnterKey}/>
                {this.state.showSearchToolbar ? 
                    <Draggable handle="#handle1" onMouseDown={this.moveDivInit}>
                        <div id="dragme1" className='box react-draggable searchPopUp' style={{height:this.state.entityHeight,maxWidth:'80vw', maxHeight:'75vh', display:'flex', flexFlow:'column', right:'0px',top:'70px'}}>
                            <div id='search_container' style={{height: '100%', display:'flex', flexFlow:'column'}}>
                                <div id='handle1' style={{width:'100%',background:'#7a8092', color:'white', fontWeight:'900', fontSize: 'large', textAlign:'center', cursor:'move',flex: '0 1 auto'}}><div><span className='pull-left' style={{paddingLeft:'5px'}}><i className="fa fa-arrows" aria-hidden="true"/></span><span className='pull-right' style={{cursor:'pointer',paddingRight:'5px'}}><i className="fa fa-times" onClick={this.close}/></span></div></div>
                                <div style={{display:'flex', flexFlow:'row', overflowY:'auto'}}>
                                    <div id='container1' style={{overflowY:'auto'}}>
                                        <SearchDataEachHeader />
                                        <div style={{display:'flex',flexFlow:'column'}}>
                                            {tableRows}
                                        </div>
                                    </div>
                                    <div id='sidebar' onMouseDown={this.initDrag} style={{flex:'0 1 auto', height: '100%', backgroundColor: 'black', borderTop: '2px solid black', borderBottom: '2px solid black', cursor: 'nwse-resize', overflow: 'hidden', width:'5px'}}/>
                                </div>
                            </div>
                            <div id='footer' onMouseDown={this.initDrag} style={{display: 'block', height: '5px', backgroundColor: 'black', borderTop: '2px solid black', borderBottom: '2px solid black', cursor: 'nwse-resize', overflow: 'hidden'}}>
                            </div>
                        </div>
                    </Draggable>
                :
                null} 
            </div>
        )
	},
    close: function(){
        this.setState({showSearchToolbar:false});    
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
    /* var elem1 = document.getElementById('handle1')
    elem1.style.width = (startWidth + e.clientX - startX) + 'px';
    var elem2 = document.getElementById('container1')
    elem2.style.width = (startWidth + e.clientX - startX) + 'px';
    elem2.style.height = (startHeight + e.clientY - startY - 147) + 'px';   
    $('#dragme1').each(function(x, y){
        var height = elem.style.height.replace('px', '')
        $(y).find('.is-numbered').css('width', elem.style.width)
        $(y).find('.sk-hits-list').css({'overflow': 'auto', 'height': height - 185 + 'px'}) 
    })*/
    },
    stopDrag: function(e) {
        document.documentElement.removeEventListener('mousemove', this.doDrag, false);    document.documentElement.removeEventListener('mouseup', this.stopDrag, false);
        this.allowiFrameMouseEvent();
    }
})

var SearchDataEachHeader = React.createClass({
    render: function() {
        return (
            <div className="table-row header" style={{color:'black'}}>
                <div style={{flexGrow:1, display:'flex'}}>
                    <div style={{width:'95px', textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        ID
                    </div>
                    <div style={{width:'95px', textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        Type
                    </div>
                    <div style={{width:'95px', textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        Score
                    </div>
                    <div style={{width:'95px', textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        Snippet
                    </div>
                </div>
            </div>
        )
    }
});

var SearchDataEachRows = React.createClass({
    render: function() {
        var type = this.props.dataOne.type;
        var id = this.props.dataOne.id;
        var score = this.props.dataOne.score;
        var snippet = this.props.dataOne.snippet;
        var href = '/#/'+type+'/'+id;
        return (
            <div style={{display:'inline-flex'}}>
                <div style={{display:'flex'}}>
                    <a href={href} style={{width:'95px', textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{id}</a>
                </div>
                <div style={{display:'flex'}}>
                    <a href={href} style={{width:'95px', textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{type}</a>
                </div>
                <div style={{display:'flex'}}>
                    <a href={href} style={{width:'95px', textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{score}</a>
                </div>
                <div style={{display:'flex', overflowX:'hidden',wordWrap:'break-word'}}>
                    <a href={href} style={{textAlign:'left', overflow:'hidden', textOverflow:'ellipsis'}}>{snippet}</a>
                </div>
            </div>
        )
    }
})

module.exports = Search
