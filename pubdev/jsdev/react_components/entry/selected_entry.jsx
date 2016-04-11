var React               = require('react');
var ReactTime           = require('react-time');
var SplitButton         = require('react-bootstrap/lib/SplitButton.js');
var DropdownButton      = require('react-bootstrap/lib/DropdownButton.js');
var MenuItem            = require('react-bootstrap/lib/MenuItem.js');
var Button              = require('react-bootstrap/lib/Button.js');
var AddEntryModal       = require('../modal/add_entry.jsx');
var DeleteEntry         = require('../modal/delete.jsx').DeleteEntry;
var Summary             = require('../components/summary.jsx');
var Task                = require('../components/task.jsx');
var SelectedPermission  = require('../components/permission.jsx');
var Frame               = require('react-frame');
var Store               = require('../flux/store.jsx');
var AppActions          = require('../flux/actions.jsx');
var AddFlair            = require('../components/add_flair.jsx');
var Flair               = require('../modal/flair_modal.jsx');

var SelectedEntry = React.createClass({
    getInitialState: function() {
        return {
            showEntryData:this.props.showEntryData,
            showEntityData:this.props.showEntityData,
            entryData:this.props.entryData,
            entityData:this.props.entityData,
            key:this.props.id,
            flairToolbar:false,
        }
    },
    componentDidMount: function() {
        if (this.props.type == 'alert' || this.props.type == 'entity') {
            this.headerRequest = $.get('scot/api/v2/' + this.props.type + '/' + this.props.id + '/entry', function(result) {
                var entryResult = result.records;
                this.setState({showEntryData:true, entryData:entryResult})
            }.bind(this));
            this.entityRequest = $.get('scot/api/v2/' + this.props.type + '/' + this.props.id + '/entity', function(result) {
                var entityResult = result.records;
                this.setState({showEntityData:true, entityData:entityResult})
                var waitForEntry = {
                    waitEntry: function() {
                        if(this.state.showEntryData == false){
                            setTimeout(waitForEntry.waitEntry,50);
                        } else {
                            console.log('entries are done')   
                            setTimeout(function(){AddFlair.entityUpdate(entityResult,this.flairToolbarToggle)}.bind(this));
                        }
                    }.bind(this)
                };
                waitForEntry.waitEntry();
            }.bind(this));
            Store.storeKey(this.props.id) //this will be the id of alert or entity
            Store.addChangeListener(this.updatedCB);
        }
    }, 
    updatedCB: function() {
       if (this.props.type == 'alert' || this.props.type == 'entity') {
            this.headerRequest = $.get('scot/api/v2/' + this.props.type + '/' + this.props.id + '/entry', function(result) {
                var entryResult = result.records;
                this.setState({showEntryData:true, entryData:entryResult})
            }.bind(this));
            this.entityRequest = $.get('scot/api/v2/' + this.props.type + '/' + this.props.id + '/entity', function(result) {
                var entityResult = result.records;
                this.setState({showEntityData:true, entityData:entityResult})
                var waitForEntry = {
                    waitEntry: function() {
                        if(this.state.showEntryData == false){
                            setTimeout(waitForEntry.waitEntry,50);
                        } else {
                            console.log('entries are done')
                            setTimeout(function(){AddFlair.entityUpdate(entityResult,this.flairToolbarToggle)}.bind(this));
                        }
                    }.bind(this)
                };
                waitForEntry.waitEntry();
            }.bind(this)); 
        }
    },
    flairToolbarToggle: function(id) {
        if (this.state.flairToolbar == false) {
            this.setState({flairToolbar:true,entityid:id})
        } else {
            this.setState({flairToolbar:false})
        }
    },
    render: function() { 
        var data = this.props.entryData;
        var type = this.props.type;
        var id = this.props.id;
        var showEntryData = this.props.showEntryData;
        var divClass = 'row-fluid entry-wrapper entry-wrapper-main'
        if (type =='alert' || type == 'entity') {
            divClass = 'row-fluid entry-wrapper'
            data = this.state.entryData;
            showEntryData = this.state.showEntryData;
        }
        return (
            <div className={divClass}> 
                {showEntryData ? <EntryIterator data={data} type={type} id={id} /> : null} 
                {this.state.flairToolbar ? <Flair flairToolbarToggle={this.flairToolbarToggle} entityid={this.state.entityid}/> : null}
            </div>       
        );
    }
});

