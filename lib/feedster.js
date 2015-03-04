'use strict';

var xml = require('xml');
var moment = require('moment');
var libmime = require('libmime');

module.exports.Feed = Feed;
module.exports.createFeed = function(headers) {
    return new Feed(headers);
};

/**
 * Creates a RSS feed object
 *
 * @constructor
 * @param {Object} headers Key-value pairs for the RSS <channel> element
 */
function Feed(headers) {
    this.headers = headers || {};

    /**
     * Keep count of the used namespaces - these will be referenced from the RSS header
     * @type {Array}
     */
    this._usedNamespaces = [];

    /**
     * Stores <item> elements
     * @type {Array}
     */
    this._childNodes = [];
}

/**
 * Supported extensions
 * @type {Object}
 */
Feed.prototype.NS = {
    dc: 'http://purl.org/dc/elements/1.1/',
    sy: 'http://purl.org/rss/1.0/modules/syndication/',
    atom: 'http://www.w3.org/2005/Atom',
    slash: 'http://purl.org/rss/1.0/modules/slash/',
    itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd',
    content: 'http://purl.org/rss/1.0/modules/content/',
    wfw: 'http://wellformedweb.org/CommentAPI/',
    media: 'http://search.yahoo.com/mrss/',
    geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#'
};

/**
 * Helper function to process non-object values. Date objects are converted to RSS compatible
 * date format, other values are left as is
 *
 * @param {Mixed} value Node value
 * @returns {String} Formatted node value
 */
Feed.prototype.formatString = function(value) {
    switch (Object.prototype.toString.call(value)) {
        case '[object Date]':
            // Fri, 31 Oct 2014 18:12:21 +0000
            return moment(value).format('ddd, D MMM YYYY HH:mm:ss ZZ');
    }

    if (value instanceof Buffer) {
        return value.toString();
    }

    return value;
};

/**
 * Adds an <item> element to the feed
 *
 * @param {Object} post Key-value pairs for a RSS <item> element
 */
Feed.prototype.addItem = function(item) {
    var childNode = {
        item: []
    };

    if (item.pubDate) {
        item.pubDate = moment(item.pubDate).toDate();

        // Store pubDate for later sorting.
        // Normally we would use a WeakMap for storing object related metadata
        // but WeakMap is not available in Node v0.10 so we pass required information
        // as a non-enumerable property to keep it out of the generated XML
        Object.defineProperty(childNode, 'pubDate', {
            value: item.pubDate,
            enumerable: false
        });
    }

    // process key-value pairs
    Object.keys(item || {}).forEach(function(key) {
        this._handleTag(childNode.item, key, item[key]);
    }.bind(this));

    // Append created node to childNodes list
    this._childNodes.push(childNode);
};

/**
 * Generate a RSS feed file
 *
 * @param {Object} options Optional options
 * @returns {String} Generated RSS
 */
Feed.prototype.render = function(options) {
    options = options || {};

    return xml(this._build(), {
        declaration: true,
        indent: ('indent' in options) ? options.indent : '  '
    });
};

/**
 * Composes XML structure from the input
 *
 * @returns {Object} XML structure for the RSS
 */
Feed.prototype._build = function() {
    var structure = {
        rss: [{
            _attr: {}
        }, {
            channel: []
        }]
    };

    var rootElement = structure.rss;
    var channelElement = rootElement[1].channel;

    // Sort items by date descending
    this._childNodes.sort(function(itemA, itemB) {
        if (!itemA.pubDate && itemB.pubDate) {
            return 1;
        }

        if (itemA.pubDate && !itemB.pubDate) {
            return -1;
        }

        if (!itemA.pubDate && !itemB.pubDate) {
            return 0;
        }

        return moment(itemA.pubDate).isBefore(itemB.pubDate) ? 1 : -1;
    }.bind(this));

    // set channel.lastBuildDate by using the date from the latest element
    if (!this.headers.lastBuildDate && this._childNodes.length && this._childNodes[0].pubDate) {
        this.headers.lastBuildDate = this._childNodes[0].pubDate;
    }

    // Add headers to <channel>
    this._buildHeaders(channelElement, this.headers);

    // Add sorted <item> elements
    rootElement[1].channel = channelElement.concat(this._childNodes);

    // include references to all used namespaces in the root <rss> element
    this._usedNamespaces.forEach(function(ns) {
        rootElement[0]._attr['xmlns:' + ns] = this.NS[ns];
    }.bind(this));

    // append RSS version to header
    rootElement[0]._attr.version = '2.0';

    return structure;
};

