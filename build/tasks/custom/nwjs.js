module.exports = function( grunt ) {
	async function taskNwjs() {
		const done = this.async();
		const options = this.options();

		if ( this.flags.debug ) {
			options.flavor = "sdk";
		}

		try {
			const { default: nwbuild } = await import( "nw-builder" );
			await nwbuild( options );
			grunt.log.ok( "NW.js application created." );
			done();
		} catch ( err ) {
			grunt.log.error( "NW.js build error:", err.stack || err.message || err );
			done( false );
		}
	}

	grunt.registerMultiTask(
		"nwjs",
		"Create an NW.js build of the application",
		taskNwjs
	);
};
