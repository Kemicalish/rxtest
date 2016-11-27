import React from 'react';
import ReactDOM from 'react-dom';

const element = (
  <h1 className="greeting">
    Hello Me!
  </h1>
);

module.exports = React.createClass({
    render: function() {
        return element;
    }
});

