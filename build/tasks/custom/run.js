module.exports = function( grunt ) {
	const platforms = require( "../common/platforms" );
	const { resolve: r } = require( "path" );

	async function taskRun() {
		const done = this.async();
		const plat = platforms.getPlatform();
		const { nwPlatform, nwArch } = platforms.platforms[ plat ];

		const options = Object.assign(
			{ platform: nwPlatform, arch: nwArch },
			this.options(),
			{ srcDir: r( process.cwd(), this.data.src ) }
		);

		try {
			const { default: nwbuild } = await import( "nw-builder" );
			const nwProcess = await nwbuild( options );

			if ( nwProcess.exitCode !== null ) {
				done( nwProcess.exitCode === 0 );
				return;
			}

			nwProcess.on( "close", code => {
				done( code === 0 );
			});
		} catch ( err ) {
			grunt.fail.fatal( err );
		}
	}

	grunt.task.registerMultiTask(
		"run",
		"Run the previously built NW.js application",
		taskRun
	);
};
