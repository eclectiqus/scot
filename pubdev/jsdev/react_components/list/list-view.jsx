'use strict';


var React                   = require('react')
var SelectedContainer       = require('../detail/selected_container.jsx')
var Store                   = require('../activemq/store.jsx')
var Popover                 = require('react-bootstrap/lib/Popover')
var OverlayTrigger          = require('react-bootstrap/lib/OverlayTrigger')
var ButtonToolbar           = require('react-bootstrap/lib/ButtonToolbar')
var DateRangePicker         = require('../../../node_modules/react-daterange-picker')
var Button                  = require('react-bootstrap/lib/Button')
var SplitButton             = require('react-bootstrap/lib/SplitButton.js');
var DropdownButton          = require('react-bootstrap/lib/DropdownButton.js');
var MenuItem                = require('react-bootstrap/lib/MenuItem.js');
var ListViewHeader          = require('./list-view-header.jsx');
var ListViewData            = require('./list-view-data.jsx');
import ReactTable           from 'react-table';
import tableSettings, { buildTypeColumns, defaultTypeTableSettings } from './tableConfig';
let LoadingContainer        = require('./LoadingContainer/index.jsx').default;
var datasource
var height;
var width;
var listStartX;
var listStartY;
var listStartWidth;
var listStartHeight;
let listQuery;

