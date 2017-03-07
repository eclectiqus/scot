var React               = require('react');
var Button              = require('react-bootstrap/lib/Button');
var ReactTags           = require('react-tag-input').WithContext;

var Tag = React.createClass({
    getInitialState: function() {
        return {tagEntry:false}
    },
    toggleTagEntry: function () {
        if (this.state.tagEntry == false) {
            this.setState({tagEntry:true})
        } else if (this.state.tagEntry == true) {
            this.setState({tagEntry:false})
        };
    },
    render: function() {
        var rows = [];
        var id = this.props.id;
        var type = this.props.type;
        var data = this.props.data;
        
        //Don't show if guide
        if (this.props.type == 'guide') {
            return (<th/>);
        }

        if (data != undefined) {
            for (var i=0; i < data.length; i++) {
                rows.push(<TagDataIterator data={data} dataOne={data[i]} id={id} type={type} updated={this.props.updated} key={i} />);
            }
        }
        return (
            <th>
                <th>
                Tags:
                </th>
                <td>
                    {rows}
                    {this.state.tagEntry ? <NewTag data={data} type={type} id={id} toggleTagEntry={this.toggleTagEntry} updated={this.props.updated}/>: null}
                    {this.state.tagEntry ? <Button bsSize={'xsmall'} bsStyle={'danger'} onClick={this.toggleTagEntry}><span className='glyphicon glyphicon-minus' aria-hidden='true'></span></Button> : <Button bsSize={'xsmall'} bsStyle={'success'} onClick={this.toggleTagEntry}><span className='glyphicon glyphicon-plus' aria-hidden='true'></span></Button>}
                </td>
            </th>
        )
    }
});

var TagDataIterator = React.createClass({
    tagDelete: function() {
        var data = this.props.data;
        var newTagArr = [];
        for (var i=0; i < data.length; i++) {
            if (data[i] != undefined) {
                if (typeof(data[i]) == 'string') {
                    if (data[i] != this.props.dataOne) {
                        newTagArr.push(data[i]); 
                    }
                } else {
                    if (data[i].value != this.props.dataOne.value) {
                        newTagArr.push(data[i].value);
                    }
                }
            }
        }
        $.ajax({
            type: 'put',
            url: 'scot/api/v2/' + this.props.type + '/' + this.props.id,
            data: JSON.stringify({'tag':newTagArr}),
            success: function(data) {
                console.log('deleted tag success: ' + data);
            }.bind(this),
            error: function() {
                this.props.updated('error','Failed to delete tag');
            }.bind(this)
        });
    },
    render: function() {
        var dataOne = this.props.dataOne;
        var value;
        if (typeof(dataOne) == 'string') {
            value = dataOne;
        } else if (typeof(dataOne) == 'object') {
            if (dataOne != undefined) {
                value = dataOne.value;
            }
        }
        return (
            <span id="event_tag" className='tagButton'>{value} <i onClick={this.tagDelete} className="fa fa-times tagButtonClose"/></span>
        )
    }
});

var NewTag = React.createClass({
    getInitialState: function() {
        return {
            suggestions: this.props.options,
        }
    },
    handleAddition: function(tag) {
        var newTagArr = [];
        var data = this.props.data;
        for (var i=0; i < data.length; i++) {
            if (data[i] != undefined) {
                if (typeof(data[i]) == 'string') {
                    newTagArr.push(data[i]);
                } else {
                    newTagArr.push(data[i].value);
                }
            }
        }
        newTagArr.push(tag);
        $.ajax({
            type: 'put',
            url: 'scot/api/v2/' + this.props.type + '/' + this.props.id,
            data: JSON.stringify({'tag':newTagArr}),
            contentType: 'application/json; charset=UTF-8',
            success: function(data) {
                console.log('success: tag added');
                this.props.toggleTagEntry();
            }.bind(this),
            error: function() {
                this.props.updated('error','Failed to add tag');
                this.props.toggleTagEntry();
            }.bind(this)
        });
    },
    handleInputChange: function(input) {
        var arr = [];
        this.serverRequest = $.get('/scot/api/v2/ac/tag/' + input, function (result) {
            var result = result.records;
            for (var i=0; i < result.length; i++) {
                arr.push(result[i].value)
            }
            this.setState({suggestions:arr})
        }.bind(this));
    },
    handleDelete: function () {
        //blank since buttons are handled outside of this
    },
    handleDrag: function () {
        //blank since buttons are handled outside of this
    },
    render: function() {
        var suggestions = this.state.suggestions;
        return (
            <span className='tag-new'>
                <ReactTags
                    suggestions={suggestions}
                    handleAddition={this.handleAddition}
                    handleDelete={this.handleDelete}
                    handleDrag={this.handleDrag}
                    handleInputChange={this.handleInputChange}
                    minQueryLength={1}
                    customCSS={1}/>
            </span>
        )
    }
})

module.exports = Tag;
