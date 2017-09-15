var React               = require('react');
var Modal               = require('react-modal');
var Button              = require('react-bootstrap/lib/Button');

const customStyles = {
    content : {
        top     : '50%',
        left    : '50%',
        right   : 'auto',
        bottom  : 'auto',
        marginRight: '-50%',
        transform:  'translate(-50%, -50%)'
    }
}
var Task = React.createClass({
    getInitialState: function () {
        return {
            key:this.props.id,
            whoami: undefined,
        }
    },

    componentDidMount: function() {
        var whoami = getSessionStorage('whoami');
        this.setState({whoami:whoami});
    },

    makeTask: function () {   
        var json = {'make_task':1}
        $.ajax({
            type: 'put',
            url: 'scot/api/v2/entry/' + this.props.entryid,
            data: JSON.stringify(json),
            contentType: 'application/json; charset=UTF-8',
            success: function(data) {
                console.log('success: ' + data);
            }.bind(this),
            error: function(data) {
                this.props.errorToggle('Failed to close task', data);
            }.bind(this)
        }); 
    },
    closeTask: function() {
        var json = {'close_task':1}
        $.ajax({
            type: 'put',
            url: 'scot/api/v2/entry/' + this.props.entryid,
            data: JSON.stringify(json),
            contentType: 'application/json; charset=UTF-8',
            success: function(data) {
                console.log('success: ' + data);
            }.bind(this),
            error: function(data) {
                this.props.errorToggle('Failed to close task', data);
            }.bind(this)
        });
    },
    takeTask: function() {
        var json = {'take_task':1} 
        $.ajax({
            type: 'put',
            url: 'scot/api/v2/entry/' + this.props.entryid,
            data: JSON.stringify(json),
            contentType: 'application/json; charset=UTF-8',
            success: function(data) {
                console.log('success: ' + data);
           }.bind(this),
            error: function(data) {
                this.props.errorToggle('Failed to make Task owner', data);
            }.bind(this)
        });
    },
    render: function () {
        var taskDisplay = 'Task Loading...';
        var onClick; 
        if (this.props.taskData.metadata.status === undefined || this.props.taskData.metadata.status === null || this.props.taskData.class != 'task') {
            taskDisplay = 'Make Task';
            onClick = this.makeTask;
        } else if (this.state.whoami != this.props.taskData.metadata.who && this.props.taskData.metadata.status == 'open') {
            taskDisplay = 'Assign task to me';
            onClick = this.takeTask;
        } else if (this.state.whoami == this.props.taskData.metadata.who && this.props.taskData.metadata.status == 'open') {
            taskDisplay = 'Close Task';
            onClick = this.closeTask;
        } else if (this.props.taskData.metadata.status == 'closed' || this.props.taskData.metadata.status == 'completed') {
            taskDisplay = 'Reopen Task';
            onClick = this.makeTask;
        } else if (this.state.whoami == this.props.taskData.metadata.who && this.props.taskData.metadata.status == 'assigned') {
            taskDisplay = 'Close Task';
            onClick = this.closeTask;
        } else if (this.state.whoami != this.props.taskData.metadata.who && this.props.taskData.metadata.status == 'assigned') {
            taskDisplay = 'Assign task to me';
            onClick = this.takeTask;
        }
        return (
            <span style={{display:'block'}} onClick={onClick}>{taskDisplay}</span>
        )
    }
});

module.exports = Task;
