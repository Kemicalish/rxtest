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
          <div>Raw Items: {this.props.posts}</div>
          {this.props.posts.map(post => (
                <PostItem key={post.key} title={post.title} />
            ))}
        </div>
      );
    }
}


export class PostItem extends React.Component {
    render(){
      return (
        <div className="post" >Post Title: {this.props.title}</div>
      );
    }
}

