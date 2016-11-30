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
          <div>{this.props.title}</div>
          {this.props.posts}
        </div>
      );
    }
}


export class PostItem extends React.Component {
    render(){
      return (
        <div className="item">
          <div className="post-img" ></div>{this.props.post.img} [{this.props.post.id}] {this.props.post.title}
        </div>
      );
    }
}

