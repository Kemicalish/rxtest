const _				= require('lodash');
const imgTagSrcRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;

function clean (raw){
    return {
        id:raw.id,
        title:raw.title,
        tags:raw.tags,
        ts:raw.timestamp,
        img:getImg(raw),
        storyId:_.filter(raw.tags, t => t.toLowerCase().startsWith('look:')),
        token:raw.token
    }
}

function getImg (p){
    let imgList = [], img;

    imgTagSrcRegex.lastIndex = 0;
    if ( img = imgTagSrcRegex.exec( p.body ) ) {
        imgList.push( img[1] );
    }

	return imgList.length > 0 ? imgList[0] : getVideoPoster(p);
}


function getVideoLink (p){
	return p.video && p.video.youtube && p.video.youtube.video_id ? p.video.youtube.video_id : null;
}

function getVideoPoster (p) {
	let vid = getVideoLink(p);
	return vid ? `http://img.youtube.com/vi/${vid}/0.jpg` : null ;
}

export var Post = {
    getImg:getImg,
    clean:clean
}