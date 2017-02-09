package Scot::App;

use lib '../../lib';
use v5.18;
use strict;
use warnings;
use Scot::Util::LoggerFactory;
use Scot::Util::Config;
use Data::Dumper;
use DateTime;
use namespace::autoclean;

use Moose;
with qw(Scot::Role::Configurable);

has env => (
    is          => 'ro',
    isa         => 'Scot::Env',
    required    => 1,
    lazy        => 1,
    builder     => '_get_env',
);

sub _get_env {
    my $self    = shift;
    my $file    = $self->config_file;
    return Scot::Env->new({
        config_file => $file,
        paths       => $self->paths,
    });
}

has log => (
    is          => 'ro',
    isa         => 'Log::Log4perl::Logger',
    required    => 1,
    lazy        => 1,
    builder     => '_build_log',
    predicate   => 'has_log',
);

sub _build_log {
    my $self    = shift;
    my $config  = $self->config;
    my $chref   = $config->{log};

    print "in App.pm Logger config is " . Dumper($chref)."\n";

    my $lfactory = Scot::Util::LoggerFactory->new(config => $chref);
    return $lfactory->get_logger;
}

has base_url    => (
    is              => 'ro',
    isa             => 'Str',
    required        => 1,
    default         => '/scot/api/v2',
);

sub put_stat {
    my $self    = shift;
    my $metric  = shift;
    my $value   = shift;
    my $now     = DateTime->now;

    try {
        if ( $self->get_method eq "scot_api" ) {
            my $response    = $self->scot->post({
                type    => "stat",
                data    => {
                    action  => 'incr',
                    year    => $now->year,
                    month   => $now->month,
                    day     => $now->day,
                    hour    => $now->hour,
                    dow     => $now->dow,
                    quarter => $now->quarter,
                    metric  => $metric,
                    value   => $value,
                }
            });
        }
        else {
            my $mongo   = $self->env->mongo;
            my $col     = $mongo->collection('Stat');
            $col->increment($now, $metric, $value);
        }
    }
    catch {
        $self->log->warn("Attempt to put stat $metric $value failed!");
    };
}


1;
