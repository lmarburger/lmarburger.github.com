require 'rubygems'
require 'grackle'

desc 'Update tweets'
task :update_tweets do
  TweetsToJekyll.new.update_tweets
end

task :default => :update_tweets

# Set the path to the git binary.
GIT_PATH = '/usr/local/git/bin/git'

class TweetsToJekyll

  def update_tweets
    new_tweets.each do |new_tweet|
      file_name = create_tweet_file_name new_tweet
      content = create_tweet_content new_tweet

      File.open(file_name, File::CREAT | File::RDWR) do |file|
        file.write(content)
      end

      Git.execute "add #{ file_name }"
      Git.execute %{commit -m "Added a new tweet: http://twitter.com/lmarburger/status/#{ new_tweet.id }"}
    end
  end

  private

    def client
      @client ||= Grackle::Client.new
    end

    def new_tweets
      client.statuses.user_timeline.lmarburger.json(:since_id => tweet_ids.last)
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
#{ AutoLink.link_content(tweet.text) }
      EOS
    end

  class AutoLink

    def self.link_content(content)
      content = format_line_breaks content
      content = link_urls content
      link_usernames content
    end

    private

      URL_RE = %r{ https?://\S+ }x
      USERNAME_RE = %r{ @(\w+) }x

      # Add two spaces to the end of the previous line when there is
      # a line break in a tweet so Markdown will know we want a BR.
      def self.format_line_breaks(text)
        text.gsub %r{\n}, "  \n"
      end

      def self.link_urls(text)
        text.gsub URL_RE, '[\0](\0)'
      end

      def self.link_usernames(text)
        text.gsub USERNAME_RE, '[\0](http://twitter.com/\1)'
      end

  end

  class Git

    def self.execute(command)
      system "#{ GIT_PATH } #{ command }"
    end
  end

end
