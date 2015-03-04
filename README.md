# feedster

Easy RSS feed generation in Node.js, supports most used RSS extensions like `itunes` for podcast generation.

[![Build Status](https://secure.travis-ci.org/andris9/feedster.svg)](http://travis-ci.org/andris9/feedster)
<a href="http://badge.fury.io/js/feedster"><img src="https://badge.fury.io/js/feedster.svg" alt="NPM version" height="18"></a>

## Installation

Install from [npm](http://npmjs.com/package/feedster):

    npm install feedster --save

## TL;DR

Example script for generating a minimal RSS feed:

```javascript
var feedster = require('feedster');
// create feed with required elements
var feed = feedster.createFeed({
    title: 'My Awesome Blog'
    description: 'The best blog you have ever seen'
    link: 'http://path/to/blog'
});
// add new item to the feed
feed.addItem({
    // an item needs to contain either title or description, all other fields are optional
    title: 'My first blog post',
    // pubDate is not required but really useful
    pubDate: '2011-01-01 11:12:34 +0000'
});
// generate a RSS string and print to console
var rss = feed.render();
console.log(rss);
```

## Usage

Require feedster module

```javascript
var feedster = require('feedster');
```

### Create new feed object

```javascript
var feed = feedster.createFeed(headers)
```

Where

  * **headers** is an object with channel headers (see possible options [below](#channel-options))
  * **feed** is the feed object

**Example**

```javascript
var feedster = require('feedster');
var feed = feedster.createFeed({
    title: 'My Awesome Blog'
});
```

### Add items to feed

Add additional item to the feed with

```javascript
feed.addItem(item)
```

Where

  * **item** is a feed item (see possible options [below](#item-options))

**Example**

```javascript
var feedster = require('feedster');
var feed = feedster.createFeed();
feed.addItem({
    title: 'My first blog post',
    pubDate: '2011-01-01 14:34:00'
})
```

### Generate RSS feed

Generate feed object into a rss feed string with

```javascript
var rss = feed.render([options])
```

Where

  * **options** is an optional options object
    * **options.indent** defines the look of the generated file. If false, then the XML is not indented. Use 2 spaces `"  "` for 2-spaces indentation etc.

**Example**

```javascript
var feedster = require('feedster');
var feed = feedster.createFeed({
    title: 'My Awesome Blog'
});
feed.addItem({
    title: 'My first blog post',
    // thats badly formatted date (no timezone etc.) but it works
    pubDate: '2011-01-01 14:34:00'
})
var rss = feed.render({indent: '  '});
console.log(rss);
```

Output:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Awesome Blog</title>
    <lastBuildDate>Sat, 1 Jan 2011 14:34:00 +0200</lastBuildDate>
    <item>
      <title>My first blog post</title>
      <pubDate>Sat, 1 Jan 2011 14:34:00 +0200</pubDate>
    </item>
  </channel>
</rss>
```

### Channel options

#### category

Defines a category or a tag to which the feed belongs. The value is either a string, or an object or an array of mixed strings and objects for multiple categories. Category object has two properties:

  * **value** - category title
  * **domain** - identifies the category's taxonomy

Domain is rarely used, so just using strings with category names is sufficient for most cases

```javascript
var headers = {
    category: [
        // first category as a plain string
        'Category1',
        // second category as an object
        {
            value: 'Category2/Subcategory/SubSub',
            domain: 'dmoz'
        }
    ]
};
```

#### cloud

Indicates that updates to the feed can be monitored using a web service. Defined by an object with the following properties:

  * **domain** - identifies the host name or IP address of the web service that monitors updates to the feed
  * **path** - provides the web service's path
  * **port** - identifies the web service's TCP port
  * **protocol** - "xml-rpc" if the service employs XML-RPC or "soap" if it employs SOAP
  * **registerProcedure** - names the remote procedure to call when requesting notification of updates

```javascript
var headers = {
    cloud: {
        domain: "server.example.com",
        path: "/rpc",
        port: "80",
        protocol: "xml-rpc",
        registerProcedure: "cloud.notify"
    }
};
```

#### copyright

A string about the copyright holder.

```javascript
var headers = {
    copyright: '© 2015 My Name'
};
```

#### description

> **Required value**

Summary of the feed.

```javascript
var headers = {
    description: 'Latest posts from my awesome blog'
};
```

#### docs

URL to RSS format specification.

```javascript
var headers = {
    docs: 'http://www.rssboard.org/rss-specification'
};
```

#### generator

Software that created the feed.

```javascript
var headers = {
    generator: 'My Awesome Feed Generator v1.0'
};
```

#### image

Graphical logo for the feed. Either an url to the image or an object with the following properties:

  * **url** - image location
  * **link** - url to the website. If not set the value from `headers.link` is used
  * **title** - title of the image. If not set the value from `headers.title` is used
  * **description** - image description
  * **width** - image width in pixels
  * **height** - image height in pixels

```javascript
var headers = {
    image: 'http://image/location'
};
var headers = {
    image: {
        url: 'http://image/location',
        link: 'http://link/to/blog',
        title: 'My Blog Logo'
    }
};
```

#### language

Language code.

```javascript
var headers = {
    language: 'en-us'
};
```

#### lastBuildDate

Last modification date. If not set defaults to the time of the newest post in the feed. Recommended option is to not set it manually.

```javascript
var headers = {
    lastBuildDate: '2011-01-01 13:34:11'
};
```

#### link

> **Required value**

URL of the website.

```javascript
var headers = {
    link: 'http://path/to/my/blog'
};
```

#### managingEditor

E-mail address and name of the person to contact regarding the editorial content of the feed. Has the following properties:

  * **name** is the name of the editor
  * **email** is the e-mail address of the editor

```javascript
var headers = {
    managingEditor: {
        name: 'Editor Name',
        email: 'editor@example.com'
    }
};
```

#### pubDate

Publication date and time of the feed's content. Recommended option is to skip it and rely only on auto-generated `lastBuildDate`.

The value can either be a Date object or a datetime string (any valid format is ok, the value is converted to RSS date format automatically).

```javascript
var headers = {
    pubDate: new Date()
};
```

#### rating

Advisory label for the content in a feed.

```javascript
var headers = {
    rating: '(PICS-1.1 "http://www.rsac.org/ratingsv01.html" l by "webmaster@example.com" on "2007.01.29T10:09-0800" r (n 0 s 0 v 0 l 0))'
};
```

#### textInput

Defines a form to submit a text query to the feed's publisher. Nobody uses it, seems pretty strange but it is supported by feedster nevertheless. An object with the following properties:

  * **description**
  * **link**
  * **name**
  * **title**


```javascript
var headers = {
    textInput: {
        description: 'Your aggregator supports the textInput element. What software are you using?',
        link: 'http://www.cadenhead.org/textinput.php',
        name: 'query',
        title: 'TextInput Inquiry'
    }
};
```

#### title

> **Required value**

The name of the feed.

```javascript
var headers = {
    title: 'My Awesome Blog'
};
```

#### webMaster

E-mail address and name of the person to contact regarding technical issues about the feed. Has the following properties:

  * **name** is the name of the web master
  * **email** is the e-mail address of the web master

```javascript
var headers = {
    webMaster: {
        name: 'Webmaster Name',
        email: 'webmaster@example.com'
    }
};
```

### Channel Extensions

#### atomLink

`atomLink` maps to `atom:link` from the [Atom specification](http://tools.ietf.org/html/rfc4287) that defines a relationship between a web resource (such as a page) and an RSS channel. For multiple link elements, use an array for the values.

An object with the following properties:

  * **hreflang** - language code of the related resource
  * **length** - resource's size in bytes
  * **title** - description of the resource
  * **type** - mime-type of the resource
  * **rel** - keyword that identifies the nature of the relationship between the linked resouce and the element
    * *"alternate"* - alternate representation of the same resource
    * *"enclosure"* - media object, usually an audio or video file
    * *"related"* - related resource
    * *"self* - the feed itself
    * *"via"* - the original source of the entry

```javascript
var headers = {
    atomLink: {
        href: 'http://path/to/feed',
        rel: 'self' // type is automatically for "self"
    }
};
```

#### hub

`hub` maps to `atom:link` with `rel="hub"`. Takes a string value which is an URL pointing to the PubSubHubbub hub.

```javascript
var headers = {
    hub: 'http://path/to/hub'
};
```

#### itunes

`itunes` is an object that maps to the [itunes](https://www.apple.com/itunes/podcasts/specs.html) specification and is used for podcasting. Channel level *itunes* element supports the following properties:

  * **author** - string, artist column in iTunes
  * **block** - boolean, if true then the entire podcast is removed from the iTunes Store podcast directory
  * **category** - category element, see below for formatting
  * **image** - string, url to the logo of the podcast
  * **explicit** - boolean, if true then parental advisory graphic is shown under podcast details
  * **complete** - boolean, if true then indicates that no more episodes will be posted in the future
  * **new-feed-url** - string, reports new feed url for this podcast to iTunes
  * **owner** - feed owner object with properties `name` and `email`
  * **subtitle** - string, description column
  * **summary** - string, displayed when the circled i icon in the Description column in iTunes is clicked

**Category format**

  * Plain string for a single top level category: `"Business"`
  * Array of categories for multiple: `["Business", "Technology"]`
  * Sub-categories: `{name: "Business", sub: ["Careers"]}`

You can't use random values as categories, see available categories from the *iTunes Categories for Podcasting* section in itunes [module documentation](https://www.apple.com/itunes/podcasts/specs.html).

```javascript
var headers = {
    itunes: {
        author: 'Your\'s truly',
        block: true, // hide this podcast from the directory
        explicit: true, // show parental advisory graphic
        owner: {
            name: 'My Name',
            email: 'my@example.com'
        },
        category: {
            value: 'Business', // main category
            sub: ['Careers', 'Football'] // sub categories
        }
    }
};
```

#### updatePeriod

`updatePeriod` maps to `sy:updatePeriod` from the Syndication module. Describes a period over which the channel format is updated. Acceptable values are: *hourly*, *daily*, *weekly*, *monthly*, *yearly*. Defaults to *daily*.

```javascript
var headers = {
    updatePeriod: 'hourly'
};
```

#### updateFrequency

`updateFrequency` maps to `sy:updateFrequency` from the Syndication module. A positive integer that describes how many times the channel is updated in selected update period.

```javascript
var headers = {
    // updated once in a hour
    updatePeriod: 'hourly',
    updateFrequency: 1
};
```

### Item options

#### author

The person who wrote the item. Has the following properties:

  * **name** is the name of the author
  * **email** is the e-mail address of the author

```javascript
feed.additem({
    author: {
        name: 'Author Name',
        email: 'author@example.com'
    }
});
```

> Recommended action is to use `creator` instead of `author` as `creator` does not require an e-mail address value

#### category

Defines a category or tag for the item. A string or an object. For multiple categories, use an array for the values. Category object has the following properties:

  * **value** is the category name
  * **domain** identifies the category's taxonomy

Domain is rarely used, so just using strings with category names is sufficient for most cases

```javascript
feed.additem({
    category: [
        // first category as a plain string
        'Category1',
        // second category as an object
        {
            value: 'Category2/Subcategory/SubSub',
            domain: 'dmoz'
        }
    ]
});
```

#### comments

Points to an URL where comments for the item can be found.

```javascript
feed.additem({
    comments: 'http://path/to/comments'
});
```

#### description

Item's full content or a summary of its contents. Either `title` or `description` has to be set for the item, using both is optional. Usually `description` is used for a summary and the `content` extension element (see below) is used for the full contents.

```javascript
feed.additem({
    description: 'Just another rant about my awesomness'
});
```

#### enclosure

Associates a media object, usually an audio or video file. The value can be an URL pointing to the media object or an object value with the following properties:

  * **url** - points to the URL of the file
  * **length** - the size of the file in bytes. Required, but can be set to "0" if the size not known
  * **type** - defines the mime-type of the resource

If `length` is not defined, a default value of `"0"` is used. If `type` is missing, it is detected from the file extension of the url.

```javascript
feed.additem({
    enclosure: 'http://path/to/assets/podcast.mp3'
});
feed.additem({
    enclosure: {
        url: 'http://path/to/assets/podcast.mp3',
        type: 'audio/mpeg',
        length: 12345
    }
});
```

#### guid

A string value that uniquely identifies the item. Recommended action would be to use the permalink to the item as guid, this is also the default if `isPermaLink` option is not used.

If the value is permalink, then you can use the URL as the value, otherwise use an object with the following properties:

  * **value** - guid value
  * **isPermaLink** - boolean, if set to true or is missing then the value must be permalink to the item

```javascript
feed.additem({
    guid: 'http://path/to/posts/1'
});
feed.additem({
    guid: {
        value: 'some-unique-identifier',
        isPermaLink: false
    }
});
```

#### link

The URL pointing to a web page associated with the item.

```javascript
feed.additem({
    link: 'http://path/to/posts/1'
});
```

#### pubDate

Publication date and time of the item. The value can either be a Date object or a datetime string (any valid format is ok, the value is converted to RSS date format automatically).

```javascript
feed.additem({
    pubDate: new Date()
});
```

#### source

Indicates the original source RSS of the entry. An object with the following properties:

  * **title** - the title of the original RSS feed
  * **url** - the URL to the original RSS feed

```javascript
feed.additem({
    source: {
        title: 'Some Other Publication',
        url: 'http://path/to/publication.rss'
    }
});
```

#### title

Item's headline. Either `title` or `description` has to be set for the item, using both is optional.

```javascript
feed.additem({
    title:
});
```

### Item Extensions

#### commentCount

`commentCount` maps to `slash:comments` from the [Slashdot module](http://web.resource.org/rss/1.0/modules/slash/) and contains a positive integer as the count of comments for the item.

```javascript
feed.additem({
    commentCount: 123
});
```

#### commentRss

`commentRss` maps to `wfw:commentRss` from the Well Formed Web [Comments module](http://bitworking.org/news/2012/08/wfw.html) and includes an URL to the comments RSS feed for the item.

```javascript
feed.additem({
    commentRss: 'http://path/to/post/1/comments/feed'
});
```

#### content

`content` maps to `content:encoded` from the [content module](http://web.resource.org/rss/1.0/modules/content/) and contains the full contents for the item. Mostly used together with the `description` element where `description` holds the summary.

```javascript
feed.additem({
    content: '<p>Full text contents</p>',
    description: 'Summary of the post'
});
```

#### creator

`creator` maps to `dc:creator` from [Dublin Core](http://dublincore.org/documents/2012/06/14/dcmi-terms/?v=elements#) and is a string with the name of the person who created the item.

```javascript
feed.additem({
    creator: 'My name'
});
```

#### itunes

`itunes` is an object that maps to the [itunes](https://www.apple.com/itunes/podcasts/specs.html) specification and is used for podcasting. Item level *itunes* element goes together with `enclosure` element that defines the actual podcast show, `itunes` only adds metadata to it. The object supports the following properties:

  * **author** - string, artist column in iTunes
  * **block** - boolean, if true then the this episode is removed from the iTunes Store
  * **duration** - string, formatted as *hh:mm:ss* or *mm:ss*
  * **explicit** - boolean, if true then parental advisory graphic is shown under podcast details
  * **image** - string, url to the logo of the podcast
  * **isClosedCaptioned** - boolean, if true shows Closed Caption graphic in Name column
  * **order** - number, if used overrides the ordering in itunes listing, for example, "1" sets this as the first item
  * **subtitle** - string, description column
  * **summary** - string, displayed when the circled i icon in the Description column in iTunes is clicked

```javascript
var headers = {
    enclosure: 'http://path/to/assets/podcast.mp3',
    itunes: {
        author: 'Your\'s truly',
        duration: '13:34'
    }
};
```

#### lat and long

`lat` and `long` map to `geo:lat` and `geo:long` from the [Basic Geo module](http://www.w3.org/2003/01/geo/). The values indicate a geographical point related to the item.

```javascript
feed.additem({
    lat: 55.701,
    long: 12.552
});
```

#### media

`media` is an object that maps to `media:content` of the [Media RSS module](http://www.rssboard.org/media-rss#media-content). For multiple media elements, use an array for the values.

Media object supports the following properties:

  * **url**
  * **fileSize**
  * **type**
  * **medium**
  * **duration**
  * **height**
  * **width**
  * **title**
  * **description**
  * **keywords**
  * **thumbnails**
  * **category**
  * **player**
  * **credit**
  * ... and many more, only values that require sub-elements are not supported

```javascript
feed.additem({
    media: {
        url: 'http://path/to/assets/1.jpg',
        medium: 'image',
        title: 'Attached image',
        restriction: {
            type: 'sharing',
            relationship: 'deny'
        }
    }
});
```

## License

**MIT**