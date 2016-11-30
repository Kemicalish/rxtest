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

import { PostItem, PostItemList}  from './react/postItem.js'
import { Post } from './post.js';

const _default_blog_id = 'bourjois-en-uk.tumblr.com'; //'kemicalish.tumblr.com'; 
const _default_api_key = 's69VTn11sdita3PVXC39QIuSzuc7rNjI814UDygEnd6knXo1dQ'; //'h4kvLlA1sViuXYHOqWrtyrHEgB4JlgP73a8qR7TIzsqpy8IIS8';
const _default_blog_name = 'bourjois-en-uk';

router.addRoute('', displayHome ); 
router.addRoute('news', displayNews ); 
router.addRoute('look/{lookId}', displayLook ); 

//attention, distinct will prevent calling the same endpoint AGAIN
//TODO: add a validDurationToken => make it with distinctUntilChanged ?
var tumblrApiEndpointStream = new Rx.Subject().distinct();

let tumblrResponseStream = tumblrApiEndpointStream
	.flatMap(endpoint => Rx.Observable.fromPromise($.getJSON(endpoint)));

let rawPostStream = tumblrResponseStream
	.flatMap(response => Rx.Observable.create(observer => {
		_.each(response.response.posts, p => observer.next(p));
	}));

let formatedPostStream = rawPostStream.flatMap(post => Rx.Observable.create(observer =>{
	try{
		observer.next(Post.clean(post))
	}
	catch(err){
		observer.error(err);
	}
}))

let homePostsStream = formatedPostStream.filter(post => {
	console.log('homePostsStream');
	return _.find(post.tags, t => t.toLowerCase() === 'home');
});

let coverPostsStream = formatedPostStream.filter(post => {
	console.log('coverPostsStream');
	return _.find(post.tags, t => t.toLowerCase() === 'type:cover');
});

function renderPosts(posts){
	console.log(posts);
	let postElems = _.chain(posts)
					.orderBy(['ts'], ['desc'])
					.map(p => (<PostItem key={p.id} post={p} />) )
					.value(); 
	ReactDOM.render(
		<PostItemList posts={postElems} />,
		$('.items-home')[0]
	);
}

//HOW do we swicth from rendering home page to rendering an other one?
//TODO: we should run it only based on a previous context
homePostsStream
	.merge(coverPostsStream)
	.scan((list, post) => list.concat(post), [])
	.subscribe(renderPosts);


var bindLinks = (entry) => new Promise((resolve, reject) => {
	$('.go-page').on('click', e => {
		e.stopPropagation();
		router.trigger($(e.currentTarget).attr('data-route'));
	});
	resolve(entry);
});

function displayHome(){	
	console.log('HOME!');
	tumblrApiEndpointStream.next(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=home&notes_info=true`);
	tumblrApiEndpointStream.next(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=type:COVER&notes_info=true`);
}

function displayNews(){	
	tumblrApiEndpointStream.next(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=type:PROMO&notes_info=true`);
} 

function displayLook(){	
	tumblrApiEndpointStream.next(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=type:COVER&notes_info=true`);
} 


$(document).ready(function($){
	device.init()
		.then(router.init)
		.then(bindLinks)
		.then(entry => router.trigger(window.location.pathname.substring(1)))
});
