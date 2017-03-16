var React           = require('react');
var ButtonGroup     = require('react-bootstrap/lib/ButtonGroup.js');
var Button          = require('react-bootstrap/lib/Button.js');
var MenuItem        = require('react-bootstrap/lib/MenuItem.js');
var DropdownButton  = require('react-bootstrap/lib/DropdownButton.js');
var Promote         = require('../components/promote.jsx');

var SelectedHeaderOptions = React.createClass({
    getInitialState: function() {
        return {
            globalFlairState: true
        }
    },
    toggleFlair: function() { 
        $('iframe').each(function(index, ifr) {
            if(ifr.contentDocument != null) {
                var ifrContents = $(ifr).contents();
                var off = ifrContents.find('.entity-off');
                var on = ifrContents.find('.entity');
                if (this.state.globalFlairState == false) {
                    ifrContents.find('.extras').show();
                    ifrContents.find('.flair-off').hide();
                    off.each(function(index, entity) {
                        $(entity).addClass('entity');
                        $(entity).removeClass('entity-off');
                    });
                } else {
                    ifrContents.find('.extras').hide();
                    ifrContents.find('.flair-off').show();
                    on.each(function(index, entity) {
                        $(entity).addClass('entity-off');
                        $(entity).removeClass('entity');
                    });

                }

            }
        }.bind(this));
        var off = $('.entity-off');
        var on = $('.entity');
        if (!this.state.globalFlairState) {
            this.setState({globalFlairState:true});
            $('.extras').show();
            $('.flair-off').hide();
            off.each(function(index, entity) {
                $(entity).addClass('entity');
                $(entity).removeClass('entity-off');
            });
        } else {
            $('.extras').hide();
            $('.flair-off').show();
            this.setState({globalFlairState:false});
            on.each(function(index, entity) {
                $(entity).addClass('entity-off');
                $(entity).removeClass('entity');
            });
        }
    },
    //All methods containing alert are only used by selected_entry when viewing an alertgroupand interacting with an alert.
    alertOpenSelected: function() {
        var array = []
        $('tr.selected').each(function(index,tr) {
            var id = $(tr).attr('id');
            array.push({id:id,status:'open'});
        }.bind(this));
        var data = JSON.stringify({alerts:array})    
        $.ajax({
            type:'put',
            url: '/scot/api/v2/'+this.props.type + '/' +this.props.id,
            data: data,
            contentType: 'application/json; charset=UTF-8',
            success: function(response){
                console.log('success');
            }.bind(this),
            error: function() {
                console.log('failure');
            }.bind(this)
        })
    },
    alertCloseSelected: function() {
        var time = Math.round(new Date().getTime() / 1000)
        var array = [];
        $('tr.selected').each(function(index,tr) {
            var id = $(tr).attr('id');
            array.push({id:id,status:'closed', closed:time});
        }.bind(this)); 
        var data = JSON.stringify({alerts:array})
        $.ajax({
            type:'put',
            url: '/scot/api/v2/'+this.props.type + '/'+ this.props.id,
            data: data,
            contentType: 'application/json; charset=UTF-8',
            success: function(response){
                console.log('success');
            }.bind(this),
            error: function() {
                console.log('failure');
            }.bind(this)
        })
    },
    alertPromoteSelected: function() {
        var data = JSON.stringify({promote:'new'})
        var array = [];
        $('tr.selected').each(function(index,tr) {
            var id = $(tr).attr('id');
            array.push(id);
        }.bind(this));
        //Start by promoting the first one in the array
        $.ajax({
            type:'put',
            url: '/scot/api/v2/alert/'+array[0],
            data: data,
            contentType: 'application/json; charset=UTF-8',
            success: function(response){
                //With the entry number, promote the others into the existing event
                var promoteTo = {
                    promote:response.pid
                }
                for (var i=1; i < array.length; i++) {
                    $.ajax({
                        type:'put',
                        url: '/scot/api/v2/alert/'+array[i],
                        data: JSON.stringify(promoteTo),
                        contentType: 'application/json; charset=UTF-8',
                        success: function(response){
                            console.log('success');
                        }.bind(this),
                        error: function() {
                            console.log('failure');
                        }.bind(this)
                    })
                }
            }.bind(this),
            error: function() {
                console.log('failure');
            }.bind(this)
        })
        
    },
    /*Future use?
    alertUnpromoteSelected: function() {
        var data = JSON.stringify({unpromote:this.props.aIndex})
        var array = [];
        $('tr.selected').each(function(index,tr) {
            var id = $(tr).attr('id');
            array.push(id);
        }.bind(this));
        for (i=0; i < array.length; i++) {
            $.ajax({
                type:'put',
                url: '/scot/api/v2/alert/'+array[i],
                data: data,
                contentType: 'application/json; charset=UTF-8',
                success: function(response){
                    console.log('success');
                }.bind(this),
                error: function() {
                    console.log('failure');
                }.bind(this)
            })
        }
    },*/
    alertSelectExisting: function() {
        var text = prompt("Please Enter Event ID to promote into")
        var array = [];
        if (text != '' && text != null){
            $('tr.selected').each(function(index,tr) {
                var id = $(tr).attr('id');
                array.push(id);
            }.bind(this));
            for (var i=0; i < array.length; i++) {
                if ($.isNumeric(text)) {
                    var data = {
                        promote:parseInt(text)
                    }
                    $.ajax({
                        type: 'PUT',
                        url: '/scot/api/v2/alert/' + array[i],
                        data: JSON.stringify(data),
                        contentType: 'application/json; charset=UTF-8',
                        success: function(response){
                            if($.isNumeric(text)){
                                window.location = '#/event/' + text
                            }
                        }.bind(this),
                        error: function() {
                            console.log('failure');
                        }.bind(this)
                    })
                } else {
                    prompt("Please use numbers only")
                    this.selectExisting();
                }
            }
        }
    },
    alertExportCSV: function(){
        var keys = []
        $('.alertTableHorizontal').find('th').each(function(key,value){
            var obj = $(value).text();
            keys.push(obj);
        });
        var csv = ''
        $('tr.selected').each(function(x,y) {
            var storearray = []
            $(y).find('td').each(function(x,y) {
                var copy = $(y).clone(false);
                $(copy).find('.extras').remove();
                var value = $(copy).text()
                value = value.replace(/,/g,'|')
                storearray.push(value);
            })
            csv += storearray.join() + '\n'
        });
        var result = keys.join() + "\n"
        csv = result + csv;
        var data_uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
        window.open(data_uri)
    },
    alertDeleteSelected: function(){
        if(confirm("Are you sure you want to Delete? This action can not be undone.")){
            var array = [];
            $('tr.selected').each(function(index,tr) {
                var id = $(tr).attr('id');
                array.push(id);
            }.bind(this));
            for (var i=0; i < array.length; i++) {
                $.ajax({
                    type:'delete',
                    url: '/scot/api/v2/alert/'+array[i],
                    success: function(response){
                        console.log('success');
                    }.bind(this),
                    error: function() {
                        console.log('failure');
                    }.bind(this)
                });
            }        
        }
    },
    componentDidMount: function() {
        //open, close SELECTED alerts
       if (this.props.type == 'alertgroup' || this.props.type == 'alert') { 
            $('#main-detail-container').keydown(function(event){
                if($('input').is(':focus')) {return}
                if (event.keyCode == 79 && (event.ctrlKey != true && event.metaKey != true)) {
                    this.alertOpenSelected();
                }
                if (event.keyCode == 67 && (event.ctrlKey != true && event.metaKey != true)) {
                    this.alertCloseSelected();
                }
            }.bind(this))
       }
    },
    componentWillUnmount: function() {
        if (this.props.type == 'alertgroup' || this.props.type == 'alert') {
            $('#main-detail-container').unbind('keydown');
        }
    },
    guideToggle: function() {
        var entityoffset = {top: 0, left: 0} //set to 0 so it appears in a default location.
        this.props.flairToolbarToggle(this.props.guideID,null,'guide', entityoffset, null)
    },
    createGuide: function() {
       var data = JSON.stringify({subject: 'ENTER A GUIDE NAME',applies_to:[this.props.subjectName],entry:[]})
        $.ajax({
            type: 'POST',
            url: '/scot/api/v2/guide',
            data: data,
            contentType: 'application/json; charset=UTF-8',
        }).success(function(response){
            window.open('/#/guide/' + response.id);        
        }.bind(this)) 
    },
    reparseFlair: function() {
        $.ajax({
            type: 'put',
            url: '/scot/api/v2/'+this.props.type+'/'+this.props.id,
            data: JSON.stringify({parsed:0}),
            contentType: 'application/json; charset=UTF-8',
        }).success(function(response){
            console.log('reparsing started');
        }.bind(this))
    },
    manualUpdate: function() {
        this.props.updated(null,null);
    },
    render: function() { 
        var subjectType = this.props.subjectType;
        var type = this.props.type;
        var id = this.props.id;
        var status = this.props.status;
        if (type != 'alertgroup') {
            var newType = null;
            var showPromote = true;
            if (status != 'promoted') {
                if (type == "alert") {
                    newType = "Event"
                } else if (type == "event") {
                    newType = "Incident"
                } else if (type == "incident" || type == "guide" || type == 'intel' || type == 'signature') {
                    showPromote = false;
                } 
            } else {
                showPromote = false;
            }
            return (
                <div className="entry-header">
                    <Button eventKey="1" bsStyle='success' onClick={this.props.entryToggle} bsSize='xsmall'><i className="fa fa-plus-circle" aria-hidden="true"></i> Add Entry</Button>
                    <Button eventKey="2" onClick={this.props.fileUploadToggle} bsSize='xsmall'><i className="fa fa-upload" aria-hidden="true"></i> Upload File</Button>
                    <Button eventKey="3" onClick={this.toggleFlair} bsSize='xsmall'><i className="fa fa-eye-slash" aria-hidden="true"></i> Toggle Flair</Button>
                    <Button eventKey="4" onClick={this.props.viewedByHistoryToggle} bsSize='xsmall'><img src='/images/clock.png'/> Viewed By History</Button>
                    <Button eventKey="5" onClick={this.props.changeHistoryToggle} bsSize='xsmall'><img src='/images/clock.png'/> {subjectType} History</Button>
                    <Button eventKey="6" onClick={this.props.permissionsToggle} bsSize='xsmall'><i className="fa fa-users" aria-hidden="true"></i> Permissions</Button>
                    <Button eventKey="7" onClick={this.props.entitiesToggle} bsSize='xsmall'><span className='entity'>__</span> View Entities</Button>
                    {type == 'guide' ? <Button eventKey='8' onClick={this.props.guideRedirectToAlertListWithFilter} bsSize='xsmall'><i className="fa fa-table" aria-hidden='true'></i> View Related Alerts</Button> : null}
                    {showPromote ? <Promote type={type} id={id} updated={this.props.updated} /> : null}
                    <Button bsStyle='danger' eventKey="9" onClick={this.props.deleteToggle} bsSize='xsmall'><i className="fa fa-trash" aria-hidden="true"></i> Delete {subjectType}</Button>
                    <Button id='refresh-detail' bsStyle='info' eventKey="10" onClick={this.manualUpdate} bsSize='xsmall' style={{float:'right'}}><i className='fa fa-refresh' aria-hidden='true'></i></Button>
                </div>
            )
        } else {
            if (this.props.aIndex != undefined) {
                return (
                    <div className="entry-header second-menu">
                        <Button eventKey='1' onClick={this.toggleFlair} bsSize='xsmall'><i className="fa fa-eye-slash" aria-hidden="true"></i> Toggle Flair</Button>
                        <Button eventKey="2" onClick={this.reparseFlair} bsSize='xsmall'><i className='fa fa-refresh' aria-hidden='true'></i> Reparse Flair</Button>
                        {this.props.guideID == null ? null : <span>{this.props.guideID != 0 ? <Button eventKey='3' onClick={this.guideToggle} bsSize='xsmall'><img src='/images/guide.png'/> Guide</Button> : <Button eventKey='3' onClick={this.createGuide} bsSize='xsmall'><img src='/images/guide.png'/> Create Guide</Button>}</span>}
                        <Button eventKey='4' onClick={this.props.sourceToggle} bsSize='xsmall'><img src='/images/code.png'/> View Source</Button> 
                        <Button eventKey='5' onClick={this.props.entitiesToggle} bsSize='xsmall'><span className='entity'>__</span> View Entities</Button>
                        <Button eventKey="6" onClick={this.props.viewedByHistoryToggle} bsSize='xsmall'><img src='/images/clock.png'/> Viewed By History</Button>
                        <Button eventKey='7' onClick={this.props.changeHistoryToggle} bsSize='xsmall'><img src='/images/clock.png'/> {subjectType} History</Button>
                        
                        <Button eventKey='8' onClick={this.alertOpenSelected} bsSize='xsmall' bsStyle='danger'><img src='/images/open.png'/> Open Selected</Button>
                        <Button eventKey='9' onClick={this.alertCloseSelected} bsSize='xsmall' bsStyle='success'><i className="fa fa-flag-checkered" aria-hidden="true"></i> Close Selected</Button>
                        <Button eventKey='10' onClick={this.alertPromoteSelected} bsSize='xsmall' bsStyle='warning'><img src='/images/megaphone.png'/> Promote Selected</Button> 
                        <Button eventKey='11' onClick={this.alertSelectExisting} bsSize='xsmall'><img src='/images/megaphone_plus.png' /> Add Selected to <b>Existing Event</b></Button> 
                        <Button eventKey='12' onClick={this.props.entryToggle} bsSize='xsmall'><i className="fa fa-plus-circle" aria-hidden="true"></i> Add Entry</Button>
                        <Button eventKey="13" onClick={this.props.fileUploadToggle} bsSize='xsmall'><i className="fa fa-upload" aria-hidden="true"></i> Upload File</Button>
                        <Button eventKey='14' onClick={this.alertExportCSV} bsSize='xsmall'><img src='/images/csv_text.png'/> Export to CSV</Button>
                        <Button eventKey='15' onClick={this.alertDeleteSelected} bsSize='xsmall' bsStyle='danger'><i className="fa fa-trash" aria-hidden="true"></i> Delete Selected</Button>
                        <Button bsStyle='danger' eventKey="17" onClick={this.props.deleteToggle} bsSize='xsmall'><i className="fa fa-trash" aria-hidden="true"></i> Delete {subjectType}</Button> 
                        <Button bsStyle='info' eventKey="16" onClick={this.manualUpdate} bsSize='xsmall' style={{float:'right'}}><i className='fa fa-refresh' aria-hidden='true'></i></Button>
                    </div>
                )
            } else { 
                return (
                    <div className="entry-header">
                        <Button eventKey='1' onClick={this.toggleFlair} bsSize='xsmall'><i className="fa fa-eye-slash" aria-hidden="true"></i> Toggle Flair</Button>
                        <Button eventKey="2" onClick={this.reparseFlair} bsSize='xsmall'><i className='fa fa-refresh' aria-hidden='true'></i> Reparse Flair</Button>
                        {this.props.guideID == null ? null : <span>{this.props.guideID != 0 ? <Button eventKey='3' onClick={this.guideToggle} bsSize='xsmall'><img src='/images/guide.png'/> Guide</Button> : <Button eventKey='3' onClick={this.createGuide} bsSize='xsmall'><img src='/images/guide.png'/> Create Guide</Button>}</span>}
                        <Button eventKey='4' onClick={this.props.sourceToggle} bsSize='xsmall'><img src='/images/code.png'/> View Source</Button> 
                        <Button eventKey='5' onClick={this.props.entitiesToggle} bsSize='xsmall'><span className='entity'>__</span> View Entities</Button>
                        <Button eventKey="6" onClick={this.props.viewedByHistoryToggle} bsSize='xsmall'><img src='/images/clock.png'/> Viewed By History</Button>
                        <Button eventKey='7' onClick={this.props.changeHistoryToggle} bsSize='xsmall'><img src='/images/clock.png'/> {subjectType} History</Button>
                        <Button bsStyle='danger' eventKey="8" onClick={this.props.deleteToggle} bsSize='xsmall'><i className="fa fa-trash" aria-hidden="true"></i> Delete {subjectType}</Button>
                        <Button bsStyle='info' eventKey="9" onClick={this.manualUpdate} bsSize='xsmall' style={{float:'right'}}><i className='fa fa-refresh' aria-hidden='true'></i></Button>
                    </div>
                )
            }
        }
    }
});

module.exports = SelectedHeaderOptions;
