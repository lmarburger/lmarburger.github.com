---
layout: post
category: blog
---
I learned of the wonders of [slime][slime] from [David Whittington][djwhitt]
during his [CPOSC][cposc] talk on Clojure. He would write a line of code and,
with a single keystroke, it would be whisked away and executed in a terminal
window.  This proved especially useful in his demonstration because he was able
to write and manipulate blocks of code in vim and have it execute in the REPL.
I tried it for myself when playing with Ruby and lisp to found it far more
productive than monkeying around at the command line.

You can get up and running with [slime.vim][slime.vim] in a few minutes.
[Jonathan Palardy wrote a detailed tutorial][slime.vim tutorial] describing
`slime`'s merits, his setup, and how to use it with `irb`. Absolutely worth a
quick read.

I've been meaning to find a decent solution to execute my tests from within vim
instead of having to constantly switch between it and a terminal. I came across
a [post by Paul Battley outlining his solution][running_ruby_tests_from_vim]
using [`autocmd`][autocmd] to define a few simple mappings any time a Ruby test
file or Cucumber feature is opened. He's updated the script since writing that
post, so be sure to check out the [living copy on GitHub][threedaymonk_vimrc]. I
spend a great deal of time writing Cucumber features so anything that makes
executing them less painful gets my attention.

I'm sure it's obvious where I'm going with this. Using `slime.vim`, the opened
feature or focused scenario can be sent to a terminal window to run in the
background instead of running in the foreground of vim. Here's what I ended up
with:

    augroup Cucumber
      au!
      autocmd BufNewFile,BufReadPost,BufEnter *.feature,*.story
        \ set filetype=cucumber|
        \ :nmap <leader>r :call Send_to_Screen("cucumber -r features " . expand("%") . "\n")<CR>|
        \ :nmap <leader>R :call Send_to_Screen("cucumber -r features " . expand("%") . "\:<C-R>=line(".")<CR>\n")<CR>|
    augroup END

When editing the file `features/account.feature`, the mapping `,r` (assuming
comma is your `leader`) will send the command `cucumber -r features
features/account.feature` to the `screen` session. `,R` functions similar but
appends the current line number so only the scenario your cursor is on will be
executed.

After using these mappings for a few minutes, I realized many times I'm inside a
step definition or somewhere else outside of the feature and want to re-run the
last scenario. A simple mapping to execute `!!` is all you need.

    :nmap <leader>l :call Send_to_Screen("!!\n")<CR>

A sample workflow looks something like this:

1. Setup a `screen` session as Paul describes.
1. Open a feature and write a scenario.
1. Mash `,R` to run it.
1. Tell `slime.vim` the names of your session and window.
1. Watch it fail.
1. Implement each step one-by-one and use `,l` liberally to re-run the scenario.
1. Commit.
1. Rejoice.
1. Repeat.

Some things worth mentioning:

* I tweaked `slime.vim` to [default the session and window names][slime.vim edits]
to "s0" and "w0" respectively.
* Only using `screen` a handful of times, it threw me off that it has its own
scrollback. It makes sense, but I only run one session per terminal tab so I
don't mind [disabling that feature][terminal_and_screen].
* It's also nice to default the window title to the same value configured in
`slime.vim`.

Here are the relevant lines from my [`~/.screenrc`][screenrc]:

    termcapinfo xterm* ti@:te@
    shelltitle 'w0'

And an alias I threw into [`~/.bashrc`][bashrc]:

    alias s="screen -S s0"

I'll definitely be expanding these tools to better fit my workflow. If you have
a clever addition or another approach to the problem, I'd love to see it.


[cposc]: http://www.cposc.org
[djwhitt]: http://twitter.com/djwhitt
[jpalardy]: http://technotales.wordpress.com/author/jpalardy
[paul_battley]: http://google.com
[slime]: http://common-lisp.net/project/slime
[slime.vim]: http://github.com/lmarburger/config_files/blob/master/vim/plugin/slime.vim
[slime.vim_tutorial]: http://technotales.wordpress.com/2007/10/03/like-slime-for-vim
[slime.vim edits]: http://github.com/lmarburger/config_files/blob/master/vim/plugin/slime.vim#L17-18
[running_ruby_tests_from_vim]: http://po-ru.com/diary/running-ruby-tests-from-vim
[threedaymonk_vimrc]: http://github.com/threedaymonk/config/blob/master/vimrc#L140-164
[my_vimrc]: http://github.com/lmarburger/config_files/blob/master/vimrc#L198-204
[autocmd]: http://vimdoc.sourceforge.net/htmldoc/autocmd.html
[terminal_and_screen]: http://stackoverflow.com/questions/1039442/mac-os-x-terminal-apps-buffer-and-screen-command
[screenrc]: http://github.com/lmarburger/config_files/blob/master/screenrc
[bashrc]: http://github.com/lmarburger/config_files/blob/master/bashrc
