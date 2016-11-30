
function clean (raw){
    return {
        id:raw.id,
        title:raw.title,
        tags:raw.tags,
        ts:raw.timestamp,
        img:getImg(raw)
    }
}

function getImg (raw){
    if(raw.photos && raw.photos.length >= 1 && raw.photos[0].alt_sizes && raw.photos[0].alt_sizes.length >= 2 && raw.photos[0].alt_sizes[2] )
        return raw.photos[0].alt_sizes[2].url
}

export var Post = {
    getImg:getImg,
    clean:clean
}