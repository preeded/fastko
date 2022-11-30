# Fastko
fastko, fast korean translation. 
[naver papago api](https://developers.naver.com/docs/common/openapiguide/)를 사용합니다.

## Screenshots
![1](https://raw.githubusercontent.com/preeded/fastko/main/images/1.png)

![2](https://raw.githubusercontent.com/preeded/fastko/main/images/2.png)

![3](https://raw.githubusercontent.com/preeded/fastko/main/images/3.png)

![4](https://raw.githubusercontent.com/preeded/fastko/main/images/4.png)

## Features

* 선택된 텍스트 번역
* source와 target 언어 설정(기본은 en, ko)
* 역번역(target 언어를 source 언어로)
* 특별한 기호를 인식(ex. << and >>), 그리고 알파벳들로 치환, 그 후 복원
* 공백 전처리
* JSON 요소들 처리("test": "test string" 및 "string1", "string2", "string3"
* 다양한 괄호 및 따옴표 처리

## Requirements

네이버 api의 id와 secret이 필요합니다.

## Extension Settings

* `fastko.client.id`: naver api id
* `fastko.client.secret`: naver api secret
* `fastko.lang.source`: source language
* `fastko.lang.target`: target language