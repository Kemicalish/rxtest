import React from 'react';
import ReactDOM from 'react-dom';

const element = (
  <div className="post">Post</div>
);
/*
ReactDOM.render(
  element,
  document.getElementById('react-root')
);
*/
export default class PostItem extends React.Component {
    render(){
      return element;
    }
}