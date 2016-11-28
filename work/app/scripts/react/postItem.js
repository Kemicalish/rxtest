import React from 'react';
import ReactDOM from 'react-dom';


export class PostItemList extends React.Component {
    constructor(props) {
      super(props);
      this.state = {posts: [], text: ''};
    }

    render(){
      return (
        <div className="post-list" >
          <div>List Title: {this.props.title}</div>
          {this.props.posts}
        </div>
      );
    }
}


export class PostItem extends React.Component {
    render(){
      return (
        <div className="item" >[{this.props.id}] {this.props.title}</div>
      );
    }
}
