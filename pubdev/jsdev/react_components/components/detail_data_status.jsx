var React                   = require('react');
var ButtonToolbar           = require('react-bootstrap/lib/ButtonToolbar');
var OverlayTrigger          = require('react-bootstrap/lib/OverlayTrigger');
var MenuItem                = require('react-bootstrap/lib/MenuItem');
var DropdownButton          = require('react-bootstrap/lib/DropdownButton');
var Popover                 = require('react-bootstrap/lib/Popover');
var Link                    = require('react-router-dom').Link;

var DetailDataStatus = React.createClass({
    getInitialState: function() {
        return {
            key: this.props.id
        }
    },
    componentDidMount: function() {
        //Adds open/close hot keys for alertgroup
        if (this.props.type == 'alertgroup') {
            $('#landscape-list-view').keydown(function(event){
                //prevent from working when in input
                if ($('input').is(':focus')) {return};
                //check for character "o" for 79 or "c" for 67
                if (this.props.status != 'promoted') {
                    if (event.keyCode == 79 && (event.ctrlKey != true && event.metaKey != true)) {
                        this.statusAjax('open');
                    } else if (event.keyCode == 67 && (event.ctrlKey != true && event.metaKey != true)) {
                        this.statusAjax('closed');
                    }
                }
            }.bind(this))
        }
    },
    componentWillUnmount: function() {
        $('#landscape-list-view').unbind('keydown');
    },
    /*eventStatusToggle: function () {
        if (this.props.status == 'open') {
            this.statusAjax('closed');
        } else if (this.props.status == 'closed') {
            this.statusAjax('open');
        }
    },*/
    trackAll: function() {
        this.statusAjax('tracked');
    },
    untrackAll: function() {
        this.statusAjax('untracked');
    },
    closeAll: function() {
        this.statusAjax('closed');
    },
    openAll: function() {
        this.statusAjax('open');
    },
    enableAll: function() {
        this.statusAjax('enabled');
    },
    disableAll: function() {
        this.statusAjax('disabled');
    },
    statusAjax: function(newStatus) {
        console.log(newStatus);
        var json = {'status':newStatus};
        $.ajax({
            type: 'put',
            url: 'scot/api/v2/' + this.props.type + '/' + this.props.id,
            data: JSON.stringify(json),
            contentType: 'application/json; charset=UTF-8',
            success: function(data) {
                console.log('success status change to: ' + data);
            }.bind(this),
            error: function() {
                this.props.errorToggle('Failed to change status');
            }.bind(this)
        });
    },
    render: function() {
        var buttonStyle = '';
        var open = '';
        var closed = '';
        var promoted = '';
        var title = '';
        var classStatus = '';
        var href;
        if (this.props.status == 'open' || this.props.status == 'disabled' || this.props.status == 'untracked') {
    buttonStyle = 'danger';
            classStatus = 'alertgroup_open'
        } else if (this.props.status == 'closed' || this.props.status == 'enabled' || this.props.status == 'tracked') {
            buttonStyle = 'success';
            classStatus = 'alertgroup_closed'
        } else if (this.props.status == 'promoted') {
            buttonStyle = 'default'
            classStatus = 'alertgroup_promoted'
        };

        if (this.props.type == 'alertgroup') {
            open = this.props.data.open_count;
            closed = this.props.data.closed_count;
            promoted = this.props.data.promoted_count;
            title = open + ' / ' + closed + ' / ' + promoted;
        }

        if (this.props.type == 'event') {
            href = '/incident/' + this.props.data.promotion_id;
        } else if (this.props.type == 'intel') {
            href = '/event/' + this.props.data.promotion_id;
        }

        if (this.props.type == 'guide' || this.props.type == 'intel') {
            return(<div/>)
        } else if (this.props.type == 'alertgroup') {
            return (
                <ButtonToolbar>
                    <OverlayTrigger placement='top' overlay={<Popover id={this.props.id}>open/closed/promoted alerts</Popover>}>
                        <DropdownButton bsSize='xsmall' bsStyle={buttonStyle} title={title} id="dropdown" className={classStatus}>
                            <MenuItem eventKey='1' onClick={this.openAll} bsSize='xsmall'><b>Open</b> All Alerts</MenuItem>
                            <MenuItem eventKey='2' onClick={this.closeAll}><b>Close</b> All Alerts</MenuItem>
                        </DropdownButton>
                    </OverlayTrigger>
                </ButtonToolbar>
            )
        } else if (this.props.type == 'incident') {
            return (
                <DropdownButton bsSize='xsmall' bsStyle={buttonStyle} id="event_status" className={classStatus} style={{fontSize: '14px'}} title={this.props.status}>
                    <MenuItem eventKey='1' onClick={this.openAll}>Open Incident</MenuItem>
                    <MenuItem eventKey='2' onClick={this.closeAll}>Close Incident</MenuItem>
                </DropdownButton>
           )
        } else if (this.props.type == 'signature') {
            return (
                <DropdownButton bsSize='xsmall' bsStyle={buttonStyle} id="event_status" className={classStatus} style={{fontSize: '14px'}} title={this.props.status}>
                    <MenuItem eventKey='1' onClick={this.enableAll}>Enable Signature</MenuItem>
                    <MenuItem eventKey='2' onClick={this.disableAll}>Disable Signature</MenuItem>
                </DropdownButton>
            )
        } else if (this.props.type == 'entity') {
            return (
                <DropdownButton bsSize='xsmall' bsStyle={buttonStyle} id="event_status" className={classStatus} style={{fontSize: '14px'}} title={this.props.status}>
                    <MenuItem eventKey='1' onClick={this.trackAll}>Track</MenuItem>
                    <MenuItem eventKey='2' onClick={this.untrackAll}>Untracked</MenuItem>
                </DropdownButton>
            )
        } else {
            return (
                <div>
                    {this.props.status == 'promoted' ? <Link to={href} role='button' className={'btn btn-warning'}>{this.props.status}</Link>:
                        <DropdownButton bsSize='xsmall' bsStyle={buttonStyle} id="event_status" className={classStatus} style={{fontSize: '14px'}} title={this.props.status}>
                            <MenuItem eventKey='1' onClick={this.openAll}>Open</MenuItem>
                            <MenuItem eventKey='2' onClick={this.closeAll}>Close</MenuItem>
                        </DropdownButton>
                    }
                </div>
            )
        }
    }
});

module.exports = DetailDataStatus;
