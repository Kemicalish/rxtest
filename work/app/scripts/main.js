require('babel-polyfill');

const _				= require('lodash');
const $				= require('jquery');

const constants		= require('./constants');
const device		= require('./core/device'); 
const router		= require('./core/router');

const itemTPL		= require('../templates/item.hbs');
const itemsTPL		= require('../templates/items.hbs');


const postItemReact	= require('./react/postList');

import Rx from 'rxjs/Rx';
import React from 'react';
import ReactDOM from 'react-dom';

router.addRoute('', displayHome ); 
router.addRoute('news', displayNews ); 
router.addRoute('look/{lookId}', displayLook ); 

console.log('init');

const _default_blog_id = 'bourjois-en-uk.tumblr.com'; //'kemicalish.tumblr.com'; 
const _default_api_key = 's69VTn11sdita3PVXC39QIuSzuc7rNjI814UDygEnd6knXo1dQ'; //'h4kvLlA1sViuXYHOqWrtyrHEgB4JlgP73a8qR7TIzsqpy8IIS8';
const _default_blog_name = 'bourjois-en-uk';

import { PostItem, PostItemList}  from './react/postItem.js'


var posts = [
	{
		id:1,
		title:'post 1'
	},
	{
		id:2,
		title:'post 2'
	},
	{
		id:3,
		title:'post 3'
	},
];

var postsComponents = posts.map(p => (<PostItem key={p.id} title={p.title} />))

ReactDOM.render(
  <PostItemList posts={postsComponents} />,
  document.getElementById('react-root')
);

setTimeout(()=>{
	console.log('AGAIN!');
	posts[0].title = 'MY NEW TITLE!';
	postsComponents = posts.map(p => (<PostItem key={p.id} title={p.title} />))
	ReactDOM.render(
		<PostItemList posts={postsComponents} />,
		document.getElementById('react-root')
	);
},2000)

//Probably a very bad way to create a Producer, it's just for test purpose
//TODO: check best practice (should also check best object Instantiation practices)'
function TumblrEndpointProducer(){
	this.push = args => _.each(pushers, p => p(args));
	var pushers = [] ;
	this.addPush = function(func){pushers.push(func);}
};

let tumblrEndpointProducer = new TumblrEndpointProducer();
let tumblrApiEndpointStream = Rx.Observable.create(observer =>{
	 tumblrEndpointProducer.addPush( endpoint => observer.next(endpoint) );
});

let tumblrResponseStream =  tumblrApiEndpointStream.flatMap(endpoint => Rx.Observable.fromPromise($.getJSON(endpoint)));

let rawPostStream = tumblrResponseStream.flatMap(response => Rx.Observable.create(observer =>{
	_.each(response.response.posts, p => observer.next(p));
}));

let formatedPostStream = rawPostStream.flatMap(post => Rx.Observable.create(observer =>{
	observer.next({
		id:post.id,
		title:post.title,
		tags:post.tags
	});
}))

let homePostsStream = formatedPostStream.filter(post => {
	console.log('homePostsStream');
	return _.find(post.tags, t => t.toLowerCase() === 'home');
}).scan((list, post) => list.concat(post), []);

let coverPostsStream = formatedPostStream.filter(post => {
	console.log('coverPostsStream');
	return _.find(post.tags, t => t.toLowerCase() === 'type:cover');
});


homePostsStream.subscribe(posts => {
	console.log(posts);
	let postElems = posts.map(p => (<PostItem key={p.id} id={p.id} title={p.title} />) ); 
	ReactDOM.render(
		<PostItemList posts={postElems} />,
		$('.items-home')[0]
	);
});

/*
homePostsStream.subscribe(posts => $('.items-home').html(itemsTPL({
	posts:posts
})));
*/
//coverPostsStream.subscribe(p => $('.items-stories').html(itemTPL(p)));

var bindLinks = (entry) => new Promise((resolve, reject) => {
	$('.go-page').on('click', e => {
		e.stopPropagation();
		router.trigger($(e.currentTarget).attr('data-route'));
	});
	resolve(entry);
});

function displayHome(){	
	console.log('HOME!');
	tumblrEndpointProducer.push(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=home&notes_info=true`);
}

function displayNews(){	
	tumblrEndpointProducer.push(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=type:PROMO&notes_info=true`);
} 

function displayLook(){	
	tumblrEndpointProducer.push(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=type:COVER&notes_info=true`);
} 


$(document).ready(function($){
	device.init()
		.then(router.init)
		.then(bindLinks)
		.then(entry => router.trigger(window.location.pathname.substring(1)))
});
