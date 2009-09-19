---
layout: post
category: blog
---
I'm working on a project where we've amassed a decent amount of Cucumber
features. Dumping them in the root directory makes it difficult to find the
feature you're looking for and running related features is impossible.

I've fooled with organizing my cucumber features in the past, but didn't have
much luck. Grouping related features into subdirectories was fine when running
the entire suite, but running an individual feature failed because Cucumber
doesn't know to load step definitions from the parent directory. As I was
looking through `cucumber --help` the other day, I happened to notice the
`--require` flag.

    -r, --require LIBRARY|DIR
        Require files before executing the features.

Running the following command was exactly what I needed.

    cucumber --require features features/users/sign_in.feature

This tells Cucumber to load all `*.rb` files under `features/` which finds my
step definitions and support files. To save some typing, I created an alias in
`~/.bashrc`.

    alias cuc='cucumber -r features'

Where I've really enjoyed this setup is when running all related features.
After touching a step definition, I'd like to run the features that depend on it
quickly without running the _entire_ suite. Now that's as simple as:

    cuc features/users/*

