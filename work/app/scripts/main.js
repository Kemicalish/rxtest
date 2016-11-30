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
var tumblrApiEndpoint$ = new Rx.Subject().distinct();

let tumblrResponse$ = tumblrApiEndpoint$
	.flatMap(endpoint => Rx.Observable.fromPromise($.getJSON(endpoint)))
	.publish(); //this stream is multicasted to prevent mutliple api call from different subscribers

tumblrResponse$.connect();
	

let rawPost$ = tumblrResponse$
	.flatMap(response => Rx.Observable.create(observer => {
		console.log('############# rawPost: ', response);
		try{
			_.each(response.response.posts, p => observer.next(p));
			observer.complete();
		}
		catch (err) {
			observer.error(err);
		}
	}));

let formatedPost$ = rawPost$
	.flatMap(post => Rx.Observable.create(observer => {
		console.log('formatedPost: ', post.id, post.slug);
		try {
			observer.next(Post.clean(post));
			observer.complete();
		}
		catch (err) {
			observer.error(err);
		}
	}))

let homePosts$ = formatedPost$
	.filter(post => {
		console.log('homePosts$', post.id);
		return _.find(post.tags, t => t.toLowerCase() === 'home');
	});

let coverPosts$ = formatedPost$
	.filter(post => {
		console.log('coverPosts$', post.id);
		return _.find(post.tags, t => t.toLowerCase() === 'type:cover');
	});

/**
 * @selector string : 
 * return a function taking an enumerable of post items, and rendering them within the selector node(s) 
 */
function renderPosts(selector){
	return  posts => {
		console.log(posts);
		let postElems = _.chain(posts)
						.orderBy(['ts'], ['desc'])
						.map(p => (<PostItem key={p.id} post={p} />) )
						.value(); 

		_.each(document.querySelectorAll(selector), domNode => {
			ReactDOM.render(
				<PostItemList posts={postElems} />,
				domNode
			);
		})
		
	}
}


var bindLinks = (entry) => new Promise((resolve, reject) => {
	$('.go-page').on('click', e => {
		e.stopPropagation();
		router.trigger($(e.currentTarget).attr('data-route'));
	});
	resolve(entry);
});

const scanList = [(list, post) => list.concat(post), []]; 

function displayHome(){	
	console.log('HOME!');
	tumblrApiEndpoint$.next(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=home&notes_info=true`);
	tumblrApiEndpoint$.next(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=type:COVER&notes_info=true`);

	homePosts$
		.merge(coverPosts$)
		.bufferTime(1000)
		.scan(...scanList)
		.subscribe(renderPosts('.items-home'), console.error);
}

function displayNews(){	
	tumblrApiEndpoint$.next(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=type:PROMO&notes_info=true`);
} 

function displayLook(){	
	tumblrApiEndpoint$.next(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=type:COVER&notes_info=true`);

	coverPosts$
		.scan(...scanList)
		.subscribe(renderPosts('.items-stories'), console.error);
} 


$(document).ready(function($){
	device.init()
		.then(router.init)
		.then(bindLinks)
		.then(entry => router.trigger(window.location.pathname.substring(1)))
});
