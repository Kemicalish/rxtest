require('babel-polyfill');

const _				= require('lodash');
const $				= require('jquery');

const constants		= require('./constants');
const device		= require('./core/device'); 
const router		= require('./core/router');

import Rx from 'rxjs/Rx';

router.addRoute('', displayHome ); 

console.log('init');

const _default_blog_id = 'bourjois-en-uk.tumblr.com'; //'kemicalish.tumblr.com'; 
const _default_api_key = 's69VTn11sdita3PVXC39QIuSzuc7rNjI814UDygEnd6knXo1dQ'; //'h4kvLlA1sViuXYHOqWrtyrHEgB4JlgP73a8qR7TIzsqpy8IIS8';
const _default_blog_name = 'bourjois-en-uk';


let tumblrEndpointProducer =  {
	setPush: function(func){this.push = func;}
}

//let tumblrApiEndpointStream = Rx.Observable.of(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&notes_info=true`)
let tumblrApiEndpointStream = Rx.Observable.create(observer =>{
	 tumblrEndpointProducer.setPush( endpoint => observer.next(endpoint) );
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
});

let coverPostsStream = formatedPostStream.filter(post => {
	console.log('coverPostsStream');
	return _.find(post.tags, t => t.toLowerCase() === 'type:cover');
});

homePostsStream.subscribe(p => console.log(p));
coverPostsStream.subscribe(p => console.log(p));

function displayHome(){	
	console.log('HOME!');

	tumblrEndpointProducer.push(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&notes_info=true`);
	setTimeout(()=>{
		tumblrEndpointProducer.push(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=home&notes_info=true`);
	},1000)

	setTimeout(()=>{
		tumblrEndpointProducer.push(`https://api.tumblr.com/v2/blog/${_default_blog_id}/posts?callback=?&api_key=${_default_api_key}&tag=type:COVER&notes_info=true`);
	},5000)
}


$(document).ready(function($){
	device.init()
		.then(router.init)
		//.then(Do your stuff)
		.then(entry => router.trigger(window.location.pathname.substring(1)))
});
