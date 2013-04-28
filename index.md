---
layout: page
title: Testing Jekyll!
tagline: & seeing what it can do
---
{% include JB/setup %}

This will probably be my blogging platform for the new blog, I just need somethings checked

## Posts

Here's a "posts list".

<ul class="posts">
  {% for post in site.posts %}
    <li><span>{{ post.date | date_to_string }}</span> &raquo; <a href="{{ BASE_PATH }}{{ post.url }}">{{ post.title }}</a></li>
  {% endfor %}
</ul>

## To-Do

- Do a lot of things, but only after I finish the side projects


