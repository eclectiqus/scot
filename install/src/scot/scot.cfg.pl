%environment = (
    
    # scot version
    version     => '3.5.1',

    # set this to hostname of the scot server
    servername  => '127.0.0.1',

    # the mode can be prod or dev
    mode        => 'prod',

    # authentication can be "Remoteuser", "Local", or "Ldap"
    auth_type   => 'Local', 

    authclass   => 'Controller::Auth::Local',

    # group mode can be "local" or "ldap"
    group_mode  => 'local',

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

    # mojo defaults are values for the mojolicious startup
    mojo_defaults   => {
        # change this after install and restart scot
        secrets => [qw(scot1sfun sc0t1sc00l)],

        # see mojolicious docs 
        default_expiration  => 14400,

        # hypnotoad workers, 50-100 heavy use, 20 - 50 light
        hypnotoad_workers   => 75,
    },

    log_config => {
        logger_name     => 'SCOT',
        layout          => '%d %7p [%P] %15F{1}: %4L %m%n',
        appender_name   => 'scot_log',
        logfile         => '/var/log/scot/scot.log',
        log_level       => 'DEBUG',
    },

    # modules to instantiate at Env.pm startup. will be done in 
    # order of the array
    modules => [
        {
            attr    => 'mongo',
            class   => 'Scot::Util::MongoFactory',
            config  => {
                db_name         => 'scot-prod',
                host            => 'mongodb://localhost',
                write_safety    => 1,
                find_master     => 1,
            },
        },
        {
            attr    => 'mongoquerymaker',
            class   => 'Scot::Util::MongoQueryMaker',
            config  => {
            },
        },
        {
            attr    => 'mq',
            class   => 'Scot::Util::Messageq',
            config  => {
                destination => "scot",
                stomp_host  => "localhost",
                stomp_port  => 61613,
            },
        },
        {
            attr    => 'imap',
            class   => 'Scot::Util::Imap',
            config  => {
                mailbox     => 'INBOX',          # mailbox, typically INBOX
                hostname    => 'mail.domain.tld',# hostname of the imap server
                port        => 993,              # port of the imap server
                username    => 'scot-alerts',    # username  of the 
                                                 # account receiving alert email
                password    => 'changemenow',    # password  
                ssl         => [ 
                    'SSL_verify_mode', 0         # ssl options 
                ],                               # see perldoc IO::SSL
                uid         => 1,                # uid   IMAP config item 
                ignore_size_errors  => 1,        # ignore_size_errors 
            },
        },
        {
            attr    => 'enrichments',
            class   => 'Scot::Util::Enrichments',
            config  => {
                # mappings map the enrichments that are available 
                # for a entity type
                mappings    => {
                    ipaddr      => [ qw(splunk geoip robtex_ip ) ],
                    email       => [ qw(splunk ) ],
                    md5         => [ qw(splunk ) ],
                    sha1        => [ qw(splunk ) ],
                    sha256      => [ qw(splunk ) ],
                    domain      => [ qw(splunk robtex_dns ) ],
                    file        => [ qw(splunk  ) ],
                    ganalytics  => [ qw(splunk  ) ],
                    snumber     => [ qw(splunk ) ],
                    message_id  => [ qw(splunk ) ],
                },

                # foreach enrichment listed above place any 
                # config info for it here
                configs => {
                    geoip   => {
                        type    => 'native',
                        module  => 'Scot::Util::Geoip',
                    },
                    robtex_ip   => {
                        type    => 'external_link',
                        url     => 'https://www.robtex.com/ip/%s.html',
                        field   => 'value',
                        title   => 'Lookup on Robtex (external)',
                    },
                    robtex_dns   => {
                        type    => 'external_link',
                        url     => 'https://www.robtex.com/dns/%s.html',
                        field   => 'value',
                        title   => 'Lookup on Robtex (external)',
                    },
                    splunk      => {
                        type    => 'internal_link',
                        url     => 'https://splunk.domain.tld/en-US/app/search/search?q=search%%20%s',
                        field   => 'value',
                        title   => 'Search on Splunk',
                    },
                }, # end enrichment module configs
            }, # end ennrichmenst config stanza
        }, # end enrichments stanza
        {
            attr    => 'ldap',
            class   => 'Scot::Util::Ldap',
            config  => {
                servername  => 'ldap.domain.tld',
                dn          => 'cn=cn_name,ou=local config,dc=tld',
                password    => 'changemenow',
                scheme      => 'ldap',
                group_search    => {
                    base    => 'ou=groups,ou=orgname1,dc=dcname1,dc=dcname2,dc=dcname3',
                    filter  => '(| (cn=wg-scot*))',
                    attrs   => [ 'cn' ],
                },
                user_groups => {
                    base    => 'ou=accounts,ou=ouname,dc=dcname1,dc=dcname1,dc=dcname1',
                    filter  => 'uid=%s',
                    attrs   => ['memberOf'],
                }
            }, # end ldap config
        }, # end ldap
    ],
);
