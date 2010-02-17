---
layout: post
title: Mimetic Poly-Alloy
category: blog
---
[Mimetic Poly-Alloy][github]: A [Quicksilver][]-inspired JavaScript search that
favors consecutive matching characters.

Quicksilver is great to search using acronyms or shorthand. Where it's not a
good fit is matching a string against a list of keywords. Here's when I realized
I needed to take a different approach:

    >>> "this is a test".score("this")
    0.9285714285714286
    >>> "this is a test".score("test")
    0.7821428571428569

In my application, I don't care where a match occurs; I only care about the
length of the match and if the search matched the beginning of a word.

Taking some obvious inspiration from Quicksilver, I took a naive approach and
computed a score by raising 2 to the power of the number of matching characters
and threw in an extra point if it matched the beginning of a word. In the
previous example, both searches would score 32 (2<sup>(4+1)</sup>).

Here are some examples [from the test suite][tests]:

    var input = "this is a test";

    // Really long match.
    equals(input.score("this is a test"), 32768.0, "14-character match");

    // Beginning of a word
    equals(input.score("test"), 32.0,   "4-character match");
    equals(input.score("thit"), 19.6,   "3-character and 1-character matches");
    equals(input.score("tiat"), 13.756, "4 1-character matches");
    equals(input.score("th"),   8.0,    "2-character match");
    equals(input.score("ti"),   7.6,    "2 1-character matches");

    // Middle of a word
    equals(input.score("hi"), 4.0, "2-character match");
    equals(input.score("he"), 3.8, "2 1-character matches");


If this type of search makes sense for you, give it a shot and
[fork it][github]. If this is a solved problem, [yell at me][twitter] for not
doing enough research.


[github]: http://github.com/lmarburger/mimetic_poly_alloy
[Quicksilver]: http://code.google.com/p/rails-oceania/source/browse/#svn/lachiecox/qs_score/trunk
[tests]: http://github.com/lmarburger/mimetic_poly_alloy/blob/master/test/mimetic_poly_alloy_spec.js
[twitter]: http://twitter.com/lmarburger