/**
 * Processes a key-value pair for the XML. Checks if the key is a registered extension or RSS tag
 * and processes value with that handler. If no handlers are found, the key and value are passed to
 * XML structure as is
 *
 * @param {Objecy} node XML structure where to append the new node
 * @param {String} key Channel or item element key
 * @param {Mixed} value Value for the key
 */
Feed.prototype._handleTag = function(node, key, value) {
    if (this._extensionHandlers[key]) {
        if (this._usedNamespaces.indexOf(this._extensionHandlers[key].ns) < 0) {
            this._usedNamespaces.push(this._extensionHandlers[key].ns);
        }
        return this._extensionHandlers[key].handler(this, node, value);
    }

    if (this._tagHandlers[key]) {
        return this._tagHandlers[key](this, node, value);
    }

    var item = {};
    item[key] = this.formatString(value);
    node.push(item);
};

/**
 * Builds <channel> element XML
 *
 * @param {Object} channelElement XML structure for <channel>
 * @param {Object} headers Key-value pairs to add to the header
 */
Feed.prototype._buildHeaders = function(channelElement, headers) {

    if (headers.lastBuildDate) {
        headers.lastBuildDate = moment(headers.lastBuildDate).toDate();
    }

    if (headers.pubDate) {
        headers.pubDate = moment(headers.pubDate).toDate();
    }

    Object.keys(headers).forEach(function(key) {
        this._handleTag(channelElement, key, headers[key]);
    }.bind(this));

};

/**
 * Handlers for RSS tags. When a handler is not specified, then the value is inserted to XML as is.
 * @type {Object}
 */
