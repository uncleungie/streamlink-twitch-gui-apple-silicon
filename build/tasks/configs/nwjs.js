module.exports = {
	options: {
		mode    : "build",
		flavor  : "normal",
		zip     : false,
		glob    : false,
		cacheDir: "<%= dir.cache %>",
		logLevel: "info"
	},

	win32: {
		options: {
			platform: "win",
			arch    : "ia32",
			version : "0.83.0",
			outDir  : "<%= dir.releases %>/<%= package.name %>/win32",
			srcDir  : "<%= dir.tmp_prod %>",
			app     : {
				icon: "<%= dir.resources %>/icons/icon-16-32-48-256.ico"
			}
		}
	},
	win64: {
		options: {
			platform: "win",
			arch    : "x64",
			version : "0.83.0",
			outDir  : "<%= dir.releases %>/<%= package.name %>/win64",
			srcDir  : "<%= dir.tmp_prod %>",
			app     : {
				icon: "<%= dir.resources %>/icons/icon-16-32-48-256.ico"
			}
		}
	},

	osx64: {
		options: {
			platform: "osx",
			arch    : "x64",
			version : "0.83.0",
			outDir  : "<%= dir.releases %>/<%= package.name %>/osx64",
			srcDir  : "<%= dir.tmp_prod %>",
			app     : {
				icon                     : "<%= dir.resources %>/icons/icon-1024.icns",
				CFBundleIdentifier       : "<%= main['app-identifier'] %>",
				CFBundleName             : "<%= main['display-name'] %>",
				CFBundleDisplayName      : "<%= main['display-name'] %>",
				LSApplicationCategoryType: "public.app-category.entertainment",
				NSHumanReadableCopyright : ""
			}
		}
	},
	osxArm64: {
		options: {
			platform: "osx",
			arch    : "arm64",
			version : "0.112.0",
			outDir  : "<%= dir.releases %>/<%= package.name %>/osxArm64",
			srcDir  : "<%= dir.tmp_prod %>",
			app     : {
				icon                     : "<%= dir.resources %>/icons/icon-1024.icns",
				CFBundleIdentifier       : "<%= main['app-identifier'] %>",
				CFBundleName             : "<%= main['display-name'] %>",
				CFBundleDisplayName      : "<%= main['display-name'] %>",
				LSApplicationCategoryType: "public.app-category.entertainment",
				NSHumanReadableCopyright : ""
			}
		}
	},

	linux32: {
		options: {
			platform: "linux",
			arch    : "ia32",
			version : "0.83.0",
			outDir  : "<%= dir.releases %>/<%= package.name %>/linux32",
			srcDir  : "<%= dir.tmp_prod %>"
		}
	},
	linux64: {
		options: {
			platform: "linux",
			arch    : "x64",
			version : "0.83.0",
			outDir  : "<%= dir.releases %>/<%= package.name %>/linux64",
			srcDir  : "<%= dir.tmp_prod %>"
		}
	}
};
