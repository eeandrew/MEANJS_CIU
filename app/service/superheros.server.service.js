'use strict';

/**
 *create updater resources
 */

var fs = require('fs-extra');
var propReader = require('properties-reader');
var Q = require('q');
var Promise  = require('bluebird');
var mongoose = require('mongoose');
var Superhero = mongoose.model('Superhero');
var svn = require('svn-spawn');
var rmdir = require('rimraf');
var mkdir = require('mkdirp');


function makeDir(dirName,versionName,socket,convertedArray,validLineCount,superhero,releaseType) {
	var toDirRoot = getPropertyByName('OUTPUT_ROOT_DIR');
	var toPath = toDirRoot + '/' + versionName + '/' + dirName;
	//var defer = Q.defer();
	fs.mkdirs(toPath,function(err){
		if(err)return console.error(err);
		console.log('Make directory ' + toPath + ' |SUCCESS|');
		//return defer.resolve();
		convertedArray.push(toPath);
		console.log(convertedArray.length);
		
		// socket.emit('updater-inf-line-count',{
		// 		infLine:validLineCount,
		// 		convertedLine:convertedArray.length,
		// 		superhero: superhero
		// 	});
		if(convertedArray.length === validLineCount-1){
			//convertedArray.length = 0;
			updateSuperhero(superhero,socket,convertedArray,validLineCount,releaseType);
		}
	});
	//return defer.promise;
}

function makeDirectory(dirName,productVersion,finishedTasks) {
	var dirRoot = getPropertyByName('PRODUCT_OUTPUT_DIR') + '\\' + getProductCode(productVersion);
	var toPath = dirRoot + '\\' + translateInf(dirName,productVersion);
	fs.mkdirs(toPath,function(err){
		if(err) throw err;
		console.log('Make directory ' + toPath + ' |SUCCESS|');
		finishedTasks.push(toPath);
	});
}



/**
 * Move file or directory
 */
function moveFile(fromFile,toFile,versionName,socket,convertedArray,validLineCount,superhero,releaseType) {
	var fromDirRoot = getPropertyByName('INPUT_ROOT_DIR');
	var toDirRoot = getPropertyByName('OUTPUT_ROOT_DIR');

	var fromPath = fromDirRoot + '/' + fromFile;
	var toPath = toDirRoot + '/' + versionName + '/' + toFile;

	console.log('Copy from ' + fromPath + ' to ' + toPath);
	fs.copy(fromPath,toPath,function(err){
		if(err) return console.error(err);
		convertedArray.push(toPath);
		console.log(convertedArray.length);
		
		console.log('Move from ' + fromPath + ' to ' + toPath + ' |SUCCESS|');
		// socket.emit('updater-inf-line-count',{
		// 		infLine:validLineCount,
		// 		convertedLine:convertedArray.length,
		// 		superhero: superhero
		// 	});
		if(convertedArray.length === validLineCount-1){
			//convertedArray.length = 0;
			updateSuperhero(superhero,socket,convertedArray,validLineCount,releaseType);
		}
	});
}

function copyFile(fromDir,toDir,rootDir,productVersion,finishedTasks) {
	var fromDirRoot;
	if(fromDir.indexOf('$IMMUTABLE_INF') ===0) {
		fromDirRoot = translateInf(fromDir,productVersion);
	}else{
		 fromDirRoot = rootDir + '\\' + translateInf(fromDir,productVersion);
	}
	var toDirRoot = getPropertyByName('PRODUCT_OUTPUT_DIR') + '\\' + getProductCode(productVersion)  + '\\' + translateInf(toDir,productVersion);
	console.log('Start to copy from ' + fromDirRoot + ' To ' + toDirRoot);
	fs.copy(fromDirRoot,toDirRoot,function(err){
		if(err) 
			{
				console.log('error from ' + fromDirRoot);
				console.log('error to' + toDirRoot);
				throw err;
			};
		console.log('Copy from ' + fromDirRoot + ' To ' + toDirRoot + ' SUCCESS ');
		finishedTasks.push(toDir);
		if(getProductCode(productVersion).indexOf('cws')>=0 && new RegExp('CJK_DB$').test(toDir.trim())){
			modifyContent('#cjk_folder_modify',productVersion,finishedTasks); 
		}
		if(getProductCode(productVersion).indexOf('cws')>=0 && new RegExp('COMPTFVERSION_win.inf$').test(fromDir.trim()))
			modifyContent('#com_inf_modify',productVersion,finishedTasks);
	});
}

