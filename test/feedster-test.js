'use strict';

var feedster = require('../lib/feedster');
var chai = require('chai');
var expect = chai.expect;

chai.config.includeStack = true;

describe('feedster unit tests', function() {

    describe('#formatString', function() {
        it('should return string value', function() {
            var feed = feedster.createFeed();
            expect(feed.formatString('test')).to.equal('test');
        });

        it('should rconvert Date to string', function() {
            var feed = feedster.createFeed();
            expect(feed.formatString(new Date(2011, 10, 23, 15, 22, 43))).to.include('Wed, 23 Nov 2011 15:22:43 ');
        });
    });

    describe('#addItem', function() {
        it('should add new items', function() {
            var feed = feedster.createFeed();

            feed.addItem({
                title: 'test1'
            });
            expect(feed._childNodes).to.deep.equal([{
                item: [{
                    title: 'test1'
                }]
            }]);

            feed.addItem({
                title: 'test2'
            });
            expect(feed._childNodes).to.deep.equal([{
                item: [{
                    title: 'test1'
                }]
            }, {
                item: [{
                    title: 'test2'
                }]
            }]);
        });

        it('should store pubDate', function() {
            var feed = feedster.createFeed();

            feed.addItem({
                pubDate: new Date()
            });

            expect(feed._childNodes[0].pubDate).to.exist;
        });
    });

    describe('#render', function() {
        it('should convert xml object to a string', function() {
            var feed = feedster.createFeed();
            expect(feed.render({
                indent: false
            })).to.equal('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel></channel></rss>');
        });
    });

    describe('#_build', function() {
        it('should generate XML object', function() {
            var feed = feedster.createFeed({
                title: 'test'
            });
            feed.addItem({
                title: 'test'
            });

            expect(feed._build()).to.deep.equal({
                rss: [{
                    _attr: {
                        version: '2.0'
                    }
                }, {
                    channel: [{
                        title: 'test'
                    }, {
                        item: [{
                            'title': 'test'
                        }]
                    }]
                }]
            });
        });

        it('should add namespaces', function() {
            var feed = feedster.createFeed();
            feed.addItem({
                creator: 'test'
            });

            expect(feed._build()).to.deep.equal({
                rss: [{
                    _attr: {
                        version: '2.0',
                        'xmlns:dc': 'http://purl.org/dc/elements/1.1/'
                    }
                }, {
                    channel: [{
                        item: [{
                            'dc:creator': 'test'
                        }]
                    }]
                }]
            });
        });

        it('should sort child nodes by date', function() {
            var feed = feedster.createFeed();

            feed.addItem({
                pubDate: '2007-01-01'
            });

            feed.addItem({
                pubDate: '2006-01-01'
            });

            feed.addItem({
                pubDate: '2008-01-01'
            });

            var channel = feed._build().rss[1].channel;

            expect(channel[0].lastBuildDate).to.include(' 2008 ');
            expect(channel[1].item[0].pubDate).to.include(' 2008 ');
            expect(channel[2].item[0].pubDate).to.include(' 2007 ');
            expect(channel[3].item[0].pubDate).to.include(' 2006 ');
        });
    });

    describe('#_handleTag', function() {
        it('should handle extension tag', function() {
            var feed = feedster.createFeed();
            var node = [];
            feed._handleTag(node, 'creator', 'value');
            expect(node).to.deep.equal([{
                'dc:creator': 'value'
            }]);
        });

        it('should handle rss tag', function() {
            var feed = feedster.createFeed();
            var node = [];
            feed._handleTag(node, 'pubDate', '2011-11-11');
            expect(node[0].pubDate).to.include('Fri, 11 Nov 2011');
        });

        it('should handle unknown string tag', function() {
            var feed = feedster.createFeed();
            var node = [];
            feed._handleTag(node, 'x-zzzzz', '2011-11-11');
            expect(node).to.deep.equal([{
                'x-zzzzz': '2011-11-11'
            }]);
        });
    });

    describe('#_buildHeaders', function() {
        it('should attach header elements to channel', function() {
            var feed = feedster.createFeed();
            var channelElement = [];
            feed._buildHeaders(channelElement, {
                title: 'test'
            });
            expect(channelElement).to.deep.equal([{
                title: 'test'
            }]);
        });
    });

    describe('_tagHandlers', function() {
        var node;
        var feed;

        beforeEach(function() {
            feed = feedster.createFeed();
            node = [];
        });

        describe('#pubDate', function() {
            it('should format date', function() {
                feed._tagHandlers.pubDate(feed, node, '2011-11-11');
                expect(node[0].pubDate).to.include('Fri, 11 Nov 2011');
            });
        });

        describe('#managingEditor', function() {
            it('should format name and email', function() {
                feed._tagHandlers.managingEditor(feed, node, {
                    name: 'my name',
                    email: 'my@example.com'
                });
                expect(node[0].managingEditor).to.equal('my@example.com (my name)');
            });

            it('should not format a string', function() {
                feed._tagHandlers.managingEditor(feed, node, 'zzzzz');
                expect(node[0].managingEditor).to.equal('zzzzz');
            });
        });

        describe('#webMaster', function() {
            it('should format name and email', function() {
                feed._tagHandlers.webMaster(feed, node, {
                    name: 'my name',
                    email: 'my@example.com'
                });
                expect(node[0].webMaster).to.equal('my@example.com (my name)');
            });

            it('should not format a string', function() {
                feed._tagHandlers.webMaster(feed, node, 'zzzzz');
                expect(node[0].webMaster).to.equal('zzzzz');
            });
        });

        describe('#author', function() {
            it('should format name and email', function() {
                feed._tagHandlers.author(feed, node, {
                    name: 'my name',
                    email: 'my@example.com'
                });
                expect(node[0].author).to.equal('my@example.com (my name)');
            });

            it('should not format a string', function() {
                feed._tagHandlers.author(feed, node, 'zzzzz');
                expect(node[0].author).to.equal('zzzzz');
            });
        });

        describe('#category', function() {
            it('should format single string', function() {
                feed._tagHandlers.category(feed, node, 'test');
                expect(node).to.deep.equal([{
                    category: 'test'
                }]);
            });

            it('should format multiple strings', function() {
                feed._tagHandlers.category(feed, node, ['test1', 'test2']);
                expect(node).to.deep.equal([{
                    category: 'test1'
                }, {
                    category: 'test2'
                }]);
            });

            it('should format category object', function() {
                feed._tagHandlers.category(feed, node, {
                    value: 'test',
                    domain: 'zzz'
                });
                expect(node).to.deep.equal([{
                    category: [{
                        _attr: {
                            domain: 'zzz'
                        }
                    }, 'test']
                }]);
            });
        });

        describe('#cloud', function() {
            it('should format a cloud object', function() {
                feed._tagHandlers.cloud(feed, node, {
                    domain: 'example.com',
                    port: 80
                });

                expect(node).to.deep.equal([{
                    cloud: {
                        _attr: {
                            domain: 'example.com',
                            port: 80
                        }
                    }
                }]);
            });
        });

        describe('#image', function() {
            it('should format plain url', function() {
                feed._tagHandlers.image(feed, node, 'http://www.example.com/image.png');
                expect(node).to.deep.equal([{
                    image: [{
                        url: 'http://www.example.com/image.png'
                    }]
                }]);
            });

            it('should format image object', function() {
                feed._tagHandlers.image(feed, node, {
                    url: 'http://www.example.com/image.png',
                    title: 'test'
                });
                expect(node).to.deep.equal([{
                    image: [{
                        url: 'http://www.example.com/image.png'
                    }, {
                        title: 'test'
                    }]
                }]);
            });

            it('should use defaults', function() {
                feed.headers.title = 'title-test';
                feed.headers.link = 'link-test';

                feed._tagHandlers.image(feed, node, 'http://www.example.com/image.png');
                expect(node).to.deep.equal([{
                    image: [{
                        url: 'http://www.example.com/image.png'
                    }, {
                        title: 'title-test'
                    }, {
                        link: 'link-test'
                    }]
                }]);
            });
        });

        describe('#textInput', function() {
            it('should format textInput', function() {
                feed._tagHandlers.textInput(feed, node, {
                    description: 'some input',
                    link: 'abs_path_to_script.php'
                });

                expect(node).to.deep.equal([{
                    textInput: [{
                        description: 'some input'
                    }, {
                        link: 'abs_path_to_script.php'
                    }]
                }]);
            });
        });

        describe('#guid', function() {
            it('should format guid string', function() {
                feed._tagHandlers.guid(feed, node, 'http://www.example.com/post.html');
                expect(node).to.deep.equal([{
                    guid: 'http://www.example.com/post.html'
                }]);
            });

            it('should format guid object', function() {
                feed._tagHandlers.guid(feed, node, {
                    value: 'http://www.example.com/post.html',
                    isPermaLink: true
                });
                expect(node).to.deep.equal([{
                    guid: [{
                        _attr: {
                            isPermaLink: 'true'
                        }
                    }, 'http://www.example.com/post.html']
                }]);
            });
        });

        describe('#source', function() {
            it('should format source object', function() {
                feed._tagHandlers.source(feed, node, {
                    url: 'http://www.example.com/rss',
                    title: 'My other Blog'
                });
                expect(node).to.deep.equal([{
                    source: [{
                        _attr: {
                            url: 'http://www.example.com/rss'
                        }
                    }, 'My other Blog']
                }]);
            });
        });

        describe('#enclosure', function() {
            it('should format url string', function() {
                feed._tagHandlers.enclosure(feed, node, 'http://www.example.com/show.mp3');
                expect(node).to.deep.equal([{
                    enclosure: {
                        _attr: {
                            url: 'http://www.example.com/show.mp3',
                            length: '0',
                            type: 'audio/mpeg'
                        }
                    }
                }]);
            });

            it('should format enclosure object', function() {
                feed._tagHandlers.enclosure(feed, node, {
                    url: 'http://www.example.com/show.mp3',
                    length: 12345,
                    type: 'z/r'
                });
                expect(node).to.deep.equal([{
                    enclosure: {
                        _attr: {
                            url: 'http://www.example.com/show.mp3',
                            length: 12345,
                            type: 'z/r'
                        }
                    }
                }]);
            });
        });
    });

    describe('_extensionHandlers', function() {
        var node;
        var feed;

        beforeEach(function() {
            feed = feedster.createFeed();
            node = [];
        });

        describe('#creator', function() {
            it('should define dc:creator', function() {
                feed._extensionHandlers.creator.handler(feed, node, 'my name');
                expect(node).to.deep.equal([{
                    'dc:creator': 'my name'
                }]);
            });
        });

        describe('#updatePeriod', function() {
            it('should define sy.updatePeriod', function() {
                feed._extensionHandlers.updatePeriod.handler(feed, node, 'hourly');
                expect(node).to.deep.equal([{
                    'sy:updatePeriod': 'hourly'
                }]);
            });
        });

        describe('#updateFrequency', function() {
            it('should define sy.updateFrequency', function() {
                feed._extensionHandlers.updateFrequency.handler(feed, node, 1);
                expect(node).to.deep.equal([{
                    'sy:updateFrequency': 1
                }]);
            });
        });

        describe('#atomLink', function() {
            it('should process single string', function() {
                feed._extensionHandlers.atomLink.handler(feed, node, 'http://www.example.com');
                expect(node).to.deep.equal([{
                    'atom:link': {
                        _attr: {
                            href: 'http://www.example.com'
                        }
                    }
                }]);
            });

            it('should process link object', function() {
                feed._extensionHandlers.atomLink.handler(feed, node, {
                    href: 'http://www.example.com/',
                    rel: 'self',
                    type: 'application/rss+xml'
                });

                expect(node).to.deep.equal([{
                    'atom:link': {
                        _attr: {
                            href: 'http://www.example.com/',
                            rel: 'self',
                            type: 'application/rss+xml'
                        }
                    }
                }]);
            });

            it('should set type for self', function() {
                feed._extensionHandlers.atomLink.handler(feed, node, {
                    href: 'http://www.example.com/',
                    rel: 'self'
                });

                expect(node).to.deep.equal([{
                    'atom:link': {
                        _attr: {
                            href: 'http://www.example.com/',
                            rel: 'self',
                            type: 'application/rss+xml'
                        }
                    }
                }]);
            });
        });

        describe('#hub', function() {
            it('should process hub', function() {
                feed._extensionHandlers.hub.handler(feed, node, 'http://www.example.com/');

                expect(node).to.deep.equal([{
                    'atom:link': {
                        _attr: {
                            href: 'http://www.example.com/',
                            rel: 'hub'
                        }
                    }
                }]);
            });
        });

        describe('#content', function() {
            it('should process content', function() {
                feed._extensionHandlers.content.handler(feed, node, 'test string');
                expect(node).to.deep.equal([{
                    'content:encoded': 'test string'
                }]);
            });
        });

        describe('#commentCount', function() {
            it('should process commentCount', function() {
                feed._extensionHandlers.commentCount.handler(feed, node, 123);
                expect(node).to.deep.equal([{
                    'slash:comments': 123
                }]);
            });
        });

        describe('#commentRss', function() {
            it('should process commentRss', function() {
                feed._extensionHandlers.commentRss.handler(feed, node, 'http://www.example.com');
                expect(node).to.deep.equal([{
                    'wfw:commentRss': 'http://www.example.com'
                }]);
            });
        });

        describe('#lat', function() {
            it('should process lat', function() {
                feed._extensionHandlers.lat.handler(feed, node, '67.678');
                expect(node).to.deep.equal([{
                    'geo:lat': '67.678'
                }]);
            });
        });

        describe('#long', function() {
            it('should process long', function() {
                feed._extensionHandlers.long.handler(feed, node, '67.678');
                expect(node).to.deep.equal([{
                    'geo:long': '67.678'
                }]);
            });
        });

        describe('itunes', function() {

            describe('#category', function() {
                it('should process string category', function() {
                    feed._extensionHandlers.itunes.handler(feed, node, {
                        category: 'Business'
                    });
                    expect(node).to.deep.equal([{
                        'itunes:category': {
                            _attr: {
                                text: 'Business'
                            }
                        }
                    }]);
                });

                it('should process multiple categories', function() {
                    feed._extensionHandlers.itunes.handler(feed, node, {
                        category: ['Business', 'Technology']
                    });
                    expect(node).to.deep.equal([{
                        'itunes:category': {
                            _attr: {
                                text: 'Business'
                            }
                        }
                    }, {
                        'itunes:category': {
                            _attr: {
                                text: 'Technology'
                            }
                        }
                    }]);
                });

                it('should process sub categories', function() {
                    feed._extensionHandlers.itunes.handler(feed, node, {
                        category: {
                            value: 'Business',
                            sub: ['Careers', 'Football']
                        }
                    });
                    expect(node).to.deep.equal([{
                        'itunes:category': [{
                            _attr: {
                                text: 'Business'
                            }
                        }, {
                            'itunes:category': {
                                _attr: {
                                    text: 'Careers'
                                }
                            }
                        }, {
                            'itunes:category': {
                                _attr: {
                                    text: 'Football'
                                }
                            }
                        }]
                    }]);
                });

            });

            describe('#explicit', function() {
                it('should process boolean explicit', function() {
                    feed._extensionHandlers.itunes.handler(feed, node, {
                        explicit: true
                    });
                    expect(node).to.deep.equal([{
                        'itunes:explicit': 'Yes'
                    }]);
                });

                it('should process falsy boolean explicit', function() {
                    feed._extensionHandlers.itunes.handler(feed, node, {
                        explicit: false
                    });
                    expect(node).to.deep.equal([{
                        'itunes:explicit': 'No'
                    }]);
                });
            });

            describe('#isClosedCaptioned', function() {
                it('should process boolean isClosedCaptioned', function() {
                    feed._extensionHandlers.itunes.handler(feed, node, {
                        isClosedCaptioned: true
                    });
                    expect(node).to.deep.equal([{
                        'itunes:isClosedCaptioned': 'Yes'
                    }]);
                });
            });

            describe('#complete', function() {
                it('should process boolean complete', function() {
                    feed._extensionHandlers.itunes.handler(feed, node, {
                        complete: true
                    });
                    expect(node).to.deep.equal([{
                        'itunes:complete': 'Yes'
                    }]);
                });
            });

            describe('#block', function() {
                it('should process boolean block', function() {
                    feed._extensionHandlers.itunes.handler(feed, node, {
                        block: true
                    });
                    expect(node).to.deep.equal([{
                        'itunes:block': 'Yes'
                    }]);
                });
            });

            describe('#owner', function() {
                it('should process owner object', function() {
                    feed._extensionHandlers.itunes.handler(feed, node, {
                        owner: {
                            name: 'my name',
                            email: 'my@example.com'
                        }
                    });
                    expect(node).to.deep.equal([{
                        'itunes:owner': [{
                            'itunes:name': 'my name'
                        }, {
                            'itunes:email': 'my@example.com'
                        }]
                    }]);
                });
            });

            describe('#image', function() {
                it('should process image', function() {
                    feed._extensionHandlers.itunes.handler(feed, node, {
                        image: 'http://www.example.com/logo.png'
                    });

                    expect(node).to.deep.equal([{
                        'itunes:image': {
                            _attr: {
                                href: 'http://www.example.com/logo.png'
                            }
                        }
                    }]);
                });
            });

            describe('#default', function() {
                it('should process unknown key as string', function() {
                    feed._extensionHandlers.itunes.handler(feed, node, {
                        'x-test': 'abcde'
                    });

                    expect(node).to.deep.equal([{
                        'itunes:x-test': 'abcde'
                    }]);
                });
            });
        });

        describe('#media', function() {
            it('should mix attributes and sub elements', function() {
                feed._extensionHandlers.media.handler(feed, node, {
                    url: 'http://example.com/path/to/this/blog/assets/1.jpg',
                    medium: 'image',
                    title: 'Attached image',
                    restriction: {
                        type: 'sharing',
                        relationship: 'deny'
                    }
                });

                expect(node).to.deep.equal([{
                    'media:content': [{
                        _attr: {
                            url: 'http://example.com/path/to/this/blog/assets/1.jpg',
                            medium: 'image',
                            type: 'image/jpeg'
                        }
                    }, {
                        'media:title': 'Attached image'
                    }, {
                        'media:restriction': {
                            _attr: {
                                type: 'sharing',
                                relationship: 'deny'
                            }
                        }
                    }]
                }]);
            });
        });
    });
});