const platforms = require( "../../common/platforms" );


class NwjsPlugin {
	constructor( nwConf = {}, nwOptionsOverride = {}, options = {} ) {
		const plat = platforms.getPlatform();
		const { nwPlatform, nwArch } = platforms.platforms[ plat ];
		const { options: nwOptions, [ plat ]: { options: nwPlatformOptions } } = nwConf;

		this.nwOptions = Object.assign(
			{},
			nwOptions,
			nwPlatformOptions,
			{ platform: nwPlatform, arch: nwArch },
			nwOptionsOverride,
			{ glob: false }
		);
		this.options = Object.assign({
			rerunOnExit: true,
			log: true,
			logStdOut: true,
			logStdErr: true
		}, options );
		this.launched = false;
	}

	apply( compiler ) {
		compiler.hooks.done.tap( "NwjsPlugin", () => {
			if ( !this.launched ) {
				this._run();
				this.launched = true;
			}
		});
	}

	async _run() {
		const { nwOptions, options } = this;

		function log( msg ) {
			/* eslint-disable no-console */
			console.log( String( msg ).trim() );
		}

		async function launch() {
			try {
				const { default: nwbuild } = await import( "nw-builder" );
				const nwProcess = await nwbuild( nwOptions );

				nwProcess.on( "close", () => {
					if ( options.rerunOnExit ) {
						setTimeout( launch, 1000 );
					}
				});
			} catch ( err ) {
				log( `NW.js launch error: ${err.message}` );
			}
		}

		await launch();
	}
}


module.exports = NwjsPlugin;