function getPropertyByName(propName) {
	var properties = propReader('./download/conf/PATH.ini');
	return properties.get(propName);
}

function isEmpty(str){
	return (!str || str.length === 0 || !str.trim());
}

function ignoreDataLine(str) {
	return isEmpty(str) || str.indexOf('[') >=0;
}

function updateSuperhero(superhero,socket,convertedArray,validLineCount,releaseType) {
	var condition = {version:superhero.version};
	var update;
	if(releaseType === 'test')
	update = {testReleaseTimes: ++superhero.testReleaseTimes};
	else if(releaseType === 'formal') {
	update = {releaseTimes: ++superhero.releaseTimes};	
	}
	var options = {multi:false};
	Superhero.update(condition,update,options,function(err,numAffected){
		if(!err){
			// socket.emit('updater-inf-line-count',{
			// 	infLine:validLineCount,
			// 	convertedLine:validLineCount,
			// 	superhero:superhero
			// });
			convertedArray.push('last');
			console.log(numAffected);
		}else{
			console.log(err);
		}
	});
}



var promiseWhile = function(condition, action) {
    var resolver = Promise.defer();
    var loop = function() {
        if (!condition()) return resolver.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };
    process.nextTick(loop);
    return resolver.promise;
};


function generateETJAR(taskName,product,finishedTasks) {
	if(isEmpty(product.etjarSvnUrl) ||product.etjarSvnUrl.indexOf('No') === 0){
		finishedTasks.push(taskName);
	} else {
		var svnClient = new svn({
			cwd: getPropertyByName('SVN_WORK_DIR'),
			username: getPropertyByName('SVN_USERNAME'),
			password: getPropertyByName('SVN_PASSWORD')
		});

		var svnWorkingDir = getPropertyByName('SVN_WORK_DIR') + '\\' + product.productVersion;
		//Delete Directory
		rmdir(svnWorkingDir,function(err,data){
			//Create Directory
			mkdir(svnWorkingDir,function(err,data){
				//Checkout pre-apply exceptional task
				svnClient.cmd(['checkout',product.etjarSvnUrl,svnWorkingDir],function(err,data){
				console.log('err ' + err);
				console.log('err ' + data);
                    //User spawn to execute the command
				var spawn = require('child_process').spawn;
				var command = 'cd ' + svnWorkingDir + '&' + 'mvn package';
                var mvnCmd = spawn('cmd',['/c',command]);
                    //Don't care about the data,just the final code
                mvnCmd.on('close',function(code){
                    var toDir = getPropertyByName('PRODUCT_OUTPUT_DIR') + '\\' + getProductCode(product.productVersion) + '\\' + product.productVersion + '\\' + 'ET' + '\\' +'et.jar';
                    var fromDir = svnWorkingDir + '\\' + 'pom.xml';
                    fs.copy(fromDir,toDir,function(err){
                        finishedTasks.push(taskName);
                    });
                });
			});
			});
		});
	}
}

exports.getLineCount = function(fileName){
	var data = fs.readFileSync('./download/conf/' + fileName,'utf8');
	var validLineCount = 0;
		var pathList = data.split('\n');
		for(var i=0;i<pathList.length;i++){
			if(!ignoreDataLine(pathList[i])){
				++validLineCount;
			}
		}
		return validLineCount;
}

