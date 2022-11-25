# Fastko
fastko, fast korean translation. Uses [naver papago api](https://developers.naver.com/docs/common/openapiguide/).

## Screenshots
![1](https://raw.githubusercontent.com/preeded/fastko/main/images/1.png)

![2](https://raw.githubusercontent.com/preeded/fastko/main/images/2.png)

![3](https://raw.githubusercontent.com/preeded/fastko/main/images/3.png)

![4](https://raw.githubusercontent.com/preeded/fastko/main/images/4.png)

## Features

* Translate selected text
* Configure source and target language
* Recognize special symbol(ex. << and >>), and replace to alphabets(A, B, C...)
* Preprocess spaces
* Process json elements("test": "test string", ...)

## Requirements

You needs naver api id and secret.

## Extension Settings

* `fastko.client.id`: naver api id
* `fastko.client.secret`: naver api secret
* `fastko.lang.source`: source language
* `fastko.lang.target`: target language