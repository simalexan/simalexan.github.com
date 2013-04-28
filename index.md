---
layout: page
title: Testing Jekyll Bootstrap!
tagline: & seeing what it can do
---
{% include JB/setup %}

This will probably be my blogging platform for the new blog, I just need somethings checked

## Check more

In `_config.yml` remember to specify your own data:
    
    title : My Blog =)
    
      author :
      name : Name Lastname
      email : blah@email.test
      github : username
      twitter : username

The theme should reference these variables whenever needed.
    
## Sample Posts

This blog contains sample posts which help stage pages and blog data.
When you don't need the samples anymore just delete the `_posts/core-samples` folder.

    $ rm -rf _posts/core-samples

Here's a sample "posts list".

<ul class="posts">
  {% for post in site.posts %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>

## To-Do

- Do a lot of things, but only after I finish the side projects