Feed.prototype._tagHandlers = {

    /**
     * value can be any date or date formatted string
     * pubDate(.., .., '2012-01-01 12:34:12 +0000')
     *
     * http://www.rssboard.org/rss-profile#element-channel-item-pubdate
     */
    pubDate: function(feed, node, value) {
        node.push({
            pubDate: moment(value).format('ddd, D MMM YYYY HH:mm:ss ZZ')
        });
    },

    /**
     * value is an object with name and email properties
     * managingEditor(.., .., {name: 'my name', email: 'my@email.com'})
     *
     * http://www.rssboard.org/rss-profile#element-channel-managingeditor
     */
    managingEditor: function(feed, node, value) {
        if (typeof value === 'object') {
            value = [].concat(value.email || []).concat(value.name ? ('(' + value.name + ')') : []).join(' ');
        }

        node.push({
            managingEditor: value
        });
    },

    /**
     * value is an object with name and email properties
     *
     * webMaster(.., .., {name: 'my name', email: 'my@email.com'})
     *
     * http://www.rssboard.org/rss-profile#element-channel-webmaster
     */
    webMaster: function(feed, node, value) {
        if (typeof value === 'object') {
            value = [].concat(value.email || []).concat(value.name ? ('(' + value.name + ')') : []).join(' ');
        }

        node.push({
            webMaster: value
        });
    },

    /**
     * value is an object with name and email properties
     *
     * author(.., .., {name: 'my name', email: 'my@email.com'})
     *
     * http://www.rssboard.org/rss-profile#element-channel-item-author
     */
    author: function(feed, node, value) {
        if (typeof value === 'object') {
            value = [].concat(value.email || []).concat(value.name ? ('(' + value.name + ')') : []).join(' ');
        }

        node.push({
            author: value
        });
    },

    /**
     * list is an array of category elements. Category element can be a string or an object.
     * Available properties for category object: value, domain
     *
     * category(.., .., ['cat1', {value: 'cat2', domain:' d1'}])
     *
     * http://www.rssboard.org/rss-profile#element-channel-item-category
     */
    category: function(feed, node, list) {
        [].concat(list || []).forEach(function(category) {
            if (category) {
                if (typeof category === 'object') {
                    if (category.domain) {
                        node.push({
                            category: [{
                                _attr: {
                                    domain: category.domain
                                }
                            }, category.value]
                        });
                        return;
                    }
                }
                node.push({
                    category: category && category.value || category
                });
            }
        });
    },

    /**
     * values is an object where key-value pairs are used as attributes for <cloud> element.
     * Available properties: domain, path, port, protocol, registerProcedure
     *
     * cloud(.., .., {domain: 'example.com', port: 80})
     *
     * http://www.rssboard.org/rss-profile#element-channel-cloud
     */
    cloud: function(feed, node, values) {
        var tag = {
            cloud: {
                _attr: {}
            }
        };

        Object.keys(values || {}).forEach(function(key) {
            tag.cloud._attr[key] = values[key];
        });

        node.push(tag);
    },

    /**
     * values is an url or an object where key-value pairs are used as child elements for <image> element.
     * Available properties for image object: link, title, url, description, height, width.
     * If link or title is not set, channel defaults are used
     *
     * image(.., .., 'absolute_path_to_image.jpg')
     * image(.., .., {url: 'absolute_path_to_image.jpg'})
     * image(.., .., {url: 'absolute_path_to_image.jpg', title: 'my image'})
     *
     * http://www.rssboard.org/rss-profile#element-channel-image
     */
    image: function(feed, node, values) {
        var tag = {
            image: []
        };

        values = values || {};

        if (typeof values === 'string') {
            values = {
                url: values
            };
        }

        if (!values.title && feed.headers.title) {
            values.title = feed.headers.title;
        }

        if (!values.link && feed.headers.link) {
            values.link = feed.headers.link;
        }

        Object.keys(values || {}).forEach(function(key) {
            var item = {};
            item[key] = values[key];
            tag.image.push(item);
        });

        node.push(tag);
    },

    /**
     * Nobody seem to understand what textInput really does. Anyway if you need it, then values
     * is a key-value pairs object where values will be used for sub elements.
     * Available properties: description, link, name, title
     *
     * textInput(.., .., {description: 'some input', link: 'abs_path_to_script.php'})
     *
     * http://www.rssboard.org/rss-profile#element-channel-textinput
     */
    textInput: function(feed, node, values) {
        var tag = {
            textInput: []
        };

        Object.keys(values || {}).forEach(function(key) {
            var item = {};
            item[key] = values[key];
            tag.textInput.push(item);
        });

        node.push(tag);
    },

    /**
     * guid is a string or an object
     * Available properties for guid object: value, isPermaLink (boolean)
     *
     * guid(.., .., 'http://...')
     * guid(.., .., {value: 'http://...'})
     * guid(.., .., {value: 'http://...', isPermaLink: true})
     *
     * http://www.rssboard.org/rss-profile#element-channel-item-guid
     */
    guid: function(feed, node, guid) {
        if (typeof guid === 'object') {
            if (typeof guid.isPermaLink === 'boolean') {
                node.push({
                    guid: [{
                        _attr: {
                            isPermaLink: guid.isPermaLink ? 'true' : 'false'
                        }
                    }, guid.value]
                });
                return;
            }
        }
        node.push({
            guid: guid && guid.value || guid
        });
    },

    /**
     * source is an object with properties url and title
     *
     * source(.., .., {title: 'My other Blog', url: 'abs_url_to_blog_feed'})
     *
     * http://www.rssboard.org/rss-profile#element-channel-item-source
     */
    source: function(feed, node, source) {
        node.push({
            source: [{
                _attr: {
                    url: source.url
                }
            }, source.title]
        });
    },

    /**
     * values is an url or key-value pairs object for the enclosure.
     * Available properties: url, type, length
     *
     * enclosure(.., .., 'path_to_file.mp3')
     * enclosure(.., .., {url: 'path_to_file.mp3'})
     * enclosure(.., .., {url: 'path_to_file.mp3', length: 1234567})
     *
     * http://www.rssboard.org/rss-profile#element-channel-item-enclosure
     */
    enclosure: function(feed, node, values) {
        var tag = {
            enclosure: {
                _attr: {}
            }
        };

        values = values || {};

        if (typeof values === 'string') {
            values = {
                url: values
            };
        }

        if (!values.length) {
            values.length = "0";
        }

        if (!values.type && values.url) {
            values.type = libmime.detectMimeType(values.url);
        }

        Object.keys(values || {}).forEach(function(key) {
            tag.enclosure._attr[key] = values[key];
        });

        node.push(tag);
    }
};

/**
 * Handlers for RSS extensions. Here are defined additional keys for <channel> and <item> elements but
 * instead of using these keys directly, the value is passed to a handler
 * @type {Object}
 */
