var restify = require('restify');
var imageMagick = require ('./command_modules/image-magick');
var port = '8080';

var server = restify.createServer({
    name : "cloud-command"
});
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());
var pathImageMagick = '/imagemagick'
server.post({path : pathImageMagick , version: '0.0.1'} ,function convert(req, res, next) { imageMagick.convert(req,res,next);});
server.listen(process.env.port || port , function(){
    console.log('%s listening at %s ', server.name , server.url);
});
