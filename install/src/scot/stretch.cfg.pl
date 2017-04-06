%environment = (
    max_workers => 1,
    log_config  => {
        logger_name     => 'SCOT',
        layout          => '%d %7p [%P] %15F{1}: %4L %m%n',
        appender_name   => 'scot_log',
        logfile         => '/var/log/scot/scot.stretch.log',
        log_level       => 'DEBUG',
    },
    modules => [
        {
            attr    => 'es',
            class   => 'Scot::Util::ElasticSearch',
            config  => {
                nodes   => [ qw(localhost:9200) ],
            },
        },
        {
            attr    => 'scot',
            class   => 'Scot::Util::ScotClient',
            config  => {
                servername  => "localhost",
                username    => "scot-alerts",
                password    => "changemenow",
                auth_type    => "basic",
            },
        },
    ],
);
