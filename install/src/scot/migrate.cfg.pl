%environment = (
    log_config  => {
        logger_name     => 'SCOT',
        layout          => '%d %7p [%P] %15F{1}: %4L %m%n',
        appender_name   => 'scot_log',
        logfile         => '/var/log/scot/scot.migrate.log',
        log_level       => 'DEBUG',
    },
    modules => [
    ],
);