var EntryIterator = React.createClass({
    render: function() {
        var rows = [];
        var data = this.props.data;
        var type = this.props.type;
        var id = this.props.id;  
        data.forEach(function(data) {
            rows.push(<EntryParent key={data.id} items={data} type={type} id={id} />);
        });
        return (
            <div>
                {rows}
            </div>
        )
    }
});

var EntryParent = React.createClass({
    getInitialState: function() {
        return {
            editEntryToolbar:false,
            replyEntryToolbar:false,
            deleteToolbar:false,
            permissionsToolbar:false,
        }
    }, 
    editEntryToggle: function() {
        if (this.state.editEntryToolbar == false) {
            this.setState({editEntryToolbar:true})
        } else {
            this.setState({editEntryToolbar:false})
        }
    },
    replyEntryToggle: function() {
        if (this.state.replyEntryToolbar == false) {
            this.setState({replyEntryToolbar:true})
        } else {
            this.setState({replyEntryToolbar:false})
        }
    },
    deleteToggle: function() {
        if (this.state.deleteToolbar == false) {
            this.setState({deleteToolbar:true})
        } else {
            this.setState({deleteToolbar:false})
        }
    },
    permissionsToggle: function() {
        if (this.state.permissionsToolbar == false) {
            this.setState({permissionsToolbar:true})
        } else {
            this.setState({permissionsToolbar:false})
        }
    },
    render: function() {
        var itemarr = [];
        var subitemarr = [];
        var items = this.props.items;
        var type = this.props.type;
        var id = this.props.id;
        var summary = items.summary;
        var outerClassName = 'row-fluid entry-outer';
        var innerClassName = 'row-fluid entry-header';
        var taskOwner = '';
        if (summary == 1) {
            outerClassName += ' summary_entry';
        }
        if (items.task.status == 'open' || items.task.status == 'assigned') {
            taskOwner = '-- Task Owner ' + items.task.who + ' ';
            outerClassName += ' todo_open_outer';
            innerClassName += ' todo_open';
        } else if (items.task.status == 'closed' && items.task.who != null ) {
            taskOwner = '-- Task Owner ' + items.task.who + ' ';
            outerClassName += ' todo_completed_outer';
            innerClassName += ' todo_completed';
        } else if (items.task.status == 'closed') {
            outerClassName += ' todo_undefined_outer';
            innerClassName += ' todo_undefined';
        }
        itemarr.push(<EntryData id={items.id} key={items.id} subitem = {items} type={type} targetid={id} />);
        for (var prop in items) {
            function childfunc(prop){
                if (prop == "children") {
                    var childobj = items[prop];
                    items[prop].forEach(function(childobj) {
                        subitemarr.push(new Array(<EntryParent items = {childobj} id={id} type={type} />));  
                    });
                }
            }
            childfunc(prop);
        };
        itemarr.push(subitemarr);
        var header1 = '[' + items.id + '] ';
        var header2 = ' by ' + items.owner + ' ' + taskOwner + '(updated on '; 
        var header3 = ')'; 
        var createdTime = items.created;
        var updatedTime = items.updated; 
        return (
            <div> 
                <div className={outerClassName} style={{marginLeft: 'auto', marginRight: 'auto', width:'99.3%'}}>
                    <span className="anchor" id={"/"+ type + '/' + id + '/' + items.id}/>
                    <div className={innerClassName}>
                        <div className="entry-header-inner">[<a style={{color:'black'}} href={"#/"+ type + '/' + id + '/' + items.id}>{items.id}</a>] <ReactTime value={items.created * 1000} format="MM/DD/YYYY hh:mm:ss a" /> by {items.owner} {taskOwner}(updated on <ReactTime value={items.updated * 1000} format="MM/DD/YYYY hh:mm:ss a" />)
                            <span className='pull-right' style={{display:'inline-flex',paddingRight:'3px'}}>
                                {this.state.permissionsToolbar ? <SelectedPermission updateid={id} id={items.id} type={'entry'} permissionData={items} permissionsToggle={this.permissionsToggle} /> : null}
                                <SplitButton bsSize='xsmall' title="Reply" key={items.id} id={'Reply '+items.id} onClick={this.replyEntryToggle} pullRight> 
                                    <MenuItem eventKey='2' onClick={this.deleteToggle}>Delete</MenuItem>
                                    <MenuItem eventKey='3'><Summary type={type} id={id} entryid={items.id} summary={summary} /></MenuItem>
                                    <MenuItem eventKey='4'><Task type={type} id={id} entryid={items.id} /></MenuItem>
                                    <MenuItem eventKey='5' onClick={this.permissionsToggle}>Permissions</MenuItem>
                                </SplitButton>
                                <Button bsSize='xsmall' onClick={this.editEntryToggle}>Edit</Button>
                            </span>
                        </div>
                    </div>
                {itemarr}
                </div> 
                {this.state.editEntryToolbar ? <AddEntryModal type = {this.props.type} title='Edit Entry' header1={header1} header2={header2} header3={header3} createdTime={createdTime} updatedTime={updatedTime} parent={items.parent} targetid={id} type={type} stage = {'Edit'} id={items.id} addedentry={this.editEntryToggle} /> : null}
                {this.state.replyEntryToolbar ? <AddEntryModal title='Reply Entry' stage = {'Reply'} type = {type} header1={header1} header2={header2} header3={header3} createdTime={createdTime} updatedTime={updatedTime} targetid={id} id={items.id} addedentry={this.replyEntryToggle} /> : null}
                {this.state.deleteToolbar ? <DeleteEntry type={type} id={id} deleteToggle={this.deleteToggle} entryid={items.id} /> : null}     
            </div>
        );
    }
});

