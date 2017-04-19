var React                   = require('react');
var Modal                   = require('react-modal');
var Button                  = require('react-bootstrap/lib/Button');

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

var LinkWarning = React.createClass({ 
    proceed: function() {
        window.open(this.props.link);
        this.props.linkWarningToggle();
    },
    componentWillMount: function() {
        var myDomain = window.location.href; 
        var reg = new RegExp(/((https?|ftp):\/\/[a-zA-Z0-9\-_\.]+\.)?([a-zA-Z0-9\-_\.]+\.([A-Z]{4}|com|org|new|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum))/,'i');
        var linkRegResult = this.props.link.match(reg);
        var myDomainRegResult = myDomain.match(reg);
        if (linkRegResult != undefined && myDomainRegResult != undefined) {
            var linkDomain = linkRegResult[3];
            var myDomain = myDomainRegResult[3];
            if (linkDomain == myDomain) {
                this.proceed();
            }
        }
        /*
        if ($.isUrlInternal(this.props.link)) {
            this.proceed();
        }*/
    },
    render: function() {
        return (
            <div>
                <Modal
                    isOpen={true}
                    onRequestClose={this.props.linkWarningToggle}
                    style={customStyles}>
                    <div className="modal-header">
                        <img src="/images/close_toolbar.png" className="close_toolbar" onClick={this.props.linkWarningToggle} />
                        <h3 id="myModalLabel">Browse to site?</h3>
                    </div>
                    <div className="modal-body"> 
                        The link you clicked may take you to a site outside SCOT. If this is a link an attacker controls you may be tipping your hand.
                        <br/>
                        <b>{this.props.link}</b>
                    </div>
                    <div className="modal-footer">
                        <Button id='cancel-delete' onClick={this.props.linkWarningToggle}>Cancel</Button>
                        <Button bsStyle='info' id='proceed' onClick={this.proceed}>Proceed</Button>
                    </div>
                </Modal>
            </div>
        )
    }
});
module.exports = LinkWarning;
