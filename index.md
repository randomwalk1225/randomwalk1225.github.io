---
layout: default
title: 홈
---

# 안녕하세요! 👋

**My Jekyll Blog**에 오신 것을 환영합니다.

여기는 제가 일상, 개발, 취미 등 다양한 이야기를 나누는 공간입니다.

---

## 최신 글

<ul>
{% for post in site.posts %}
  <li><a href="{{ post.url }}">{{ post.title }}</a> - {{ post.date | date: "%Y-%m-%d" }}</li>
{% endfor %}
</ul>

- [첫 번째 게시글](posts/first-post) - 2025-07-08  
  블로그 시작을 알리는 첫 글입니다.


  

- [두 번째 게시글](posts/second-post) - 2025-07-09  
  Jekyll과 GitHub Pages에 대해 소개합니다.

---

## 연락처

- 이메일: example@example.com  
- 깃허브: [github.com/username](https://github.com/username)
