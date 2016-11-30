require('babel-polyfill');

const _				= require('lodash');
const $				= require('jquery');

const constants		= require('./constants');
const device		= require('./core/device'); 
const router		= require('./core/router');

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
router.addRoute('covers', displayCovers ); 
router.addRoute('look/{lookId}', displayStory ); 
router.addRoute('makeup', displayMakeup ); 

//TODO: paginate home
//TODO: add covers button loading stories
//TODO: filter makeup by categories 
//TODO: buffer posts before rendering
//TODO: change BG Color based on the time the post was retrieved


const scanList = [(list, post) => {
	return _.find(list, p => p.id === post.id) ? list : list.concat(post);
}, []]; 

const distinctPosts = (p1, p2) => p1.id != p2.id;

//attention, distinct will prevent calling the same endpoint AGAIN
//TODO: add a validDurationToken => make it with distinctUntilChanged ?
var tumblrApiEndpoint$ = new Rx.Subject().distinct();

let tumblrResponse$ = tumblrApiEndpoint$
	.flatMap(endpoint => Rx.Observable.fromPromise($.getJSON(endpoint)))
	.publish(); //this stream is multicasted to prevent mutliple api call from different subscribers

tumblrResponse$.connect();
	
let requestId = 0;

let rawPost$ = tumblrResponse$
	.flatMap(response => {
		console.log('############# rawPost: ', response);
		let token = ++requestId;
		try{
			return _.map(response.response.posts, p => _.merge({token:token},p)) ;
		}
		catch (err) {
			console.error('RAW POST ERROR: ', err)
			return Rx.Observable.throw(err);
		}
	})

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


function postsByTag(tag, startsWith){
	return formatedPost$
				.filter(post => {
					console.log(tag, post.id, post.token);
					return _.find(post.tags, t => startsWith ? t.startsWith(tag) : t.toLowerCase() === tag );
				});
}

let homePosts$ = postsByTag('home');
let storyPosts$ = postsByTag('look:', true);
let coverPosts$ = postsByTag('type:cover');
let promoPosts$ = postsByTag('type:promo');
let makeupPosts$ = postsByTag('type:makeup');

let homeFullPosts$ = homePosts$
		.merge(coverPosts$);

//retrieve cover attached posts // get max tumblr limit for one api call for load optimization but we need just the last one
coverPosts$.subscribe(post => {
	tumblrApiEndpoint$.next(getEndpointFromTag(post.storyId));
})



function renderStream(stream, selector, title){
	stream
		.scan(...scanList)
		.subscribe(renderPosts(selector, title), console.error);
}

let streams = [
	[homeFullPosts$, 	'.items-home', 		'HOME POSTS'],
	[storyPosts$, 		'.items-stories', 	'STORY POSTS'],
	[coverPosts$, 		'.items-covers', 	'COVER POSTS'],
	[promoPosts$, 		'.items-news', 		'NEWS POSTS'],
	[makeupPosts$, 		'.items-makeup', 	'MAKEUP POSTS'],
]

_.each(streams, s => renderStream(...s));


function displayHome(){	
	console.log('HOME!');
	tumblrApiEndpoint$.next(getEndpointFromTag('home'));
	tumblrApiEndpoint$.next(getEndpointFromTag('type:COVER'));
}

function displayNews(){	
	console.log('NEWS!');
	tumblrApiEndpoint$.next(getEndpointFromTag('type:PROMO'));
} 

function displayStory(storyId){
	console.log('STORY!');	
	tumblrApiEndpoint$.next(getEndpointFromTag('slug:paris-nude-attitude'));
}

function displayCovers(){
	console.log('COVERS!');	
	tumblrApiEndpoint$.next(getEndpointFromTag('type:COVER'));
} 

function displayMakeup(){
	console.log('MAKEUP!');	
	tumblrApiEndpoint$.next(getEndpointFromTag('type:MAKEUP'));
} 


function getEndpointFromTag(tag){
	return `https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=${tag}&notes_info=true`;
}

/**
 * @selector string : 
 * return a function taking an enumerable of post items, and rendering them within the selector node(s) 
 */
function renderPosts(selector, title) {
	return posts => {
		console.log('renderPosts:', selector, posts.map(p => p.id).sort());
		let postElems = _.chain(posts)
			.orderBy(['ts'], ['desc'])
			//.uniqBy(p => p.id) //TODO: this works but should be done upstream
			.map(p => (<PostItem key={p.id} post={p} />))
			.value();

		_.each(document.querySelectorAll(selector), domNode => {
			ReactDOM.render(
				<PostItemList title={title} posts={postElems} />,
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


$(document).ready(function($){
	device.init()
		.then(router.init)
		.then(bindLinks)
		.then(entry => router.trigger(window.location.pathname.substring(1)))
});
