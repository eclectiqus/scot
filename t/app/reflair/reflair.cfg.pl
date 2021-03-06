%environment = (
    
    time_zone   => "America/Denver",
    # scot version
    version     => '3.5.1',

    # set this to hostname of the scot server
    servername  => '127.0.0.1',

    # the mode can be prod or dev
    mode        => 'testing',

    # authentication can be "Remoteuser", "Local", or "Ldap"
    auth_type   => 'Testing', 

    authclass   => 'Controller::Auth::Testing',

    # group mode can be "local" or "ldap"
    group_mode  => 'ldap',

    # default owner of new stuff
    default_owner   => 'scot-admin',

    # default set of groups to apply to stuff
    default_groups  => {
        read    => [ 'wg-scot-ir', 'wg-scot-researchers' ],
        modify  => [ 'wg-scot-ir' ],
    },

    # the group that can perform admin functions
    admin_group => 'wg-scot-admin',

    # filestore is where scot stores uploaded and extracted files
    file_store_root => '/opt/scotfiles',

    epoch_cols  => [ qw(when updated created occurred) ],

    int_cols    => [ qw(views) ],

    site_identifier => 'Sandia',

    default_share_policy => 1,

    share_after_time    => 10, # minutes

    alertgroup_rowlimit => 10,

    # mojo defaults are values for the mojolicious startup
    mojo_defaults   => {
        # change this after install and restart scot
        secrets => [qw(scot1sfun sc0t1sc00l)],

        # see mojolicious docs 
        default_expiration  => 14400,

        # hypnotoad workers, 50-100 heavy use, 20 - 50 light
        hypnotoad_workers   => 15,
    },

    log_config => {
        logger_name     => 'SCOT',
        layout          => '%d %7p [%P] %15F{1}: %4L %m%n',
        appender_name   => 'scot_log',
        logfile         => '/var/log/scot/scot.test.log',
        log_level       => 'DEBUG',
    },

    # modules to instantiate at Env.pm startup. will be done in 
    # order of the array
    modules => [
        {
            attr    => 'img_munger',
            class   => 'Scot::Util::ImgMunger',
            config  => {
                html_root   => "/cached_images",
                image_dir   => "/opt/scot/public/cached_images",
                storage     => "local",
            },
        },
        {
            attr    => 'mongo',
            class   => 'Scot::Util::MongoFactory',
            config  => {
                db_name         => 'scot-testing',
                host            => 'mongodb://localhost',
                write_safety    => 1,
                find_master     => 1,
            },
        },
        {
            attr    => 'mq',
            class   => 'Scot::Util::Messageq',
            config  => {
                destination => "scot-test",
                stomp_host  => "localhost",
                stomp_port  => 61613,
            },
        },
        {
            attr    => "es",
            class   => "Scot::Util::ElasticSearch",
            config  => {
                nodes       => [ qw(localhost:9200) ],
            },
        },
    ],
);
