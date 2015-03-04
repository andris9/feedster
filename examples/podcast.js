'use strict';

var createFeed = require('../lib/feedster').createFeed;

var feed = createFeed({
    title: 'My Awesome Podcast',
    link: 'http://example.com/path/to/this/blog',
    description: 'The best blog and podcast in the world!',

    // meta info about the podcast
    itunes: {
        summary: 'The best podcast you\'ve ever heard of',
        author: 'My Name',
        explicit: false,
        image: 'http://example.com/path/to/podcast/logo.png',
        owner: {
            name: 'My Name',
            email: 'my.email@example.com'
        },
        subtitle: 'Just another awesome podcast you\'ve never listened before',
        keywords: 'podcast, awesome, my blog',
        category: 'Music'
    }
});

feed.addItem({
    title: 'My first show',
    link: 'http://example.com/path/to/this/blog/post/1',
    pubDate: '2000-11-10 12:32:12 +0000',
    description: 'This is just an awesome podcast episode',
    enclosure: 'http://example.com/path/to/this/blog/assets/1.mp3',

    // meta info about the podcast episode
    itunes: {
        author: 'My Name',
        duration: '34:12'
    }
});

// render RSS to console
var rss = feed.render({
    indent: '  '
});

console.log(rss);