function sendUpdaterProgressMessage(updater,socket,roomName,validLineCount,convertedArray) {
  var interval;
  var count = 0;
  interval = setInterval(function(){
  	var data = {
  			infLine:validLineCount,
			convertedLine:convertedArray.length,
			superhero:updater.superhero
  		};
  	if( validLineCount == convertedArray.length) {
  		console.log(convertedArray.length);
  		clearInterval(interval);
  	}else {
  		console.log(convertedArray.length);
  	}
  	socket.emit('updater-inf-line-count',data);
  	socket.to(roomName).emit('updater-inf-line-count',data);
  },100);
}

function sendProductProgressMessage(product,socket,totalTasks,finishedTasks) {
	var interval;
	interval = setInterval(function(){
		var data = {
			status : 1,
			totalTasks : totalTasks,
			finishedTasks : finishedTasks.length, 
			productVersion : product.productVersion
		};
		if(totalTasks == finishedTasks.length) {
			clearInterval(interval);
		}
		socket.emit(product.productVersion.toLowerCase(),data);
		socket.to(product.productVersion.toLowerCase().trim()).emit(product.productVersion.toLowerCase(),data);
	},100);
}

function getProductCode(productVersion) {
	if(productVersion.substring(0,3).indexOf('CWS') >=0 || productVersion.substring(0,3).indexOf('cws') >=0)
	{
		return productVersion.substring(0,3).toLowerCase();
	}else if(productVersion.substring(0,3).indexOf('VER') >=0 || productVersion.substring(0,3).indexOf('ver') >=0) {
		return 'cjk';
	}
	
}

function getProductInfFile(productVersion) {
	return 'convert_' + getProductCode(productVersion) + '.inf';
}

function translateInf(infLine,PTFVersion) {
	var inmmutableinf_dir = getPropertyByName('IMMUTABLEINF_DIR');
	var COMPTFversion = 'COM' + PTFVersion.substring(3);
		//Replace $PTFVERSION
		return infLine.replace(/\$PTFVERSION/g,PTFVersion)
					   .replace(/\$COMPTFVERSION/g,COMPTFversion)
					   .replace(/\$IMMUTABLE_INF/g,inmmutableinf_dir);
}

function modifyContent(command,productVersion,finishedTasks) {
	var productRootDir = getPropertyByName('PRODUCT_OUTPUT_DIR') + '\\' + getProductCode(productVersion) + '\\' + productVersion + '\\' + 'CJK_DB';
	if(command.indexOf('#cjk_folder_modify') >= 0) {
		fs.readdir(productRootDir,function(err,files){
			if(err) throw err;
			for(var i=0;i<files.length;i++) {
				if(files[i] === 'data') {
					fs.renameSync(productRootDir + '\\' + 'data',productRootDir + '\\' + 'cjkdata');
				}else if(files[i] === 'create'){
					fs.renameSync(productRootDir + '\\' + 'create',productRootDir + '\\' + 'cjkcreate');
				}else if(files[i] === 'execute'){
					fs.renameSync(productRootDir + '\\' + 'execute',productRootDir + '\\' + 'cjkexecute');
				}else if(files[i] === 'pgm'){
					fs.renameSync(productRootDir + '\\' + 'pgm',productRootDir + '\\' + 'cjkpgm');
				}else if(files[i] === 'replace'){
					fs.renameSync(productRootDir + '\\' + 'replace',productRootDir + '\\' + 'cjkreplace');
				}
			}
			finishedTasks.push('#cjk_folder_modify'); 
		});
	}else if(command.indexOf('#com_inf_modify') >= 0) {
		fs.readFile(productRootDir + '\\' + productVersion+'_win_com_DB.inf','utf8',function(err,data){
			if(err) throw err;
			var result = data.replace(/\[data\]/g,'[cjkdata]')
							 .replace(/\[create\]/g,'[cjkcreate]')
							 .replace(/\[execute\]/g,'[cjkexecute]')
							 .replace(/\[pgm\]/g,'[cjkpgm]')
							 .replace(/\[replace\]/g,'[cjkreplace]');
			console.log(result);
			fs.writeFile(productRootDir + '\\' + productVersion+'_win_com_DB.inf',result,'utf8',function(err){
				if(err) throw err;
				finishedTasks.push('#com_inf_modify');
			});
		});
	}
}
/**
 *1. Gather release file
 *2. Updater superhero
 *3. Send email -- Todo
 */ 
