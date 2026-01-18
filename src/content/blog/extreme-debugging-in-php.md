---
title: 'Extreme Debugging in PHP: Building Custom Debug Binaries with Docker and GDB'
description: 'Learn how to tackle the most elusive PHP bugs using custom-built debug binaries, Docker, GDB, and PHPUnit. A comprehensive deep dive into extreme debugging techniques for real-world PHP development scenarios.'
pubDate: '2022-12-01'
updatedDate: '2026-01-18'
heroImage: '../../assets/php-gdb.webp'
category: 'Debugging'
tags:
  - PHP
  - Debugging
  - GDB
  - Docker
  - PHPUnit
  - xdebug
  - Software Engineering
  - Troubleshooting
  - PHP Development
  - Advanced Debugging
excerpt: |
  When PHPUnit crashes with exit code 143 and coverage generation fails silently, standard debugging tools won\'t help. Learn how to build custom PHP debug binaries, use GDB to trace crashes, and debug deep PHP internals using Docker, custom builds, and advanced debugging techniques.
keywords:
  - PHP debugging
  - GDB PHP
  - PHP debug binaries
  - Docker PHP debugging
  - PHPUnit debugging
  - PHP crash debugging
  - xdebug configuration
  - PHP custom build
  - PHP internals debugging
  - advanced PHP debugging
---

