const categorys = ['小工具','购物比价','游戏','开发工具','网页增强','游戏娱乐'];
const postgifbaike = 'http://www.gifbaike.com/admin/post.php';

const homepage = 'https://ext.chrome.360.cn';
const querystring = '/provider/extlist/?count=10&sortType=download&token=1&category=';

/**
 *  import dependencies
 */
const restify = require('restify-clients');
const cheerio = require('cheerio');
const urlencode = require('urlencode');


/**
 * 
 */
const RequestHeaders = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3047.4 Safari/537.36",
    "Host": "ext.chrome.360.cn"
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
    spider_start_status: false,
    ext_post_status: false
};

let extList = null;
let extIndex = 0;
let categoryIndex = 0;

const spider = {
    start: function(){
        spiderTime = setInterval(function(){
            if (SpiderIDLE.spider_start_status == true) {
                return false;
            }
            SpiderIDLE.spider_start_status = true;
            console.log("###" + categorys[categoryIndex]);
            let url = homepage + querystring + urlencode.encode(categorys[categoryIndex]);
            webClient.get(url, function (err, req, res, data) {
                categoryIndex++;
                
                if (err) {
                    return err;
                }

                if(categoryIndex >= categorys.length){
                    clearInterval(spiderTime);
                    return false;
                }

                extIndex = 0;
                extList = JSON.parse(data).list; 
                SpiderIDLE.ext_post_status = false;
                spider.getExtDetail();
            });
        },1000);
    },
    getExtDetail: function(){
        postTime = setInterval(function(){
            if (SpiderIDLE.ext_post_status == true) {
                return false;
            }
            SpiderIDLE.ext_post_status = true;

            if(extIndex >= extList.length){
                SpiderIDLE.spider_start_status  = false;
                clearInterval(postTime);                
                return false;
            }
            console.log(extIndex);
            spider.postSoxiazai(extList[extIndex]);
            extIndex++; 
        },1000)
    },
    postSoxiazai: function(data){
        console.log(data);
        SpiderIDLE.ext_post_status = false;
    }
}

spider.start();

process.on("exit", function () {
    clearInterval(postTime);
    clearInterval(spiderTime);
});