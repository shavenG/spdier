const keyword = '小时前上传';
const searchValue = 'gallery';
const replaceValue = 'scroll';
const regxpSpecial = /\r|\n|\t/g;
const homepage = 'http://tu.duowan.com/m/bxgif';
const postgifbaike = 'http://www.gifbaike.com/admin/post.php';

/**
 *  import dependencies
 */
const http = require("http");
const querystring = require("querystring");
const restify = require('restify-clients');
const request = require('request');
const cheerio = require('cheerio');
const url = require('url');
const fs = require('fs');
const path = require('path');

/**
 * 
 */
const RequestHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3047.4 Safari/537.36",
    "Host": "tu.duowan.com"
};

const webClient = restify.createStringClient({
    url: homepage,
    headers: RequestHeaders
});

const postClient = restify.createStringClient({
    url: postgifbaike,
    headers: {
        "Content-Type": "application/json"
    }
});

let spiderTime = null;
let postTime = null;

let SpiderIDLE = {
    img_page_success: false,
    img_post_success: false
};

let pageList = [];

let pageIndex = 0;

const spider = {
    start: function(){
        webClient.get('', function (err, req, res, data) {
            if (err) {
                return err;
            }
            let $ = cheerio.load(data);
            $("li.box").each(function(i,e){
                if($(this).find("em").text().indexOf(keyword) > 0){
                    pageList.push($(this).find("a").attr("href"));
                }
            })

            spider.getPageList();
        });
    },
    getPageList: function(){
        spiderTime = setInterval(function () {
            if (SpiderIDLE.img_page_success == true) {
                return false;
            }

            if(pageIndex >= pageList.length){
                clearInterval(spiderTime);
                return false;
            }

            let page = pageList[pageIndex];
            pageIndex++;

            spider.getPageDetail(page.replace(searchValue,replaceValue));
        },1000);
    },
    getPageDetail: function(page){
        let postIndex = 0;
        SpiderIDLE.img_page_success = true;
        webClient.get(page,function(err, req, res, data){
            if (err) {
                return err;
            }
            console.log(page);
            let $ = cheerio.load(data);

            let postList = [];
            $("div.pic-box").each(function(i,e){
                let obj = {
                    "auto": "Post",
                    "title": $(this).find("p.comment").text(),
                    "referer": $(this).find("span.pic-box-item").attr("data-img"),
                    "image": $(this).find("span.pic-box-item").attr("data-img"),
                    "descript":  $(this).find("div.content").text().replace(regxpSpecial,"")
                }
                postList.push(obj);
            });

            postTime = setInterval(function () {
                if (SpiderIDLE.img_post_success == true) {
                    return false;
                }
    
                if(postIndex >= postList.length){
                    SpiderIDLE.img_page_success = false;
                    clearInterval(postTime);
                    return false;
                }
    
                let post = postList[postIndex];
                postIndex++;
    
                spider.postGifBaike(post);
            },100);            
        })
    },
    postGifBaike: function(obj){
        console.log(obj.image);
        SpiderIDLE.img_post_success = true;
        postClient.post('',obj,function(err, req, res, obj){
            SpiderIDLE.img_post_success = false;
            if (err) {
                return err;
            }            
            console.log(obj);
        })
    }
}

spider.start();

process.on("exit", function () {
    clearInterval(postTime);
    clearInterval(spiderTime);
});