Feed.prototype._extensionHandlers = {

    /*
     * Dublin Core
     * http://dublincore.org/documents/2012/06/14/dcmi-terms/?v=elements#
     *
     * Only dc:creator (as creator) is currently supported.
     *
     * Usage:
     *
     *     creator: 'my name'
     */
    creator: {
        ns: 'dc',
        handler: function(feed, node, creator) {
            node.push({
                'dc:creator': feed.formatString(creator)
            });
        }
    },

    /*
     * Syndication
     * http://web.resource.org/rss/1.0/modules/syndication/
     *
     * sy:updateBase is not supported
     *
     * Usage:
     *
     *     updatePeriod: 'hourly',
     *     updateFrequency: 1
     */
    updatePeriod: {
        ns: 'sy',
        handler: function(feed, node, period) {
            node.push({
                'sy:updatePeriod': feed.formatString(period)
            });
        }
    },

    updateFrequency: {
        ns: 'sy',
        handler: function(feed, node, frequency) {
            node.push({
                'sy:updateFrequency': frequency
            });
        }
    },

    /*
     * Atom
     * http://tools.ietf.org/html/rfc4287
     *
     * atom:link (as atomLink) and shorthand for atom:link,rel=hub (as hub) are supported
     *
     * Usage:
     *
     *     atomLink: [{href: 'http://', rel: 'self', type: 'application/rss+xml'}, 'http://...'],
     *     hub: 'http://path/to/pubsubhubbub'
     */
    atomLink: {
        ns: 'atom',
        handler: function(feed, node, links) {

            [].concat(links || []).forEach(function(link) {
                link = link || {};

                if (typeof link === 'string') {
                    link = {
                        href: link
                    };
                }

                if (link.rel === 'self' && !link.type) {
                    link.type = 'application/rss+xml';
                }

                node.push({
                    'atom:link': {
                        _attr: link
                    }
                });
            });

        }
    },

    hub: {
        ns: 'atom',
        handler: function(feed, node, url) {
            node.push({
                'atom:link': {
                    _attr: {
                        rel: 'hub',
                        href: url
                    }
                }
            });
        }
    },

    /*
     * Content
     * http://web.resource.org/rss/1.0/modules/content/
     *
     * content:encoded (as content) is supported
     *
     * Usage:
     *
     *     content: '<p>HTML contents</p>'
     */
    content: {
        ns: 'content',
        handler: function(feed, node, content) {
            node.push({
                'content:encoded': content
            });
        }
    },

    /*
     * Slash
     * http://web.resource.org/rss/1.0/modules/slash/
     *
     * Only slash:comments (as commentCount) is supported
     *
     * Usage:
     *
     *     commentCount: 123
     */
    commentCount: {
        ns: 'slash',
        handler: function(feed, node, count) {
            node.push({
                'slash:comments': count
            });
        }
    },

    /*
     * WFW CommentAPI
     * http://bitworking.org/news/2012/08/wfw.html
     *
     * wfw:commentRss (as commentRss) is supported
     *
     * Usage:
     *
     *     commentRss: 'http://path/to/comment.rss'
     */
    commentRss: {
        ns: 'wfw',
        handler: function(feed, node, rss) {
            node.push({
                'wfw:commentRss': rss
            });
        }
    },

    /*
     * Basic Geo
     * http://www.w3.org/2003/01/geo/
     *
     * geo:lat (as lat) and geo:long (as long) are supported
     *
     * Usage:
     *
     *     lat: 55.701,
     *     long: 12.552
     */
    lat: {
        ns: 'geo',
        handler: function(feed, node, lat) {
            node.push({
                'geo:lat': lat
            });
        }
    },

    long: {
        ns: 'geo',
        handler: function(feed, node, long) {
            node.push({
                'geo:long': long
            });
        }
    },

    /*
     * iTunes
     * https://www.apple.com/itunes/podcasts/specs.html
     *
     * Supports all options. Keys need to be enclosed into an 'itunes' object.
     *
     * Usage:
     *
     *     itunes: {
     *         explicit: true,
     *         image: 'http://www.example.com/image.png',
     *         ...
     *     }
     *
     * Category format:
     *
     *   * Plain string for a single top level category: 'Business'
     *   * Array of categories for multiple: ['Business', 'Technology']
     *   * Sub-categories: {name: 'Business', sub: ['Careers']}
     *
     * Boolean values can either be strings (passed as is) or true|false (converted to "Yes"|"No")
     *
     * Owner is an object of name, email
     */
    itunes: {
        ns: 'itunes',
        handler: function(feed, node, itunes) {
            var tag;
            itunes = itunes || {};

            Object.keys(itunes).forEach(function(key) {
                var element;

                switch (key) {

                    case 'category':
                        /*
                        category: 'Business'
                        category: ['Business']
                        category: [{name: 'Business', sub: ['Careers']}, 'Technology']
                        */
                        [].concat(itunes.category).forEach(function(category) {
                            tag = {};

                            if (typeof category !== 'object') {
                                category = {
                                    value: category
                                };
                            }

                            tag['itunes:category'] = {
                                _attr: {
                                    text: category.value
                                }
                            };

                            if (category.sub) {
                                tag['itunes:category'] = [tag['itunes:category']];
                                [].concat(category.sub).forEach(function(subCategory) {
                                    tag['itunes:category'].push({
                                        'itunes:category': {
                                            _attr: {
                                                text: subCategory.value || subCategory
                                            }
                                        }
                                    });
                                });
                            }
                            node.push(tag);
                        });
                        break;

                    case 'explicit':
                    case 'isClosedCaptioned':
                    case 'complete':
                    case 'block':
                        element = {};
                        element['itunes:' + key] = typeof itunes[key] === 'boolean' ? (itunes[key] ? 'Yes' : 'No') : itunes[key];
                        node.push(element);
                        break;

                    case 'owner':
                        // owner: {name: 'abc', email:'abc@example.com'}
                        tag = {
                            'itunes:owner': []
                        };

                        if (itunes.owner.name) {
                            tag['itunes:owner'].push({
                                'itunes:name': itunes.owner.name
                            });
                        }

                        if (itunes.owner.email) {
                            tag['itunes:owner'].push({
                                'itunes:email': itunes.owner.email
                            });
                        }

                        node.push(tag);
                        break;

                    case 'image':
                        // image: 'http://www.example.com/image.png'
                        node.push({
                            'itunes:image': {
                                _attr: {
                                    href: itunes.image
                                }
                            }
                        });
                        break;

                    default:
                        tag = {};
                        tag['itunes:' + key] = itunes[key];
                        node.push(tag);
                }
            });
        }
    },

    /*
     * Media
     * http://www.rssboard.org/media-rss#media-content
     *
     * Partially supported, supports most elements and attributes. Media objects are wrapped into
     * a media:content element. Elements with sub elements (eg. media:community) are not supported
     *
     * Usage:
     *
     *    media: [{
     *        url: 'http://example.com/path/to/this/blog/assets/1.jpg',
     *        medium: 'image',
     *        title: 'Attached image',
     *        restriction: {
     *            type: 'sharing',
     *            relationship: 'deny'
     *        }
     *    }]
     *
     * Attributes and sub elements are mixed as object keys (ie. 'url' is an attribute, 'title' is a sub element)
     */
    media: {
        ns: 'media',
        handler: function(feed, node, list) {
            var attribs = [
                'url',
                'fileSize',
                'type',
                'medium',
                'isDefault',
                'expression',
                'bitrate',
                'bitrate',
                'samplingrate',
                'channels',
                'duration',
                'height',
                'width',
                'lang'
            ];

            [].concat(list || []).forEach(function(media) {
                var tag = {
                    'media:content': [{
                        _attr: {}
                    }]
                };
                var type;
                var attr = tag['media:content'][0]._attr;

                if (typeof media === 'string') {
                    media = {
                        url: media
                    };
                }

                if (!media.type) {
                    type = libmime.detectMimeType(media.url);
                    if (type !== 'application/octet-stream') {
                        media.type = type;
                    }
                }

                Object.keys(media).forEach(function(key) {
                    var element = {};
                    var value = media[key];

                    if (attribs.indexOf(key) >= 0) {
                        if (key === 'isDefault' && typeof value === 'boolean') {
                            value = value ? 'true' : 'false';
                        }
                        attr[key] = value;
                        return;
                    }

                    if (typeof value === 'string') {
                        element['media:' + key] = value;
                    } else {
                        element['media:' + key] = [{
                            _attr: {}
                        }];

                        Object.keys(value).forEach(function(elementKey) {
                            if (elementKey !== 'value') {
                                element['media:' + key][0]._attr[elementKey] = value[elementKey];
                            }
                        });

                        if (value.value) {
                            element['media:' + key].push(value.value);
                        } else {
                            element['media:' + key] = element['media:' + key].shift();
                        }
                    }

                    tag['media:content'].push(element);
                    return;

                });

                if (tag['media:content'].length === 1) {
                    tag['media:content'] = tag['media:content'].shift();
                }

                node.push(tag);
            });
        }
    },
};