var EntryData = React.createClass({ 
    getInitialState: function() {
        if (this.props.type == 'alert' || this.props.type == 'entity') {
            return {
                height:'200px',
                entityid:null,
                resize:false,
            }
        } else {
            return {
                height:'1px',
                entityid:null,
                resize:false,
            }
        }
    },
    componentWillReceiveProps: function () {
        if (this.state.resize == false) {
            this.setState({resize:true})
        }
    },
    onLoad: function() {
        if (this.props.type != 'alert' && this.props.type !='entity') {
            if (this.state.height == '1px') {
                setTimeout(function() {
                    document.getElementById('iframe_'+this.props.id).contentWindow.requestAnimationFrame( function() {
                        var newheight; 
                        newheight = document.getElementById('iframe_'+this.props.id).contentWindow.document.body.scrollHeight;
                        newheight = newheight + 2; //adding 2 px for Firefox so it doesn't make a scroll bar
                        newheight = newheight + 'px';
                        this.setState({height:newheight});
                        this.setState({resize:false})
                    }.bind(this))
                }.bind(this)); 
            } else if (this.state.resize == true) {
                setTimeout(function() {
                    document.getElementById('iframe_'+this.props.id).contentWindow.requestAnimationFrame( function() {
                        var newheight; 
                        newheight = document.getElementById('iframe_'+this.props.id).contentWindow.document.body.scrollHeight;
                        newheight = newheight + 'px';
                        this.setState({height:newheight});
                        this.setState({resize:false})
                    }.bind(this))
                }.bind(this)); 
            }
        }
    },
    render: function() {
        var rawMarkup = this.props.subitem.body_flair;
        if (this.props.subitem.body_flair == '') {
            rawMarkup = this.props.subitem.body;
        }
        var id = this.props.id;
        //Lazy Loading Flair here as other components, namely Flair that need to access the parent component here "SelectedEntry" as it can not be accessed due to a cyclic dependency loop between Flair and SelectedEntry. Lazy loading solves this issue. This problem should go away upon upgrading everything to ES6 and using imports/exports. 
        //var Flair = require('../modal/flair_modal.jsx');
        return (
            <div className={'row-fluid entry-body'}>
                <div className={'row-fluid entry-body-inner'} style={{marginLeft: 'auto', marginRight: 'auto', width:'99.3%'}}>
                    <Frame frameBorder={'0'} id={'iframe_' + id} onload={this.onLoad()} sandbox={'allow-popups allow-same-origin '} styleSheets={['/css/sandbox.css']} style={{width:'100%',height:this.state.height}}>
                    <div dangerouslySetInnerHTML={{ __html: rawMarkup}}/>
                    </Frame>
                </div>
            </div>
        )
    }
});

module.exports = SelectedEntry
