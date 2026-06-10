module.exports = function( grunt ) {
	grunt.registerTask( "runtest", "Run the tests in NW.js", function() {
		const cdpConnect = require( "../common/cdp/connect" );
		const cdpQUnit = require( "../common/cdp/qunit" );
		const cdpCoverage = require( "../common/cdp/coverage" );

		const platforms = require( "../common/platforms" );
		const plat = platforms.getPlatform();
		const { nwPlatform, nwArch } = platforms.platforms[ plat ];

		const isCI = process.env[ "CI" ] === "true";
		const isCoverage = !!this.flags.coverage;

		const done = this.async();
		const options = this.options({
			host: "127.0.0.1",
			port: isCI ? 4444 : 8000,
			connectAttempts: isCI ? 10 : 5,
			connectDelay: isCI ? 2000 : 1000,
			startTimeout: 10000,
			testTimeout: 300000,
			coverageTimeout: 5000
		});

		const nwConf = grunt.config( "nwjs" );
		const { options: nwOptions, [ plat ]: { options: nwPlatformOptions } } = nwConf;

		const argv = [ `--remote-debugging-port=${options.port}` ];
		if ( isCI ) {
			argv.unshift( "--disable-gpu", "--no-sandbox" );
		}

		const nwjsOptions = Object.assign( {}, nwOptions, nwPlatformOptions, {
			platform: nwPlatform,
			arch: nwArch,
			mode: "run",
			flavor: "sdk",
			srcDir: options.path,
			glob: false,
			argv
		});

		let nwProcess;

		function kill() {
			if ( nwProcess && !nwProcess.killed ) {
				nwProcess.removeAllListeners( "close" );
				nwProcess.kill();
				grunt.log.debug( "NW.js stopped" );
				process.removeListener( "exit", kill );
			}
		}

		function fail( err ) {
			kill();
			if ( err ) {
				grunt.fail.fatal( String( err ) );
			} else {
				grunt.util.exit( 1 );
			}
		}

		new Promise( ( resolve, reject ) => {
			process.on( "exit", kill );

			( async () => {
				const { default: nwbuild } = await import( "nw-builder" );
				nwProcess = await nwbuild( nwjsOptions );

				grunt.log.debug( "NW.js started" );

				if ( nwProcess.exitCode !== null ) {
					throw new Error( "NW.js exited prematurely" );
				}

				nwProcess.on( "close", () => {
					reject( "NW.js exited prematurely" );
				});

				// connect to NW.js (cdpConnect retries until ready, replacing
				// v3's "appstart" event)
				const cdp = await cdpConnect( options, grunt.log.error );
				grunt.log.debug( `Connected to ${options.host}:${options.port}` );

				await cdpQUnit( grunt, options, cdp );
				if ( isCoverage ) {
					await cdpCoverage( grunt, options, cdp );
				}

				resolve();
			})()
				.catch( reject );
		})
			.then( () => {
				kill();
			})
			.then( done, fail );
	});
};
