// Generated by CoffeeScript 1.11.1
(function() {
  var ContentEditable, Editable, Prompt, React,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  React = require('react');

  ContentEditable = (function(superClass) {
    extend(ContentEditable, superClass);

    function ContentEditable(props) {
      this.emitChange = bind(this.emitChange, this);
      this.focus = bind(this.focus, this);
      this.render = bind(this.render, this);
      this.content = bind(this.content, this);
      this.shouldComponentUpdate = bind(this.shouldComponentUpdate, this);
      ContentEditable.__super__.constructor.call(this, props);
      this.lastText = '';
    }

    ContentEditable.prototype.shouldComponentUpdate = function(newprops) {
      return newprops.content !== this.refs.element.innerText;
    };

    ContentEditable.prototype.moveCaret = function(pos) {
      var elt, range, sel, textelt;
      if (pos == null) {
        pos = void 0;
      }
      elt = this.refs.element;
      textelt = elt.firstChild;
      if ((typeof pos) === 'undefined') {
        pos = elt.innerText.length;
      }
      elt.focus();
      range = document.createRange();
      range.setStart(textelt, pos);
      range.setEnd(textelt, pos);
      sel = window.getSelection();
      sel.removeAllRanges();
      return sel.addRange(range);
    };

    ContentEditable.prototype.componentDidUpdate = function() {
      if (this.props.content !== this.refs.element.innerText) {
        return this.refs.element.innerText = this.props.content;
      }
    };

    ContentEditable.prototype.content = function() {
      return this.refs.element.innerText || this.refs.element.textContents || "";
    };

    ContentEditable.prototype.render = function() {
      var span;
      console.log("prompt render");
      span = React.DOM.span;
      return span({
        contentEditable: true,
        spellCheck: false,
        className: 'prompt',
        onInput: this.emitChange,
        onBlur: this.emitChange,
        ref: 'element',
        style: {
          marginLeft: '1px'
        }
      }, this.props.content);
    };

    ContentEditable.prototype.focus = function() {
      return this.refs.element.focus();
    };

    ContentEditable.prototype.emitChange = function() {
      var text;
      console.log("prompt change");
      text = this.refs.element.innerText;
      if (this.props.onChange && text !== this.lastText) {
        this.props.onChange(this.content());
      }
      this.lastText = text;
      return false;
    };

    return ContentEditable;

  })(React.Component);

  Editable = React.createFactory(ContentEditable);

  Prompt = (function(superClass) {
    extend(Prompt, superClass);

    function Prompt(props) {
      this.moveCaret = bind(this.moveCaret, this);
      this.focus = bind(this.focus, this);
      this.render = bind(this.render, this);
      this.content = bind(this.content, this);
      Prompt.__super__.constructor.call(this, props);
    }

    Prompt.prototype.content = function() {
      return this.refs.prompt.content();
    };

    Prompt.prototype.render = function() {
      var div, ref, span;
      ref = React.DOM, div = ref.div, span = ref.span;
      return div({
        className: 'promptbox'
      }, [
        span({
          key: 0,
          className: 'prompt'
        }, "$ "), Editable({
          key: 1,
          ref: 'prompt',
          onChange: this.props.onChange,
          content: this.props.content
        })
      ]);
    };

    Prompt.prototype.focus = function() {
      return this.refs.prompt.focus();
    };

    Prompt.prototype.moveCaret = function(p) {
      return this.refs.prompt.moveCaret(p);
    };

    return Prompt;

  })(React.Component);

  module.exports = React.createFactory(Prompt);

}).call(this);

//# sourceMappingURL=prompt.js.map
