'use strict';

// this example uses only required elements

var feedster = require('../lib/feedster');

var feed = feedster.createFeed({
    title: 'My Awesome Blog'
    description: 'The best blog you have ever seen'
    link: 'http://path/to/blog'
});

feed.addItem({
    // an item needs to contain either title or description, all other fields are optional
    title: 'My first blog post',
    // pubDate is not required but really useful
    pubDate: '2011-01-01 11:12:34 +0000'
});

// render RSS to console
var rss = feed.render({
    indent: '  '
});

console.log(rss);