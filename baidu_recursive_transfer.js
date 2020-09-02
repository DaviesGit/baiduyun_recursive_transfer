let base_directory = '/base_directory';
let params = 'channel=chunlei&web=1&app_id=250528&bdstoken=&logid=&clienttype=0';
let fs_id = yunData.FS_ID;
let share_id = yunData.SHARE_ID;
let from = yunData.SHARE_UK;
let path = yunData.PATH;

function open_directory(dir, callback) {
	let dirs = dir.split('/').pop();
	async_loop(dirs, function(i, finish) {
		dirs[i]
	}, function() {

	});
}

//Not found  -9  {"errno":-9,"request_id":5209556402899265451}
function list(dir, callback) {
	$.ajax({
		url: 'https://pan.baidu.com/api/list',
		method: 'GET',
		data: {
			channel: 'chunlei',
			app_id: 250528,
			bdstoken: 'undefined',
			dir: dir,
			order: 'name',
			desc: 0,
			start: 0,
			limit: 500,
		},
		success: function(data) {
			callback(data);
		}
	});
}

function share_list(dir, callback) {
	$.ajax({
		url: 'https://pan.baidu.com/share/list',
		method: 'GET',
		data: {
			uk: from,
			shareid: share_id,
			order: 'name',
			desc: 1,
			dir: dir,
		},
		success: function(data) {
			callback(data);
		}
	});
}

function create(dir, callback) {
	$.ajax({
		url: 'https://pan.baidu.com/api/create?a=commit&channel=chunlei&app_id=250528&bdstoken=undefined',
		method: 'POST',
		data: {
			path: dir,
			isdir: 1,
			size: '',
			block_list: [],
			method: 'post',
			dataType: 'json',
		},
		success: function(data) {
			callback(data);
		}
	});
}

function transfer(fs_id, to_directory, callback) {
	$.ajax({
		url: 'https://pan.baidu.com/share/transfer?shareid=' + share_id + '&from=' + from + '&ondup=newcopy&async=1',
		method: 'POST',
		data: {
			fsidlist: JSON.stringify([fs_id]),
			path: to_directory,
		},
		success: function(data) {
			callback(data);
		}
	});
}

function async_loop(array, proccess, callback) {
	let len = array.length;
	let index = 0;
	!callback && (callback = function() {});

	function _loop() {
		if (index >= len)
			return callback();
		proccess(index, function() {
			++index;
			_loop();
		});
	}
	_loop();
}

function waituntil(checker, callback, delay) {
	if (!delay)
		delay = 100;
	if ('function' !== typeof checker)
		return callback();
	if (checker())
		return callback();
	setTimeout(() => {
		waituntil(checker, callback, delay);
	}, delay);
}

// [
// {
// 	wait: function() {
// 		return true;
// 	},
// 	function: function() {

// 	}
// },
// ]

function run_wait_chain(function_chain, callback, delay) {
	let index = 0;
	!delay && (delay = 0);
	!callback && (callback = function() {});

	function _loop() {
		if (index >= function_chain.length)
			return callback();
		let fun = function_chain[index];
		waituntil(fun.wait, function() {
			fun.function();
			++index;
			_loop();
		}, delay);
	}
	_loop();
}

let wait_function_chain = [{
	wait: function() {
		return true;
	},
	function: function() {

	}
}, ]

run_wait_chain(wait_function_chain);

function run_chain(chain, param, callback) {
	!callback && (callback = function() {});
	async_loop(chain, function(i, finish) {
		fun = chain[i];
		fun(param, function(result) {
			param = result;
			finish();
		})
	}, function() {
		callback(param);
	});
}

function transfer_subdir_recursive(dir, callback) {
	let target_directory = base_directory + dir.path;
	create(target_directory, function(data) {
		if (0 != data.errno)
			return callback(false);
		share_list(dir.path, function(data) {
			if (0 != data.errno)
				return callback(false);
			async_loop(data.list, function(i, finish) {
				let current_dir = data.list[i];
				transfer(current_dir.fs_id, target_directory, function(data) {
					switch (data.errno) {
						case 12:
							return transfer_subdir_recursive(current_dir, function(data) {
								if (data)
									finish();
								else
									callback(data);
							});
							break;
						case 0:
							finish();
							break;
						default:
							return callback(false);
							break;
					}
				});
			}, function() {
				callback(true);
			});
		});
	});
}

transfer_subdir_recursive({
	path: path,
}, function(data) {
	console.log("result: ", data);
});

// function transfer(){
// 	let function_chain=[
// 		function(param,callback){

// 		},
// 		function(param,callback){
// 			callback(param);
// 		},
// 	];

// 	share_list();


// 	run_chain(function_chain,null,function(){

// 	});
// }