exports.releaseCompanyUpdater = function(updater,socket) {
	var convertedArray = [];
	var versionName = updater.updaterVersion;
	var validLineCount = this.getLineCount('convert_updater.inf') + 1;
	var releaseType = updater.releaseType;
	sendUpdaterProgressMessage(updater,socket,updater.roomName,validLineCount,convertedArray);
	//updateSuperhero(data.superhero);
	fs.readFile('./download/conf/convert_updater.inf','utf8',function(err,data){
		if(err) throw err;
		var pathList = data.split('\n');
		for(var i=0;i<pathList.length;i++) {
			if(!ignoreDataLine(pathList[i])) {
				if(pathList[i].trim().indexOf(':') === 0){
					makeDir(pathList[i].replace(':','').trim(),versionName,socket,convertedArray,validLineCount,updater.superhero,releaseType);
				}
				else {
					var dirs = pathList[i].split(':');
					var fromDir = dirs[0].trim();
					var toDir = dirs[1].trim();
					moveFile(fromDir,toDir,versionName,socket,convertedArray,validLineCount,updater.superhero,releaseType);
				}
			}
		}
	});
}

exports.convertProductForCompanyUpdater = function(product,socket) {
	var finishedTasks = [];
	var productInfFile = getProductInfFile(product.productVersion);
	var totalTasks = this.getLineCount(productInfFile);
	var targetDir =  getPropertyByName('PRODUCT_OUTPUT_DIR') + '\\' + getProductCode(product.productVersion) + '\\' + product.productVersion;
	sendProductProgressMessage(product,socket,totalTasks,finishedTasks);
	rmdir(targetDir,function(err,data){
		fs.readFile('./download/conf/' + productInfFile,'utf8',function(err,data){
			if(err) throw err;
			var pathList = data.split('\n');
			//translateInf(pathList,product.productVersion);
			for(var i=0;i<pathList.length;i++) {
				if(!ignoreDataLine(pathList[i])) {
					if(pathList[i].trim().indexOf('>') === 0) {
						makeDirectory(pathList[i].replace(':','').trim(),product.productVersion,finishedTasks)
					}else if(pathList[i].trim().indexOf('#') === 0) {
						//modifyContent(pathList[i].trim(),product.productVersion,finishedTasks);
						if(pathList[i].trim().indexOf('create_et_jar') >= 0){
							generateETJAR('create_et_jar',product,finishedTasks);
						}
					}else {
						var dirs = pathList[i].split('>');
						var fromDir = dirs[0].trim();
						var toDir = dirs[1].trim();
						copyFile(fromDir,toDir,product.productDirectory,product.productVersion,finishedTasks)
					}
				}
			}
		});
	});
}

exports.releaseCompanyUpdaterSync = function (versionName) {
	var defer = Q.defer();
	fs.readFile('./download/conf/svn_commit.inf','utf8',function(err,data){
		if(err) throw err;
		if(!data || isEmpty(data)) throw 'empty file';
		var pathList = data.split('\n');
		var promise = undefined;
		var i=0;
		var stop = pathList.length;
		promiseWhile(function(){return i < stop;},function(){
			return new Promise(function(resolve,reject){
					if(!ignoreDataLine(pathList[i])){
						if(pathList[i].trim().indexOf(':') === 0){
							makeDir(pathList[i].trim().replace(':','').trim(),versionName,resolve);
						}
						else{
							var dirs = pathList[i].split(':');
							var fromDir = dirs[0].trim();
							var toDir = dirs[1].trim();
							moveFile(fromDir,toDir,versionName,resolve);
						}
					}else {
						resolve();
					}
					++i;
			});
		}).then(function(){
			console.log(2);
			return defer.resolve();
		});
	});
	return defer.promise;
};





