---
layout: post
title: Simple Presenter
category: blog
---

John Nunemaker inspired me in several ways this morning. He described his
experience building an [API for Gauges][api_post] which echoes much of my own
experience with the [CloudApp API][]. Especially his third point about linking
resources instead of expecting your clients to construct their own URLs. That
road will only end in tears.

Where it really hit home was his use of a presenter to provide a JSON
representation of a model. I wanted to share some code that I've been spending
some time with lately. There were a few refactorings that have made the code
much easier to follow and reason about.

There's [one main commit][commit] that shows the majority of the presenter
implementation. It freed the main Sinatra app from having to concern itself with
how to render a thing and now it simply asks the thing to format itself. Big
difference.

{% highlight ruby %}
def fetch_and_render_drop(slug)
  drop = fetch_drop slug
  respond_to do |format|

    # Redirect to the bookmark's link, render the image view
    # for an image, or render the generic download view for
    # everything else.
    format.html do
      if drop.bookmark?
        redirect_to_api
      else
        erb drop_template(drop),
            :locals => { :drop    => drop,
                         :body_id => body_id(drop) }
      end
    end

    # Handle a JSON request for a **Drop**. Return the same
    # data received from the CloudApp API.
    format.json do
      Yajl::Encoder.encode drop.data
    end
  end
end
{% endhighlight %}


You can tell I knew the code was awful all along by the presence of comments.
Compare that with [today's version][today].

{% highlight ruby %}
def fetch_and_render_drop(slug)
  drop = DropPresenter.new fetch_drop(slug), self
  respond_to do |format|
    format.html { drop.render_html }
    format.json { drop.render_json }
  end
end
{% endhighlight %}


I think this code's job is pretty clear. Fetch the drop and ask for the correct
representation based on the format the client requested. The
[`DropPresenter`][presenter] is where the magic happens.

{% highlight ruby %}
class DropPresenter < SimpleDelegator
  def initialize(drop, template)
    @template = template

    super drop
  end

  def render_html
    if bookmark?
      @template.redirect_to_api
    else
      @template.erb template_name,
                    locals: { drop: self, body_id: body_id }
    end
  end

  def render_json
    Yajl::Encoder.encode data
  end

  # Some trivial private methods omitted.
end
{% endhighlight %}


My favorite part of this refactoring is passing a `DropPresenter` to existing
views in place of a `Drop`. Everything still works and they're none the wiser.
Having this middleman in place gives the freedom to incrementally refactor logic
out of the controller and views.

For example, here's the logic to add a logo to the page if the owner has a Free
account. It's ripe for refactoring.

{% highlight rhtml %}
<% unless drop.subscribed? %>
  <h1><a href="http://store.getcloudapp.com/">Simple sharing</a></h1>
<% end %>
{% endhighlight %}

{% highlight rhtml %}
<% unless drop.subscribed? %>
  <footer id="footer">
    <h1><a href="http://store.getcloudapp.com/">Simple sharing</a></h1>
  </footer>
<% end %>
{% endhighlight %}


**Refactoring begets refactoring.**



[api_post]:     http://railstips.org/blog/archives/2011/12/01/creating-an-api/
[cloudapp_api]: http://developer.getcloudapp.com
[viso]:         https://github.com/cloudapp/viso
[commit]:       https://github.com/cloudapp/viso/commit/012d38ebb202d56689bb7c0d6eff01129ec50ffb
[today]:        https://github.com/cloudapp/viso/blob/master/lib/viso.rb
[presenter]:    https://github.com/cloudapp/viso/blob/master/lib/drop_presenter.rb
