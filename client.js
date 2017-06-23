//Example of use taking the same examples than https://developers.ticatag.com/api/ + pagination example

var Ticatag=require('./ticatag.js');

var my_device_id, my_device_name;

var Myticatag=new Ticatag('My_client_id','My_secret','My_email','My_password',function() {
	Myticatag.api('devices',null,null,function(data) {
	console.log('\r\n -------------- Devices called\r\n');
		console.log(JSON.stringify(data));
		var first=data._embedded.devices[0]
		var my_device_id=first._links.self.href.split('/');
		my_device_id=my_device_id[my_device_id.length-1];
		console.log('device_id: '+my_device_id);
		my_device_name=first.name;
		console.log('device_name: '+my_device_name);
		Myticatag.api('devices',null,{includes:['mac_address','ibeacon_identifiers','images','status','software_version','type','product','last_location'],q:my_device_name},function(data) {
			console.log('\r\n-------------- Devices called with includes and search device_name\r\n');
			console.log(JSON.stringify(data));
			Myticatag.api('devices',my_device_id,{includes:['mac_address','ibeacon_identifiers','images','status','software_version','type','product','last_location']}, function(data) {
				console.log('\r\n-------------- Devices called with device_id and includes\r\n');
				console.log(JSON.stringify(data));
				Myticatag.api('events',null,{names:['location'],device_ids:my_device_id,page:2,size:10},function(data) {
					console.log('\r\n-------------- Events called with names\r\n');
					console.log(JSON.stringify(data));
				});
			});
		});
	});
});




