var querystring=require('querystring');
var https=require('https');
var methods={devices:{type:null,status:null,mac_address:null,major:null,minor:null,q:null,includes:['mac_address','ibeacon_identifiers','images','status','software_version','type','product','last_location'],size:null},events:{names:['location','battery','button','temperature','level'],device_ids:null,start_date:null,end_date:null,page:null,size:null}};

var find_=function (ARR,arr) {
	var boo=(Array.isArray(ARR))&&(Array.isArray(arr))&&((arr.length>0)?true:false);
	if (boo) {
		arr.forEach(function(val) {
			if (ARR.indexOf(val)===-1) {
				boo=false;
			};
		});
	};
	return boo;
};

var Ticatag=function(client_id,secret,email,password,cback) {
	this.cb=function(data,cb) {
		console.log(data);
		if (data.error) {
			console.log('Connection failed');
		} else {
			console.log(this.connect_?'Refresh successful':'Connection successful');
			this.token=data;
			this.time=Date.now();
			this.cred.grant_type='refresh_token';
			this.cred.refresh_token=this.token.refresh_token;
			if (!this.connect_) {
				this.connect_=true;
				delete this.cred.username;
				delete this.cred.password;
				cback();
			};
			if (cb) {
				cb();
			};
		};
	};
	this.cred={client_id:client_id,client_secret:secret,grant_type:'password',username:email,password:password};
	this.connect();
};

Ticatag.prototype.connect=function(cb) {
	this.send('POST','account.ticatag.com','/uaa/oauth/token',this.cred,{'Content-Type': 'application/x-www-form-urlencoded','Content-Length':querystring.stringify(this.cred).length},this.cb,cb);
};

Ticatag.prototype.send=function(method,host,path,params,headers,cb1,cb2) {
	var cb=(function(data){cb1.call(this,data,cb2||null)}).bind(this);
	if ((!this.time)||(this.time&&(this.time+this.token.expires_in*1000))) {
		var options={
			port: 443,
			method: method,
			host: host,
			path: path
		};
		if (headers) {
			options.headers=headers;
		};
		var req=https.request(options,function(res) {
			var data_=new Buffer(0);
			res.on('data',function(d) {
				data_=Buffer.concat([data_,d]);
			});
			res.on('end',function() {
				if (res.statusCode===200) {
					if (data_.length) {
						cb(JSON.parse(data_.toString('utf8')));
					} else {
						console.log('https error');
					};
				} else {
					//console.log(res.statusCode);
					//console.log(res.headers);
					cb(JSON.parse(data_.toString('utf8')));
				};
			});
			req.on('error', function(e) {
				cb1();
			});
		});
		req.on('error', function(e) {
			cb1();
		});
		if (method==='POST') {
			var post=querystring.stringify(params);
			req.write(post);
		};
		req.end();
	} else {
		this.connect((function() {
			this.send(method,host,path,params,headers,cb1);
		}).bind(this));
	};
};

Ticatag.prototype.api=function(cmd,device,params,cb) {
	var method=methods[cmd];
	if (method) {
		if (cmd!=='devices') {
			device=null;
			if (cmd==='events') {
				if (params&&params.names) {
					if (!find_(method.names,params.names)) {
						params.names=null;
					} else {
						params.names=params.names.join(',');
					};
				};
			};
		} else {
			if (params&&params.includes) {
				if (!find_(method.includes,params.includes)) {
					params.includes=null;
				} else {
					params.includes=params.includes.join(',');
				};
			};
		};
		if (params) {
			if (find_(Object.keys(method),Object.keys(params))) {
				this.send('GET','api.ticatag.com','/v2/'+cmd+(device?('/'+device+'/?'):'/?')+querystring.stringify(params),null,{'Authorization':'Bearer '+this.token.access_token},cb);
			} else {
				console.log('Wrong parameters');
			};
		} else {
			this.send('GET','api.ticatag.com','/v2/'+cmd+(device?('/'+device):''),null,{'Authorization':'Bearer '+this.token.access_token},cb);
		};
	};
};

module.exports=Ticatag;