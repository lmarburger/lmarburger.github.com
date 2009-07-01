---
layout: post
title: MongoMapper Looks Promising
category: blog
---
I've been intrigued by schema-free [document-oriented databases][dod] after tinkering with [CouchDB][couchdb], but haven't found a way to integrate it into my current projects. I've heard [John Nunemaker][john] [sing the praises of MongoDB][song] in the past and today [he has officially released][mongomapper-announcement] his ActiveRecored inspired database adapter [MongoMapper][mongomapper-project].

It's got validations, callbacks, a robust find API, support for easily embedding models, and much more. The code looks almost too good to be true.

{% highlight ruby %}
class Person
  include MongoMapper::Document

  key :first_name, String
  key :last_name, String
  key :age, Integer
  key :born_at, Time
  key :active, Boolean
  key :fav_colors, Array
end
{% endhighlight %}

I hope this project becomes a huge success in the Rails community.


[dod]: http://en.wikipedia.org/wiki/Document-oriented_database
[couchdb]: http://couchdb.apache.org
[john]: http://railstips.org
[song]: http://railstips.org/2009/6/3/what-if-a-key-value-store-mated-with-a-relational-database-system
[mongodb]: http://www.mongodb.org/display/DOCS/Home
[mongomapper-announcement]: http://railstips.org/2009/6/27/mongomapper-the-rad-mongo-wrapper
[mongomapper-project]: http://github.com/jnunemaker/mongomapper/tree/master