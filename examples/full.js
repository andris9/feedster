'use strict';

var createFeed = require('../lib/feedster').createFeed;

var feed = createFeed({

    // http://www.rssboard.org/rss-profile#element-channel-title
    title: 'My Awesome Blog and Podcast',

    // http://www.rssboard.org/rss-profile#namespace-elements-atom-link
    atomLink: {
        href: 'http://example.com/path/to/this/feed',
        rel: 'self',
        type: 'application/rss+xml'
    },

    // http://www.rssboard.org/rss-profile#element-channel-link
    link: 'http://example.com/path/to/this/blog',

    // http://www.rssboard.org/rss-profile#element-channel-description
    description: 'The best blog and podcast in the world!',

    // http://www.rssboard.org/rss-profile#element-channel-language
    language: 'en',

    // http://web.resource.org/rss/1.0/modules/syndication/
    updatePeriod: 'hourly',
    updateFrequency: 1,

    // http://www.rssboard.org/rss-profile#element-channel-generator
    generator: 'https://github.com/andris9/feedster',

    // https://www.apple.com/itunes/podcasts/specs.html
    // iTunes channel level elements
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
        category: [

            // top-level category
            'Music',

            // top level category with sub-categories
            {
                value: 'Games & Hobbies',
                sub: ['Automotive', 'Aviation']
            }
        ]
    },

    // http://www.rssboard.org/rss-profile#element-channel-managingeditor
    managingEditor: {
        name: 'My Name',
        email: 'my.email@example.com'
    },

    // http://www.rssboard.org/rss-profile#element-channel-copyright
    copyright: '© My Name',

    // http://www.rssboard.org/rss-profile#element-channel-image
    // if you want to specify link and title (by default feed title and link are used):
    //     link: 'http://...',
    //     title: 'my awesome image'
    image: {
        url: 'http://example.com/path/to/podcast/logo.png',
    }
});

// Add an <item> element to the feed
feed.addItem({

    // http://www.rssboard.org/rss-profile#element-channel-item-title
    title: 'My best blog post',

    // http://www.rssboard.org/rss-profile#element-channel-item-link
    link: 'http://example.com/path/to/this/blog/post/1',

    // http://www.rssboard.org/rss-profile#element-channel-item-guid
    // alternatively (uses default isPermaLink value):
    //     guid: 'http://example.com/path/to/this/blog/post/1'
    guid: {
        value: 'http://example.com/path/to/this/blog/post/1',
        isPermaLink: true
    },

    // http://www.rssboard.org/rss-profile#element-channel-item-pubdate
    // any valid date format is ok, no need to use special formatting
    pubDate: '2000-11-10 12:32:12 +0000',

    // http://www.rssboard.org/rss-profile#namespace-elements-dublin-creator
    creator: 'My Name',

    // http://www.rssboard.org/rss-profile#element-channel-item-category
    // alternatively if you only need to set a single category, you can use a string for it
    //     category: 'single category'
    category: [

        // category as a string
        'First',

        // category with optional domain argument
        {
            value: 'Second/With/Domain',
            domain: 'dmoz'
        }
    ],

    // http://www.rssboard.org/rss-profile#element-channel-item-description
    description: 'This is just an awesome podcast episode',

    // http://www.rssboard.org/rss-profile#namespace-elements-content-encoded
    content: '<p>This is just an awesome podcast episode</p>',

    // http://www.rssboard.org/rss-profile#element-channel-item-comments
    comments: 'http://example.com/path/to/this/blog/post/1#comments',

    // http://bitworking.org/news/2012/08/wfw.html
    commentRss: 'http://example.com/path/to/this/blog/post/1/feed',

    // http://www.rssboard.org/rss-profile#namespace-elements-slash-comments
    commentCount: 15,

    // http://www.rssboard.org/rss-profile#element-channel-item-enclosure
    // if the url points to a file, then "type" is detected automatically
    // otherwise add
    //     type: 'audio/mpeg'
    enclosure: {
        url: 'http://example.com/path/to/this/blog/assets/1.mp3',
        length: 55893808
    },

    // https://www.apple.com/itunes/podcasts/specs.html
    // iTunes item level elements
    itunes: {
        keywords: 'awesome, podcast',
        subtitle: 'Another awesome episode',
        summary: 'Another awesome episode about awesome stuff',
        author: 'My Name',
        explicit: false,
        duration: '34:12'
    },

    // http://www.rssboard.org/media-rss#media-content
    media: {
        url: 'http://example.com/path/to/this/blog/assets/1.jpg',
        medium: 'image',
        title: 'Attached image'
    }
});

// render RSS to console
var rss = feed.render({
    indent: '  '
});

console.log(rss);