module.exports = React.createClass({

    getInitialState: function(){
        var type = this.props.type;
        var id = this.props.id;
        let queryType = this.props.type;
        var alertPreSelectedId = null;
        var scrollHeight = $(window).height() - 170 + 'px';
        var scrollWidth  = '650px';
        var columnsDisplay = [];
        var columns = [];
        var columnsClassName = [];
        var showSelectedContainer = false;
        var sort = [{ id:'id', desc: true }];
        var activepage = {page:0, limit:50};
        var filter = [];
        width = 650
        
        columnsDisplay = listColumnsJSON.columnsDisplay[this.props.type];
        columns = listColumnsJSON.columns[this.props.type];
        columnsClassName = listColumnsJSON.columnsClassName[this.props.type];
        
        if (this.props.listViewSort != null) {
            sort = JSON.parse(this.props.listViewSort);
        } 
        if (this.props.listViewPage != null) {
            activepage = JSON.parse(this.props.listViewPage);
        }
        if (this.props.listViewFilter != null) {
            filter = JSON.parse(this.props.listViewFilter);
        }
        if (this.props.type == 'alert') {showSelectedContainer = false; typeCapitalized = 'Alertgroup'; type='alertgroup'; alertPreSelectedId=id;};
        
        if (this.props.type === 'task') { type = 'task'; queryType = this.props.queryType; }

        var typeCapitalized = this.titleCase(this.props.type);
        return {
            splitter: true, 
            selectedColor: '#AEDAFF',
            sourcetags: [], tags: [], startepoch:'', endepoch: '', idtext: '', totalCount: 0, activepage: activepage,
            statustext: '', subjecttext:'', idsarray: [], classname: [' ', ' ',' ', ' '],
            alldetail : true, viewsarrow: [0,0], idarrow: [-1,-1], subjectarrow: [0, 0], statusarrow: [0, 0],
            resize: 'horizontal',createdarrow: [0, 0], sourcearrow:[0, 0],tagsarrow: [0, 0],
            viewstext: '', entriestext: '', scrollheight: scrollHeight, display: 'flex',
            differentviews: '',maxwidth: '915px', maxheight: scrollHeight,  minwidth: '650px',
            suggestiontags: [], suggestionssource: [], sourcetext: '', tagstext: '', scrollwidth: scrollWidth, reload: false, 
            viewfilter: false, viewevent: false, showevent: true, objectarray:[], csv:true,fsearch: '', listViewOrientation: 'landscape-list-view', columns:columns, columnsDisplay:columnsDisplay, columnsClassName:columnsClassName, typeCapitalized: typeCapitalized, type: type, queryType: queryType, id: id, showSelectedContainer: showSelectedContainer, listViewContainerDisplay: null, viewMode:this.props.viewMode, offset: 0, sort: sort, filter: filter, match: null, alertPreSelectedId: alertPreSelectedId, entryid: this.props.id2, listViewKey:1, loading: true, initialAutoScrollToId: false, };
    },

    componentWillMount: function() {
        if (this.props.viewMode == undefined || this.props.viewMode == 'default') {
            this.Landscape();
        } else if (this.props.viewMode == 'landscape') {
            this.Landscape();
        } else if (this.props.viewMode == 'portrait') {
            this.Portrait();
        }
        //If alert id is passed, convert the id to its alertgroup id.
        this.ConvertAlertIdToAlertgroupId(this.props.id) 
        
        //if the type is entry, convert the id and type to the actual type and id
        this.ConvertEntryIdToType( this.props.id );
    },

    componentDidMount: function(){
        var height = this.state.scrollheight
        var sortBy = this.state.sort;
        var filterBy = this.state.filter;
        var pageLimit = this.state.activepage.limit;
        var pageNumber = this.state.activepage.page;
        var idsarray = [];
        var newPage;
        if(this.props.id != undefined){
            if(this.props.id.length > 0){
                array = this.props.id
                //scrolled = $('.container-fluid2').scrollTop()    
                if(this.state.viewMode == 'landscape'){
                    height = '25vh'
                }
            }
        }
        
        var array = []
        var finalarray = [];
        //register for creation
        var storeKey = this.props.type + 'listview';
        Store.storeKey(storeKey)
        Store.addChangeListener(this.reloadactive)
        //List View code
        var  url = '/scot/api/v2/' + this.state.type;
        if (this.props.type == 'alert') {
            url = '/scot/api/v2/alertgroup'
        }

        //get page number
        newPage =  pageNumber * pageLimit
        var data = {limit:pageLimit, offset: newPage}
                       
        //add sort to the data object 
        if ( sortBy != undefined ) { 
            let sortObj = {};
            $.each(sortBy, function(key, value) {
                let sortInt = -1;
                if ( !value.desc ) { sortInt = 1 };
                sortObj[value.id] = sortInt;
            })
            data['sort'] = JSON.stringify( sortObj );
        }
 
        //add filter to the data object
        if (this.state.filter != undefined) {
            $.each(filterBy, function(key,value) {
                if ( value.id == 'source' || value.id == 'tag' ) {
                    let stringArr = [];
                    for ( let each of value.value ) {
                        stringArr.push(each.name);
                    }
                    data[value.id] = JSON.stringify(stringArr);    
                } else if ( value.id == 'created' || value.id == 'updated' ) {
                    let arr = [];
                    arr.push(value.value.start);
                    arr.push(value.value.end);
                    data[value.id] = JSON.stringify(arr);
                } else {
                    data[value.id] = JSON.stringify(value.value);
                }
            })
        }
        
        listQuery = $.ajax({
	        type: 'GET',
	        url: url,
	        data: data,
            traditional:true,
	        success: function(response){
                datasource = response	
                $.each(datasource.records, function(key, value){
                    finalarray[key] = {}
                    $.each(value, function(num, item){
                        if (num == 'sources' || num == 'source'){
                            if (item != undefined) {
                                var sourcearr = item.join(', ')
                                finalarray[key]["source"] = sourcearr;
                            }
                        }
                        else if (num == 'tags' || num == 'tag'){
                            if (item != undefined) {
                                var tagarr = item.join(', ')
                                finalarray[key]["tag"] = tagarr;
                            }
                        }
                        else{
                            finalarray[key][num] = item
                        }
                        if (num == 'id') {
                            Store.storeKey(item)
                            Store.addChangeListener(this.reloadactive)
                            idsarray.push(item);            
                        }
                    }.bind(this))
                    if(key %2 == 0){
                        finalarray[key]["classname"] = 'table-row roweven'
                    }
                    else {
                        finalarray[key]["classname"] = 'table-row rowodd'
                    }
                }.bind(this))
                
                let totalPages = this.getPages(response.totalRecordCount); //get pages for list view

                this.setState({scrollheight:height, objectarray: finalarray, totalCount: response.totalRecordCount, loading:false, idsarray:idsarray, totalPages: totalPages});
                if (this.props.type == 'alert' && this.state.showSelectedContainer == false) {
                    this.setState({showSelectedContainer:false})
                } else if (this.state.id == undefined) {
                    this.setState({showSelectedContainer: false})
                } else {
                    this.setState({showSelectedContainer: true})
                };
                
            }.bind(this),
            error: function(data) {
                if ( !data.statusText == 'abort' ) {
                    this.props.errorToggle('failed to get list data', data)
                }
            }.bind(this)
        })
        
        $('#list-view-container').keydown(function(e){
            if ($('input').is(':focus')) {return};
            if (e.ctrlKey != true && e.metaKey != true) {
                var up = $('#list-view-data-div').find('.list-view-data-div').find('#'+this.state.id).prevAll('.table-row')
                var down = $('#list-view-data-div').find('.list-view-data-div').find('#'+this.state.id).nextAll('.table-row')
                if((e.keyCode == 74 && down.length != 0) || (e.keyCode == 40 && down.length != 0)){
                    var set;
                    set  = down[0].click()
                    if (e.keyCode == 40) {
                        e.preventDefault();
                    }
                }
                else if((e.keyCode == 75 && up.length != 0) || (e.keyCode == 38 && up.length != 0)){
                    var set;
                    set  = up[0].click()
                    if (e.keyCode == 38) {
                        e.preventDefault();
                    }
                } 
            }    
        }.bind(this))
        $(document.body).keydown(function(e) {
            if ($('input').is(':focus')) {return};
            if ($('textarea').is(':focus')) {return};
            if (e.keyCode == 70 && (e.ctrlKey != true && e.metaKey != true)) {
                this.toggleView();
            }
        }.bind(this));
    },
    
    //Callback for AMQ updates
    reloadactive: function(){    
        this.getNewData() 
    },

    render: function() {
        var listViewContainerHeight;
        var showClearFilter = false;
        
        if (this.state.listViewContainerDisplay == null) {
            listViewContainerHeight = null;
        } else {
            listViewContainerHeight = '0px'
        }
        
        if (this.state.id != null && this.state.typeCapitalized != null) {
            document.title = this.state.typeCapitalized.charAt(0) + '-' + this.state.id
        }
        if (checkCookie('listViewFilter'+this.props.type) != null || checkCookie('listViewSort'+this.props.type) != null || checkCookie('listViewPage'+this.props.type) != null) {
            showClearFilter = true
        }

        let columns = buildTypeColumns ( this.props.type );
        
        return (
            <div> 
                {this.state.type != 'entry' ?
                    <div key={this.state.listViewKey} className="allComponents">
                        <div className="black-border-line">
                            <div className='mainview'>
                                <div>
                                    <div className='list-buttons' style={{display: 'inline-flex'}}>
                                        {this.props.notificationSetting == 'on'?
                                            <Button eventKey='1' onClick={this.props.notificationToggle} bsSize='xsmall'>Mute Notifications</Button> :
                                            <Button eventKey='2' onClick={this.props.notificationToggle} bsSize='xsmall'>Turn On Notifications</Button>
                                        }
                                        {this.props.type == 'event' || this.props.type == 'intel' || this.props.type == 'incident' || this.props.type == 'signature' || this.props.type == 'guide' ? <Button onClick={this.createNewThing} eventKey='6' bsSize='xsmall'>Create {this.state.typeCapitalized}</Button> : null}
                                        <Button eventKey='5' bsSize='xsmall' onClick={this.exportCSV}>Export to CSV</Button> 
                                        <Button bsSize='xsmall' onClick={this.toggleView}>Full Screen Toggle (f)</Button>
                                        {showClearFilter ? <Button onClick={this.clearAll} eventKey='3' bsSize='xsmall' bsStyle={'info'}>Clear All Filters</Button> : null}
                                    </div>
                                    <ReactTable
                                        columns = { columns } 
                                        data = { this.state.objectarray }
                                        style= {{
                                            height: this.state.scrollheight 
                                        }}
                                        page = { this.state.activepage.page }
                                        pages = { this.state.totalPages }
                                        defaultPageSize = { 50 }
                                        onPageChange = { this.handlePageChange }
                                        onPageSizeChange = { this.handlePageSizeChange }
                                        pageSize = { this.state.activepage.limit }
                                        onFilteredChange = { this.handleFilter }
                                        filtered = { this.state.filter }
                                        onSortedChange = { this.handleSort }
                                        sorted = { this.state.sort }
                                        manual = { true }
                                        sortable = { true }
                                        filterable = { true }
                                        resizable = { true }
                                        styleName = 'styles.ReactTable'
                                        className = '-striped -highlight'
                                        minRows = { 0 } 
                                        LoadingComponent = { this.CustomTableLoader }
                                        loading = { this.state.loading }  
                                        getTrProps = { this.handleRowSelection }
                                    />
                                    <div onMouseDown={this.dragdiv} className='splitter' style={{display:'block', height:'5px', backgroundColor:'black', borderTop:'1px solid #AAA', borderBottom:'1px solid #AAA', cursor: 'row-resize', overflow:'hidden'}}/>
                                    {this.state.showSelectedContainer ? <SelectedContainer id={this.state.id} type={this.state.queryType} alertPreSelectedId={this.state.alertPreSelectedId} taskid={this.state.entryid} handleFilter={this.handleFilter} errorToggle={this.props.errorToggle} history={this.props.history}/> : null}
                                </div>
                            </div>
                        </div>
                    </div>
                :
                    null
                }
            </div>
        )
    },
    
    CustomTableLoader: function() {
    return (
            <div className={'-loading'+ ( this.state.loading ? ' -active' : '' )}>
                <LoadingContainer loading={this.state.loading} />
            </div>
        )
    },

    AutoScrollToId: function() {
        //auto scrolls to selected id
        if ($('#'+this.state.id).offset() != undefined && $('.list-view-table-data').offset() != undefined) {
            var cParentTop =  $('.list-view-table-data').offset().top;
            var cTop = $('#'+this.state.id).offset().top - cParentTop;
            var cHeight = $('#'+this.state.id).outerHeight(true);
            var windowTop = $('#list-view-data-div').offset().top;
            var visibleHeight = $('#list-view-data-div').height();

            var scrolled = $('#list-view-data-div').scrollTop();
            if (cTop < (scrolled)) {
                $('#list-view-data-div').animate({'scrollTop': cTop-(visibleHeight/2)}, 'fast', '');
            } else if (cTop + cHeight + cParentTop> windowTop + visibleHeight) {
                $('#list-view-data-div').animate({'scrollTop': (cTop + cParentTop) - visibleHeight + scrolled + cHeight}, 'fast', 'swing');
            }
            this.setState({initialAutoScrollToId: true});
        }
    },

    componentDidUpdate: function(prevProps, prevState) {
        //auto scrolls to selected id
        for (var i=0; i < this.state.objectarray.length; i++){          //Iterate through all of the items in the list to verify that the current id still matches the rows in the list. If not, don't scroll
            var idReference = this.state.objectarray[i].id;
            if (this.state.id != null && this.state.id == idReference && this.state.id != prevState.id || this.state.id != null && this.state.id == idReference && prevState.initialAutoScrollToId == false ) {     //Checks that the id is present, is on the screen, and will not be kicked off again if its already been scrolled to before. The || statement handles the initial load since the id hasn't been scrolled to before.
               this.AutoScrollToId(); 
            }
        }
    },

    componentWillReceiveProps: function(nextProps) {
        if ( nextProps.id == undefined ) {
            this.setState({type: nextProps.type, id:null, showSelectedContainer: false, scrollheight: $(window).height() - 170 + 'px'});
        } else if (nextProps.id != this.props.id) {
            if (this.props.type == 'alert') {
                this.ConvertAlertIdToAlertgroupId(nextProps.id);        
                this.ConvertEntryIdToType(nextProps.id);        
                this.setState({ type : nextProps.type, alertPreSelectedId: nextProps.id });    
            } else if ( this.props.type == 'task' ) {
                this.setState({ type: nextProps.type, queryType: nextProps.queryType, id: nextProps.id, entryid: nextProps.id2});
            } else {
                this.setState({type: nextProps.type, id: nextProps.id});
            }        
        }
    },

    ConvertAlertIdToAlertgroupId: function(id) {
        //if the type is alert, convert the id to the alertgroup id
        if (this.props.type == 'alert') {
            $.ajax({
                type: 'get',
                url: 'scot/api/v2/alert/' + id,
                success: function(response1) {
                    var newresponse = response1
                    this.setState({id: newresponse.alertgroup, showSelectedContainer:true})
                }.bind(this),
                error: function(data) {
                    this.props.errorToggle('failed to convert alert id to alertgroup id', data);
                }.bind(this),
            })
        };
    },
    
    ConvertEntryIdToType: function(id) {
    //if the type is alert, convert the id to the alertgroup id
        if (this.props.type == 'entry') {
            $.ajax({
                type: 'get',
                url: 'scot/api/v2/entry/' + id,
                async: false,
                success: function(response) {
                    this.selected( response.target.type, response.target.id, this.props.id );
                    //this.setState({id: response.target.id, type: response.target.type, showSelectedContainer:true});
                
                }.bind(this),
                error: function(data) {
                    this.props.errorToggle('failed to convert alert id to alertgroup id', data);
                }.bind(this),
            })
        };   
    },
    
    //This is used for the dragging portrait and landscape views
    startdrag: function(e){
        e.preventDefault();
        $('iframe').each(function(index,ifr){
            $(ifr).addClass('pointerEventsOff')
        })
        
        this.setState({ scrollheight: listStartHeight + e.clientY - listStartY + 'px' })
    },

    stopdrag: function(e){
        $('iframe').each(function(index,ifr){
            $(ifr).removeClass('pointerEventsOff')
        }) 
        document.onmousemove = null
    },

    dragdiv: function(e){
        var elem = document.getElementsByClassName('ReactTable');
        listStartX = e.clientX;
        listStartY = e.clientY;
        listStartWidth = parseInt(document.defaultView.getComputedStyle(elem[0]).width,10);
        listStartHeight = parseInt(document.defaultView.getComputedStyle(elem[0]).height,10); 
        document.onmousemove = this.startdrag;
        document.onmouseup  = this.stopdrag;
    },

    toggleView: function(){
        if(this.state.id.length != 0 && this.state.showSelectedContainer == true  && this.state.listViewContainerDisplay != 'none' ){
            this.setState({listViewContainerDisplay: 'none', scrollheight:'0px'})
        } else {
            this.setState({listViewContainerDisplay: null, scrollheight:'25vh'})
        }
    },

    Portrait: function(){
        document.onmousemove = null
        document.onmousedown = null
        document.onmouseup = null
        $('.container-fluid2').css('width', '650px')
        width = 650
        $('.splitter').css('width', '5px')
        $('.mainview').show()
        var array = []
        array = ['dates-small', 'status-owner-small', 'module-reporter-small']
                        this.setState({splitter: true, display: 'flex', alldetail: true, scrollheight: $(window).height() - 170 + 'px', maxheight: $(window).height() - 170 + 'px', resize: 'horizontal',differentviews: '',
                        maxwidth: '', minwidth: '',scrollwidth: '650px', sizearray: array})
        this.setState({listViewOrientation: 'portrait-list-view'})
        setCookie('viewMode',"portrait",1000);
    },

    Landscape: function(){
        document.onmousemove = null
        document.onmousedown = null
        document.onmouseup = null
        width = 650
        $('.splitter').css('width', '100%')
        $('.mainview').show()
        this.setState({classname: [' ', ' ', ' ', ' '],splitter: false, display: 'block', maxheight: '', alldetail: true, differentviews: '100%',
        scrollheight: this.state.id != null ? '300px' : $(window).height()  - 170 + 'px', maxwidth: '', minwidth: '',scrollwidth: '100%', resize: 'vertical'})
        this.setState({listViewOrientation: 'landscape-list-view'});
        setCookie('viewMode',"landscape",1000);
    },

    clearAll: function(){
        var newListViewKey = this.state.listViewKey + 1;
        this.setState({listViewKey:newListViewKey, activepage: {page:0}, sort:[{ id:'id', desc: true }], filter: [] });  
        this.getNewData({page:0}, [{ id:'id', desc: true}], {})
        deleteCookie('listViewFilter'+this.props.type) //clear filter cookie
        deleteCookie('listViewSort'+this.props.type) //clear sort cookie
        deleteCookie('listViewPage'+this.props.type) //clear page cookie
    },

    selected: function(type,rowid, subid, taskid){
        if ( taskid == null && subid == null ) {
            //window.history.pushState('Page', 'SCOT', '/#/' + type +'/'+rowid)  
            this.props.history.push( '/' + type + '/' + rowid );
        } else if ( taskid == null && subid != null ) {
            this.props.history.push( '/' + type + '/' + rowid + '/' + subid );
        } else {
            //If a task, swap the rowid and the taskid
            //window.history.pushState('Page', 'SCOT', '/#/' + type + '/' + taskid + '/' + rowid)
            this.props.history.push( '/' + type + '/' + taskid + '/' + rowid + '/'  );
        }
        //scrolled = $('.list-view-data-div').scrollTop()
        if(this.state.display == 'block'){
            this.state.scrollheight = '25vh'
        }
        this.setState({alertPreSelectedId: 0, scrollheight: this.state.scrollheight, showSelectedContainer: true })
    },

    getNewData: function(page, sort, filter){
        this.setState({loading:true}); //display loading opacity
        var sortBy = sort;
        var filterBy = filter;
        var pageLimit;
        var pageNumber;
        var idsarray = this.state.idsarray;
        var newidsarray = [];
        
        //if the type is alert, convert the id to the alertgroup id
        this.ConvertAlertIdToAlertgroupId(this.props.id)        
        
        //if the type is entry, convert the id and type to the actual type and id
        this.ConvertEntryIdToType( this.props.id );       
        
        //defaultpage = page.page
        if (page == undefined) {
            pageNumber = this.state.activepage.page;
            pageLimit = this.state.activepage.limit;
        } else {
            if (page.page == undefined) {
                pageNumber = this.state.activepage.page;
            } else {
                pageNumber = page.page;
            }
            if (page.limit == undefined) {
                pageLimit = this.state.activepage.limit
            } else {
                pageLimit = page.limit;
            }
        }
        var newPage;
        newPage =  pageNumber * pageLimit
        //sort check
        if (sortBy == undefined) {
            sortBy = this.state.sort;
        } 
        //filter check
        if (filterBy == undefined){
            filterBy = this.state.filter;
        }
        var data = {limit: pageLimit, offset: newPage }
        
        //add sort to the data object
        if ( sortBy != undefined ) {
            let sortObj = {};
            $.each(sortBy, function(key, value) {
                let sortInt = -1;
                if ( !value.desc ) { sortInt = 1 };
                sortObj[value.id] = sortInt;
            })
            data['sort'] = JSON.stringify( sortObj );
        }  
        
        //add filter to the data object
        if ( filterBy != undefined ) {
            $.each( filterBy, function(key,value) {
                if ( value.id == 'source' || value.id == 'tag' ) {
                    let stringArr = [];
                    for ( let each of value.value ) {
                        stringArr.push(each.name);
                    }
                    data[value.id] = JSON.stringify(stringArr);
                } else if ( value.id == 'created' || value.id == 'updated' || value.id == 'occurred' ) {
                    let arr = [];
                    arr.push(value.value.start);
                    arr.push(value.value.end);
                    data[value.id] = JSON.stringify(arr);
                } else {
                    data[value.id] = JSON.stringify(value.value);
                }    
            })
        }   

        var newarray = []
        
        if ( this.state.loading == true ) { listQuery.abort(); }
        
        listQuery = $.ajax({
	        type: 'GET',
	        url: '/scot/api/v2/'+this.state.type,
	        data: data,
            traditional: true,
	        success: function(response){
                datasource = response	
                $.each(datasource.records, function(key, value){
                    newarray[key] = {}
                    $.each(value, function(num, item){
                        if (num == 'sources' || num == 'source'){
                            if (item != undefined) {
                                var sourcearr = item.join(', ')
                                newarray[key]["source"] = sourcearr;
                            }
                        }
                        else if (num == 'tags' || num == 'tag'){
                            if (item != undefined) {
                                var tagarr = item.join(', ')
                                newarray[key]["tag"] = tagarr;
                            }
                        } 
                        else{
                            newarray[key][num] = item
                        }
                        if (num == 'id') {
                            var idalreadyadded = false;
                            for (var i=0; i < idsarray.length; i++) {
                                if (item == idsarray[i]) {
                                    idalreadyadded = true;
                                }
                            }
                            if (idalreadyadded == false) {
                                Store.storeKey(item)
                                Store.addChangeListener(this.reloadactive)
                            }
                            newidsarray.push(item);
                        }
                    }.bind(this))
                    if(key %2 == 0){
                        newarray[key]['classname'] = 'table-row roweven'
                    }
                    else {
                        newarray[key]['classname'] = 'table-row rowodd'
                    }
                }.bind(this))
                
                let totalPages = this.getPages(response.totalRecordCount); //get pages for list view
                
                this.setState({totalCount: response.totalRecordCount, activepage: {page:pageNumber, limit:pageLimit}, objectarray: newarray, loading:false, idsarray:newidsarray, totalPages: totalPages})
            }.bind(this),
            error: function(data) {
                if ( !data.statusText == 'abort' ) {
                    this.props.errorToggle('failed to get list data', data); 
                }
            }.bind(this)
        });

    },

    exportCSV: function(){
        var keys = []
        var columns = this.state.columns;
	    $.each(columns, function(key, value){
            keys.push(value);
	    });
	    var csv = ''
    	$('.list-view-table-data').find('.table-row').each(function(key, value){
	        var storearray = []
            $(value).find('td').each(function(x,y) {
                var obj = $(y).text()
		        obj = obj.replace(/,/g,'|')
		        storearray.push(obj)
	    });
	        csv += storearray.join() + '\n'
	    });
        var result = keys.join() + "\n"
	    csv = result + csv;
	    var data_uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
	    window.open(data_uri)		
    },

    handleSort : function(sortArr, clearall){
        var currentSort = this.state.sort;
        let newSortArr = [];
        
        if (clearall === true) {
            this.setState({sort:[{ id:'id' , desc:true }]});
        } else {
            for ( let sortEach of sortArr ) {
                if ( sortEach.id ) {
                    newSortArr.push( sortEach );
                }
            }
        }

        this.setState({sort:newSortArr}); 
        this.getNewData(null, newSortArr, null)   
        var cookieName = 'listViewSort' + this.props.type;
        setCookie(cookieName,JSON.stringify(newSortArr),1000);
    },

    handleFilter: function(filterObj,string,clearall,type){
        var currentFilter = this.state.filter;
        var newFilterArr = [];
        var _type = this.props.type;
        
        if (type != undefined) {
            _type = type;
        }

        if (clearall === true) {
        
            this.setState({filter:newFilterArr})
            return;
        
        } else { 
            
            for ( let filterEach of filterObj ) {
                if ( filterEach.id ) {
                    newFilterArr.push( filterEach );
                }
            }

            this.setState({ filter: newFilterArr });
            
            if (type == this.props.type || type == undefined) {    //Check if the type passed in matches the type displayed. If not, it's updating the filter for a future query in a different type. Undefined implies its the same type, so update 
                this.getNewData({page:0},null,newFilterArr)
            }

            var cookieName = 'listViewFilter' + _type;
            setCookie(cookieName,JSON.stringify(newFilterArr),1000);
        }
    },
    
    titleCase: function(string) {
        var newstring = string.charAt(0).toUpperCase() + string.slice(1)
        return (
            newstring
        )
    },
    
    createNewThing: function(){
        var data;
        if (this.props.type == 'signature') {
            data = JSON.stringify({name:'Name your Signature', status: 'disabled'});   
        } else if ( this.props.type == 'guide' ) { 
            data = JSON.stringify({ subject: 'ENTER A GUIDE NAME', applies_to: ['documentation']}) 
        } else {
            data = JSON.stringify({subject: 'No Subject'});
        }
        $.ajax({
            type: 'POST',
            url: '/scot/api/v2/'+this.props.type,
            data: data,
            success: function(response){
                this.selected(this.props.type, response.id);
            }.bind(this),
            error: function(data) {
                this.props.errorToggle('failed to create new thing', data);
            }.bind(this)
        })
    },

    handlePageChange: function( pageIndex ) {
        this.getNewData({page: pageIndex});
        let cookieName = 'listViewPage' + this.props.type;
        setCookie(cookieName, JSON.stringify({page: pageIndex, limit: this.state.activepage.limit}));
    },

    handlePageSizeChange: function( pageSize, pageIndex ) {
        this.getNewData({limit: pageSize, page: pageIndex});
        let cookieName = 'listViewPage' + this.props.type;
        setCookie(cookieName, JSON.stringify({page: pageIndex, limit: pageSize}));
    },

    getPages: function(count) {
        let totalPages = Math.ceil(( count || 1 ) / this.state.activepage.limit);
        return( totalPages );
    },

    handleRowSelection( state, rowInfo, column, instance ) {
        return {
            onClick: event => {
                if ( this.state.id === rowInfo.row.id ) {
                    return;
                }       

                let scrollheight = this.state.scrollheight;
                if( this.state.display == 'block' ){
                    scrollheight = '25vh';
                }
                
                if ( this.state.type === 'task' ) { 
                    this.props.history.push( '/task/' + rowInfo.row.target_type + '/' + rowInfo.row.target_id + '/' + rowInfo.row.id );
                } else {
                    this.props.history.push( '/' + this.state.type + '/' + rowInfo.row.id );
                }
                this.setState({alertPreSelectedId: 0, scrollheight: scrollheight, showSelectedContainer: true })
                return; 
            },
            className: rowInfo.row.id === parseInt(this.props.id) ? 'selected' : null,
        }
    }
});

