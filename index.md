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

<div data-gift-button></div>

<script>
  var GiftButton = GiftButton || {};
        (function() {
            var script = document.createElement('script');
            script.async = true;
            var secure = window.location.protocol === 'https:';
            script.src = (secure ? 'https' : 'http') +
                '://dev-app2.platform.giftconnect.com/gbtn/gbtn.js?pr=1234&pb=someHashValue';
            var entry = document.getElementsByTagName('script')[0];
            entry.parentNode.insertBefore(script, entry);
        })();
</script>


