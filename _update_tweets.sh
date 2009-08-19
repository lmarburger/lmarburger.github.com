#!/usr/bin/env ruby

require 'rubygems'
require 'grackle'

class TwitterCacher

  def update
    new_tweets.each do |new_tweet|
      file_name = create_tweet_file_name new_tweet
      content = create_tweet_content new_tweet

      File.open(file_name, File::CREAT | File::RDWR) do |file|
        file.write(content)
      end

      execute_git_command "add #{ file_name }"
      execute_git_command %{commit -m "Added a new tweet."}
    end
  end

  private

    def new_tweets
      client.statuses.user_timeline.lmarburger.json(:since_id => last_tweet_id)
    end

    def client
      @client ||= Grackle::Client.new
    end

    def last_tweet_id
      tweet_ids.last
    end

    def tweet_ids
      tweets.map do |path|
        match = path.match %r{/\d{4}-\d{1,2}-\d{1,2}-(\d+)\.md}
        match[1] if match
      end.compact.sort
    end

    def tweets
      Dir[File.join(posts_directory, '*.md')]
    end

    def posts_directory
      File.expand_path File.join(File.dirname(__FILE__), '_posts')
    end

    def create_tweet_file_name(tweet)
      created_at = Time.parse(tweet.created_at).strftime("%Y-%m-%d").gsub(/-0/, '-')
      file_name = "#{ created_at }-#{ tweet.id }.md"

      File.join(posts_directory, file_name)
    end

    def create_tweet_content(tweet)
      content = <<-EOS
---
layout: post
category: tweet
---
#{ auto_link(tweet.text) }
      EOS
    end

    def auto_link(text)
      link_usernames(link_urls(text))
    end

    def link_urls(text)
      text.gsub %r{(\S+\.\w{2,3}(?:/\S+)?)}, '[\0](\0)'
    end

    def link_usernames(text)
      text.gsub %r{@(\w+)}, '[\0](http://twitter.com/\1)'
    end

end

def execute_git_command(command)
  `/usr/local/git/bin/git #{ command }`
end

# Change to the site's dir.
Dir.chdir('/Users/Larry/Sites/lmarburger.github.com')

# Update the latest tweets.
TwitterCacher.new.update