It was one of those awkward, lonely and quiet nights. I could not tell what [Spotify](https://open.spotify.com/track/0nMKVMCXCmRplsKKLt1TTh) was playing, nor what time it was. My eyes were fixed on my terminal's cursor. It was blinking, constantly blinking, like it was taunting me.

Some of my PHPUnit tests were crashing unexpectedly while trying to generate code coverage. There was no exception, no error message, no stack trace—nothing. The coverage report was never created and the PHP process was exiting silently with code `143`.

What the actual 🤬?

This is a story about **extreme PHP debugging**—when standard debugging tools fail and you need to dive deep into PHP's internals using custom debug binaries, Docker containers, and the GNU Debugger (GDB) to track down crashes that occur at the C level.

So, first things first. How can you debug your tests, or even PHPUnit in such a case? The answer is easy. You don’t because you can’t. Such behavior alludes that something quite sinister lurks in your code. Something that crashes deep inside PHP’s code. A statement, whose existence, creates a fatal error.

But we aren’t here to talk about what you can’t do. We are here to talk about what you can, actually, do.

## You can debug PHP

I’ve lost count how many times I stumbled across a similar issue. Normally, I would totally ignore the issue. I would try my tests one by one in order to determine which one is the problematic. I would surrender, had I not been able to pinpoint the problematic piece of code. But I am not that person and I suspect that you aren’t that person as well. So… Let’s debug it.

For starters, you can’t debug PHP with pre-compiled PHP binaries. You have to properly configure and compile your own binaries! And since we’ll need a whole toolchain for this, let’s Dockerize it.

> I’m using Debian for this Docker image, but feel free to use the linux flavor you prefer.

## 👶 Baby Steps

```dockerfile
FROM debian:bullseye-slim
WORKDIR /php
```

We, obviously, need to install the minimum set of dependencies to build PHP, so let’s have a look at the [official repo](https://github.com/php/php-src#readme):

```dockerfile
RUN apt-get update && apt-get install -y pkg-config build-essential \
    autoconf bison re2c libxml2-dev libsqlite3-dev
```

We need to fetch the source for the PHP version we want to build. Luckily, we will not have to `git clone` PHP’s repo, since PHP offers source code [downloads](https://www.php.net/downloads.php) in their page. We’ll use PHP 7.4.33 and we need a way to download it into our image. Unfortunately `wget` is not installed in `bullseye-slim` so we’ll have to `apt-get` it as well.

So, we’ll go to the previous step where we are fetching PHP’s dependencies and we’ll add `wget` as well.

After doing so, we are ready to download PHP:

```dockerfile
RUN wget -nv https://www.php.net/distributions/php-7.4.33.tar.gz && \
    tar xzf php-7.4.33.tar.gz
WORKDIR /php/php-7.4.33
```

We have downloaded, extracted and cd’d into PHP’s source! Now what? We’ll have to generate the configuration and configure the build prior to compiling:

```dockerfile
RUN ./buildconf -f
```

At this point, we are ready to configure and compile PHP 7.4.33. However, this isn’t a simple, copy snippet / paste snippet, case.

1. You have to know how you want to configure your binaries.
2. You have to know which PHP extensions your code requires.
3. You have to know whether to enable or disable something.

And this is a process of thinking, reading, trying and failing, until you succeed.

So, build your image, create a container and open a shell into it. Your working directory will be the one where PHP’s sources lie. Type `./configure --help | more` and read through the extensive list of configuration options. A minimum debug build requires the flag `--enable-debug`.

However, in my case, and most probably in yours as well, you’ll need some other stuff too. Such as cURL, sockets or intl. And in order to set up these, you’ll have some [fun](https://dwarffortresswiki.org/index.php/DF2014:Losing).

## 🛠️ Configuring and Building PHP

Make a list of the extensions you need included and features you need enabled (or disabled). **DO NOT ADD THE CONFIGURE OPTIONS TO THE DOCKERFILE, YET.**

> I repeat, DO NOT ADD THEM TO THE DOCKERFILE, YET!

You remember me telling you, to open a shell into the container you built? The reason you need it, is because you will have to **fetch the extensions’ dependencies**.

> Didn’t I tell you that this is going to be fun?

```shell
./configure --enable-fpm \
    --enable-debug \
    --with-openssl \
    --with-zlib \
    --with-curl \
    --enable-gd \
    --with-gettext \
    --enable-intl \
    --with-ldap \
    --with-mysqli \
    --enable-pcntl \
    --enable-sockets \
    --enable-sysvmsg \
    --with-xsl \
    --with-zip \
    --enable-mbstring \
    --with-pdo-mysql \
    --disable-short-tags
```

The configure script is going to perform some checks and crash at some point or another, complaining about not being able to find some development dependencies. If it can’t find `ldap` you’ll probably have to `apt-get install libldap-dev`. If it can’t find Oniguruma, you’ll (not obviously, but probably) have to install `libonig-dev`. Rinse and repeat. Use common sense, apt-cache search and Google, in order to determine what you actually need.

When you have gathered every package you have to install, you’ll have to modify your Dockerfile so that they get fetched, before you even attempt to configure PHP.

Before venturing forth, run a `make clean && make -j${nproc} && make install`. Just in case. If everything went well, `php -v` should give you output, stating it’s version and that it is a `NTS DEBUG` build.

> #EverythingIsAwesome.

At this point, we’ll also need xdebug. You know the drill. Grab its source in `tar.gz` format from xdebug’s downloads page, bring it into the container and extract it is its own directory. `phpize`, `configure`, `make`.

When everything is tested in the container you are working, you should move everything into your Dockerfile. It should look something like this:

```dockerfile
FROM debian:bullseye-slim

RUN apt-get update && \
    apt-get upgrade && \
    apt-get install pkg-config build-essential autoconf bison re2c wget gdb \
    libxml2-dev libsqlite3-dev libonig-dev libz-dev \
    libssl-dev libcurl4-openssl-dev libzip-dev libpng-dev \
    libldap-dev libxslt-dev

WORKDIR /php
# Download PHP & xdebug
RUN wget -nv https://www.php.net/distributions/php-7.4.33.tar.gz && \
    tar xzf php-7.4.33.tar.gz && \
    wget -nv https://xdebug.org/files/xdebug-3.1.6.tgz && \
    tar xzf xdebug-3.1.6.tgz

# Build PHP
WORKDIR /php/php-7.4.33

RUN mkdir -p /usr/local/etc/php/conf.d/

RUN ./buildconf -f && \
    ./configure --enable-fpm \
    --enable-debug \
    --with-openssl \
    --with-zlib \
    --with-curl \
    --enable-gd \
    --with-gettext \
    --enable-intl \
    --with-ldap \
    --with-mysqli \
    --enable-pcntl \
    --enable-sockets \
    --enable-sysvmsg \
    --with-xsl \
    --with-zip \
    --enable-mbstring \
    --with-pdo-mysql \
    --disable-short-tags \
    --with-config-file-scan-dir=/usr/local/etc/php/conf.d/ && \
    make clean && \
    make -j${nproc} && \
    make install

# Build xdebug
WORKDIR /php/xdebug-3.1.6

RUN phpize && \
    ./configure --enable-xdebug && \
    make -j${nproc} && \
    make install

RUN mkdir -p /var/www/html/

WORKDIR /var/www/html
```

## It’s party time! 🥳

If you are observant enough, you’ll already have noticed that I added [`gdb`](https://en.wikipedia.org/wiki/GNU_Debugger) in the packages I am fetching into our image. We’ll need the GNU debugger in order to make PHP crash, then investigate why it crashed.

But before even attempting this, we’ll have to properly configure PHP. php.ini and the likes.

You’ll need, at least, to increase the `memory_limit`, to enable xdebug and to set `xdebug.mode` to `coverage`. If you are still reading me, you’ll probably have guessed (correctly) that I’ll tell you to **R**ead **T**he **F**ine **M**anual, on how to do such things. Yes, I know that you can spam `-d` flags to PHP, however I highly suggest to craft a `php.ini` and an `xdebug.ini` (and each and every other .ini for each and every other extension you need configured).

And (not only that, but mostly) that is the reason, you will definately need a `docker-compose.yaml`. You’ll have to mount your project at `/var/www/html` and you’ll have to mount the directory containing your PHP configuration at `/usr/local/etc/php/conf.d/`

Is your container ready yet?

Open a shell into it…

<hr/>

I cannot say that I am a debugging expert, nor that I navigate through gdb’s commands with ease. I usually work on a _need-to-know_ basis; Google is my best friend. So, unfortunately, this cannot be a gdb tutorial. But I can, at this point, give you some insight into what’s going on.

Assuming that everything went fine, your cursor should be blinking and waiting to do thy bidding. Type `gdb php` in order to load PHP into the debugger and watch the cursor blink again. We’ll actually need to run something. In my case I have to `r ./vendor/bin/phpunit --coverage-clover=clover.xml`

> # And it crashed… 🤬

Now, we’ll have to figure out why it crashes. Let’s type `bt` in order to examine the [stack](https://en.wikipedia.org/wiki/Call_stack)… Get a [cheat sheet](https://gist.github.com/rkubik/b96c23bd8ed58333de37f2b8cd052c30#file-cheat_sheet-txt-L18) and happy hunting!

<hr/>

It took me hours to understand what the problem was. PHP was actually trying to perform an invalid operation. I not only had to examine the stack and functions’ parameters. I had PHP’s source code, side by side with my debugger, trying to understand what each line was doing.

Eventually, after hours and hours of examing the values of structures and pointers, reading through C code and trying to follow the execution path, I pinpointed the source of all evil. It was a relatively safe `shell_exec`, hidden in a destructor. It seems that, somehow; don’t ask, I never understood; PHP tried to execute this destructor and then all hell broke loose.

Moral of the story? I should have listened to [Psalm](https://psalm.dev/), when it warned me that this piece of code was [forbidden](https://psalm.dev/docs/running_psalm/issues/ForbiddenCode/). But more importantly, when standard PHP debugging tools fail, you now know how to build custom debug binaries, use GDB to trace crashes, and debug PHP at the C level.

## Key Takeaways

- **Custom PHP debug binaries** are essential for debugging crashes in PHP internals
- **Docker** provides an isolated environment for building and debugging PHP from source
- **GDB (GNU Debugger)** allows you to trace crashes and examine the call stack at the C level
- **Xdebug** must be compiled from source when building custom PHP binaries
- **Static analysis tools** like Psalm can help prevent these issues before they occur
- When PHPUnit crashes silently, the problem often lies in PHP's C internals, not your PHP code

This extreme debugging approach isn't for everyday issues, but when you're facing crashes that standard debugging tools can't handle, building custom debug binaries and using GDB is your path forward.