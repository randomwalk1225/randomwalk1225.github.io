---
layout: default
title: Home
---

# Welcome to My Awesome Blog

I write about math, programming, and everything in between. I hope you find something useful or interesting here.

## Latest Posts

<div class="post-list">
  {% for post in site.posts %}
    <div class="post-card">
      <h3>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      </h3>
      <p class="post-excerpt">{{ post.excerpt }}</p>
      <p class="post-meta">
        <small>Posted on {{ post.date | date: "%B %-d, %Y" }}</small>
      </p>
    </div>
  {% endfor %}
</div>