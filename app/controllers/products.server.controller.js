'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors'),
	Product = mongoose.model('Product'),
	_ = require('lodash'),
	archiver = require('archiver'),
	svn = require('svn-spawn'),
	fs = require('fs-extra'),
	Q  = require('q'),
	utf8 = require('utf8');


/**
 * Create a Product
 */
exports.create = function(req, res) {
	var product = new Product(req.body);
	product.user = req.user;

	product.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(product);
		}
	});
};

exports.getCWSVersion = function(req,res) {

	console.log('directory ' + utf8.decode(req.body.productDirectory));
	console.log('code ' + req.body.productCode);
	var isCWS,isCJK;
	isCWS = req.body.productCode.indexOf('cws') >= 0;
	isCJK = req.body.productCode.indexOf('cjk') >= 0;
	var versionDirectory;
	var etsvnRootPath;
	if(isCWS) {
	  versionDirectory = utf8.decode(req.body.productDirectory.trim()) + '\\' + 'Web_DB_server\\For_Windows_files\\Ascii\\COMPANY_SV\\company_ptf\\CWS';
	  etsvnRootPath = 'http://apollon/svn/cws/cws_updater/tags';
	}
	else if(isCJK) {
		versionDirectory = utf8.decode(req.body.productDirectory.trim());
		etsvnRootPath = 'http://apollon/svn/cjk/cjk_updater/tags';
	}
	var data = {};
	var svnClient = new svn({
		cwd: 'D:\\ciuwebconverter\\svnrepository',
		username: 'zhou_l',
		password: 'zhou_l'
	});
	debugger;
	if(fs.existsSync(versionDirectory)) {
		var files = fs.readdirSync(versionDirectory);
		if(isCWS)data.productVersion = files[0];
		if(isCJK){
			var fileNameStr = files.join(' ');
			if(fileNameStr.indexOf('AP') < 0 || fileNameStr.indexOf('BATCH') < 0 
				|| fileNameStr.indexOf('CAB') < 0 || fileNameStr.indexOf('DAEMON') < 0 || fileNameStr.indexOf('DB') < 0)
			{
				data.productVersion = 'Error: Invalid Directory';
				res.jsonp(data);
				return;
			}else {
				data.productVersion = versionDirectory.substring(versionDirectory.lastIndexOf('\\')+1,versionDirectory.lastIndexOf('\\')+12);
			}
		}
		Product.find({productVersion:data.productVersion}).exec(function(err,product){
			if( product.length > 0){
				debugger;
				data.productVersion = 'Error: ' + data.productVersion + ' already exists';
				res.jsonp(data);
			}else{
				//Not existed --> Check SVN URL
				var etsvnPath = etsvnRootPath + '/' + data.productVersion.substring(3,5) + 'PTF' + '/' + data.productVersion.substring(3,9);
				debugger;
				// svnClient.cmd(['info',etsvnPath],function(err,svnData){
				// 	if( err) {
				// 		data.etjarSvnUrl = 'No Pre-apply Exceptional Task';
				// 	}
				// 	else if(svnData) {
				// 		data.etjarSvnUrl = etsvnPath;
				// 	}
				// 	debugger;
				// 	res.jsonp(data);
				// });
				svnInfo(svnClient,etsvnPath).then(function(success){
					console.log(success);
					data.etjarSvnUrl = etsvnPath;
					res.jsonp(data);
				}).fail(function(err){
					console.log(err);
					data.etjarSvnUrl = 'No Pre-apply Exceptional Task';
					res.jsonp(data);
				});
			}
		});
	}else {
		debugger;
		data.productVersion = 'Error: Invalid Directory';
		res.jsonp(data);
	}
}

function svnInfo(svnClient,etsvnPath) {
	var defer = Q.defer();
	svnClient.cmd(['info',etsvnPath],function(err,data){
		if(err) return defer.reject(err);
		else if(data) return defer.resolve(data);
	});
	return defer.promise;
}

exports.getCJKVersion = function(req,res) {
	console.log('getCJKVersion ' + req.body);
}

exports.deleteCWSProducts = function(req,res) {
	console.log('delete cws');
}

/**
 * Show the current Product
 */
exports.read = function(req, res) {
	console.log(req);
	res.jsonp(req.product);
};

/**
 * Update a Product
 */
exports.update = function(req, res) {
	var product = req.product ;

	product = _.extend(product , req.body);

	product.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(product);
		}
	});
};

/**
 * Delete an Product
 */
exports.delete = function(req, res) {
	var productID = req.url.substring(req.url.lastIndexOf('/')+1);
	Product.findById(productID).remove(function(err,product) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(product);
		}
	});
};

/**
 * List of Products
 */
exports.list = function(req, res) { Product.find().sort('-created').populate('user', 'displayName').exec(function(err, products) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(products);
		}
	});
};

/**
 * Product middleware
 */
exports.productByID = function(req, res, next, id) { Product.findById(id).populate('user', 'displayName').exec(function(err, product) {
		if (err) return next(err);
		if (! product) return next(new Error('Failed to load Product ' + id));
		req.product = product ;
		next();
	});
};

exports.getCWSProducts = function(req, res){
	Product.find({productCode:'cws'}).sort('-created').populate('user','displayName').exec(function(err,products) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(products);
		}
	});
};

exports.getCJKProducts = function(req, res){
	Product.find({productCode:'cjk'}).sort('-created').populate('user','displayName').exec(function(err,products) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(products);
		}
	});
};
/**
 * Product authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.product.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};

/**
 *	
 */
exports.downloadProducts = function(req,res,next) {
	console.log('download');
	var product = req.product;
	var productCode = product.productCode;
	var productVersion = product.productVersion;
	var resourceFolder = './download/product/' + productCode + '/' + productVersion + '/**/*';
	var productName = productVersion + '.zip';
	res.setHeader('Content-disposition', 'attachment; filename=' + productName);
	var productZip = archiver('zip');
	productZip.pipe(res);
	productZip.bulk([{src:[resourceFolder]}]);
	productZip.finalize();
};