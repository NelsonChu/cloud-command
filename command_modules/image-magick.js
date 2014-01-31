/**
 * Created by nchu on 1/29/14.
 */
exports.convert = function convert(req, res, next) {
    var response = {};
    var cmd = {};
    cmd.fromBucket = req.params.fromBucket;
    cmd.fromKey = req.params.fromKey;
    cmd.toBucket = req.params.toBucket;
    cmd.toKey = req.params.toKey;
    cmd.command = req.params.command;
    res.setHeader('Access-Control-Allow-Origin','*');
    var path = require('path');
    var appDir = path.dirname(require.main.filename).replace(/\\/g, '/');
    var fs = require('fs');
    var mkdirp = require('mkdirp');
    var guid = require('guid');
    var _ = require('underscore');
    var aws = require('aws-sdk');
    aws.config.loadFromPath(appDir+'/config.json');
    var uploadObjectPath = guid.create()+'/'+cmd.toKey;
    var localFileName = guid.create() + '.' + _.last(cmd.fromKey.split('.'));
    var inLocalPath = appDir+'/s3/'+cmd.fromBucket+'/';
    var outLocalPath = appDir+'/s3/'+ cmd.toBucket+'/'+guid.create()+'/';
    response.BucketName = cmd.toBucket;
    response.KeyName = uploadObjectPath;
    var commandLine= cmd.command.replace('{input}',inLocalPath+localFileName).replace('{output}',outLocalPath+cmd.toKey);
    var s3 = new aws.S3();
    mkdirp(inLocalPath, function (err) {
        if (err) {console.error(err);}
        else{
            var file = fs.createWriteStream(inLocalPath+localFileName);
            s3.getObject({Bucket: cmd.fromBucket, Key: cmd.fromKey}).
                on('httpData', function(chunk) { file.write(chunk); }).
                on('httpDone', function() { file.end();
                    mkdirp(outLocalPath, function (err) {
                        if (err) {console.error(err);}
                        else {
                            var exec = require('child_process').exec;
                            exec(commandLine, convertCallback);
                            function convertCallback(error, stdout, stderr)
                            {
                                fs.readFile(outLocalPath+cmd.toKey, function (err, data) {
                                    if (err) { throw err; }
                                    var s3bucket = new aws.S3({params: {Bucket: cmd.toBucket}});
                                    s3bucket.createBucket(function() {
                                        var putRequest = {Key: uploadObjectPath, Body: data};
                                        s3bucket.putObject(putRequest, function(err, putRequest) {
                                            if (err) {
                                                console.log("Error uploading data: ", err);
                                            } else {
                                                console.log("Successfully uploaded data to "+response.BucketName+'/'+response.KeyName);
                                            }
                                        });
                                    });
                                });
                            }
                        }
                    });
                }).
                send();
        }
    });
    res.send(response);
};