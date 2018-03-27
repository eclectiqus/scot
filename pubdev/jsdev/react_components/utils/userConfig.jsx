import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { getDisplayName } from 'recompose';
import { Broadcast, Subscriber } from 'react-broadcast';

// Channel name for react-broadcast
const UserConfigChannel = 'userConfig';

/**
 * Unique keys for the structure of userConfig
 *
 * Structure:
 *		KEY_ID: {
 *			key: KEY_VALUE,
 *			default: DEFAULT_VALUE_IF_UNDEFINED,
 *		}
 */
const UserConfigKeyShape = {
	key: PropTypes.string.isRequired,
	default: PropTypes.any.isRequired,
};

export const UserConfigKeys = {
	DASHBOARD: {
		key: 'dashboard',
		default: {
			curTab: 0,
			tabs: [],
		},
	},
}

/*
 * Helper components for setting up context
 * Only provider is exported because subscriber is only used locally
 */

const UserConfigContextTypes = {
		getUserConfig: PropTypes.func,
		setUserConfig: PropTypes.func,
	};

export class UserConfigProvider extends PureComponent {
	constructor( props ) {
		super( props );

		this.state = {
			userConfig: {
				loading: true,
			},
		}

		this.update = this.update.bind(this);
		this.setUserConfig = this.setUserConfig.bind(this);
	}

	static childContextTypes = UserConfigContextTypes;

	getChildContext() {
		return {
			getUserConfig: this.getUserConfig,
			setUserConfig: this.setUserConfig,
		}
	}

	getUserConfig() {
		// Currently just uses localstorage
		// This should be easy to change to use a backend at some point
		return new Promise( ( resolve, reject ) => {
			let json = getLocalStorage( UserConfigChannel )
			if ( json ) {
				resolve( JSON.parse( json ) );
				return;
			}

			resolve( {} );
		} );
	}

	setUserConfig( config ) {
		// Currently just uses localstorage
		// This should be easy to change to use a backend at some point
		return new Promise( ( resolve, reject ) => {
			setLocalStorage( UserConfigChannel, JSON.stringify( config ) );

			resolve();
		} ).then( () => {
			this.update();
		} );
	}

	update() {
		this.getUserConfig().then( ( config ) => {
			this.setState( {
				userConfig: config,
			} );
		} );
	}

	componentDidMount() {
		this.update();
	}

	render() {
		return (
			<Broadcast value={this.state.userConfig} channel={UserConfigChannel}>
				<div>
					{this.props.children}
				</div>
			</Broadcast>
		)
	}
}

// Defining shape for UserConfig props, should be imported by wrapped components
export const UserConfigPropTypes = {
	userConfig: PropTypes.shape( {
		config: PropTypes.any.isRequired,
		setUserConfig: PropTypes.func.isRequired,
		getUserConfig: PropTypes.func.isRequired,
		loading: PropTypes.bool,
	} ).isRequired,
}

export const withUserConfig = ( configKey ) => {
	PropTypes.checkPropTypes( UserConfigKeyShape, configKey, 'argument', 'withUserConfig' );

	return ( WrappedComponent ) => {
		class UserConfigSubscriber extends PureComponent {
			constructor( props ) {
				super( props );

				this.state = {}

				this.setUserSubConfig = this.setUserSubConfig.bind(this);
			}

			static contextTypes = UserConfigContextTypes;
			static displayName = `withUserConfig(${getDisplayName( WrappedComponent )})`;
			static propTypes = {
				userConfig: PropTypes.object.isRequired,
			};

			/**
			 * This allows the wrapped component to only have to worry about its own
			 * portion of userConfig. Its changes are automatically wrapped back into
			 * the whole object
			 */
			setUserSubConfig( subConfig ) {
				let newConfig = {
					...this.props.userConfig,
				}
				newConfig[configKey.key] = subConfig;

				this.context.setUserConfig( newConfig );
			}

			render() {
				let { userConfig, ...restProps } = this.props;

				let data = userConfig[ configKey.key ] || configKey.default;
				const loading = userConfig.loading;

				const userConfigProps = {
					userConfig: {
						loading: loading === true,
						config: data,
						setUserConfig: this.setUserSubConfig,
						getUserConfig: this.context.getUserConfig,
					}
				};
				
				return (
					<WrappedComponent {...restProps} {...userConfigProps} />
				)
			}
		}

		const UserConfigHelper = ( props ) => (
			<Subscriber channel={UserConfigChannel}>
				{ data => ( <UserConfigSubscriber userConfig={data} {...props} /> ) }
			</Subscriber>
		)
		return UserConfigHelper;
	}
}

