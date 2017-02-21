var React               = require('react');
var Button              = require('react-bootstrap/lib/Button');
var ReactTags           = require('react-tag-input').WithContext;

var Source = React.createClass({
    getInitialState: function() {
        return {sourceEntry:false}
    },
    toggleSourceEntry: function () {
        if (this.state.sourceEntry == false) {
            this.setState({sourceEntry:true})
        } else if (this.state.sourceEntry == true) {
            this.setState({sourceEntry:false})
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
                rows.push(<SourceDataIterator data={data} dataOne={data[i]} id={id} type={type} updated={this.props.updated} />);
            }
        }
        return (
            <th>
                <th>
                Sources:
                </th>
                <td>
                    {rows}
                    {this.state.sourceEntry ? <NewSource data={data} type={type} id={id} toggleSourceEntry={this.toggleSourceEntry} updated={this.props.updated}/>: null}
                    {this.state.sourceEntry ? <Button bsSize={'xsmall'} bsStyle={'danger'} onClick={this.toggleSourceEntry}><span className='glyphicon glyphicon-minus' aria-hidden='true'></span></Button> : <Button bsSize={'xsmall'} bsStyle={'success'} onClick={this.toggleSourceEntry}><span className='glyphicon glyphicon-plus' aria-hidden='true'></span></Button>} 
                </td>
            </th>
        )
    }
});

var SourceDataIterator = React.createClass({
    sourceDelete: function() {
        var data = this.props.data;
        var newSourceArr = [];
        for (var i=0; i < data.length; i++) {
            if (data[i] != undefined) {
                if (typeof(data[i]) == 'string') {
                    if (data[i] != this.props.dataOne) {
                        newSourceArr.push(data[i]);
                    }
                } else {
                    if (data[i].value != this.props.dataOne.value) {
                        newSourceArr.push(data[i].value);
                    }
                }
            }
        }
        $.ajax({
            type: 'put',
            url: 'scot/api/v2/' + this.props.type + '/' + this.props.id, 
            data: JSON.stringify({'source':newSourceArr}),
            success: function(data) {
                console.log('deleted source success: ' + data);
            }.bind(this),
            error: function() {
                this.props.updated('error','Failed to delete the source');
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
            <Button id="event_source" bsSize={'xsmall'}>{value} <span onClick={this.sourceDelete} style={{paddingLeft:'3px'}} className="glyphicon glyphicon-remove" aria-hidden="true"></span></Button>
        )
    }
});

var NewSource = React.createClass({
    getInitialState: function() {
        return {
            suggestions: this.props.options,
        }
    },
    handleAddition: function(source) {
        var newSourceArr = [];
        var data = this.props.data;
        for (var i=0; i < data.length; i++) {
            if (data[i] != undefined) {
                if(typeof(data[i]) == 'string') {
                    newSourceArr.push(data[i]);
                } else {
                    newSourceArr.push(data[i].value);
                }
            }
        }
        newSourceArr.push(source);
        $.ajax({
            type: 'put',
            url: 'scot/api/v2/' + this.props.type + '/' + this.props.id,
            data: JSON.stringify({'source':newSourceArr}),
            contentType: 'application/json; charset=UTF-8',
            success: function(data) {
                console.log('success: source added');
                this.props.toggleSourceEntry();
            }.bind(this),
            error: function() {
                this.props.updated('error','Failed to add source');
                this.props.toggleSourceEntry();
            }.bind(this)
        });
    },
    handleInputChange: function(input) {
        var arr = [];
        this.serverRequest = $.get('/scot/api/v2/ac/source/' + input, function (result) {
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
                    handleInputChange={this.handleInputChange}
                    handleDelete={this.handleDelete}
                    handleDrag={this.handleDrag}
                    minQueryLength={1}
                    customCSS={1}/>
            </span>
        )
    }
})

module.exports = Source;
