%environment = (
    # server name of the SCOT server
    servername  => 'localhost',
    # username with sufficient scot perms to create alert(groups)
    username    => 'scot-alerts',
    # the password for that user
    password    => 'changemenow',
    # authentication type: RemoteUser, LDAP, Local
    authtype    => 'Local',
    # interactive
    interactive => 0,
    # max workers
    max_workers => 20,
    # log config
    log_config  => {
        logger_name     => 'SCOT',
        layout          => '%d %7p [%P] %15F{1}: %4L %m%n',
        appender_name   => 'scot_log',
        logfile         => '/var/log/scot/scot.flair.log',
        log_level       => 'DEBUG',
    },
    # modules used by flair app
    modules => [
        {
            attr    => 'img_munger',
            class   => 'Scot::Util::ImgMunger',
            config  => {
            },
        },
        {
            attr    => 'extractor',
            class   => 'Scot::Util::EntityExtractor',
            config  => {
                suffixfile  => '/opt/scot/etc/effective_tld_names.dat',
            },
        },
        {
            attr    => 'scot',
            class   => 'Scot::Util::Scot2',
            config  => {
                servername  => 'localhost',
                # username with sufficient scot perms to create alert(groups)
                username    => 'scot-alerts',
                # the password for that user
                password    => 'changemenow',
                # authentication type: RemoteUser, LDAP, Local
                authtype    => 'Local',
            },
        },
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
    ],
);
