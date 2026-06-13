module.exports = {
	options: {
		mode    : "run",
		flavor  : "sdk",
		glob    : false,
		cacheDir: "<%= dir.cache %>",
		argv    : ["--remote-debugging-port=8888"]
	},

	dev: {
		src: "<%= dir.tmp_dev %>"
	},

	prod: {
		src: "<%= dir.tmp_prod %>"
	},

	debug: {
		src: "<%= dir.tmp_prod %>"
	}
};
