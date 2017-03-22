package Scot::Controller::Stat;

use lib '../../../lib';
use v5.18;
use strict;
use warnings;
use Data::Dumper;
use Mojo::JSON qw(decode_json encode_json);
use DateTime;
use DateTime::Duration;

use base 'Mojolicious::Controller';

sub get {
    my $self    = shift;
    my $env     = $self->env;
    my $log     = $env->log;
    my $mongo   = $env->mongo;
    
    $log->debug("--- ");
    $log->debug("--- GET viz");
    $log->debug("--- ");

    my $req_href    = $self->get_request_params;

    my $json    = $self->pyramid_json(
        $req_href->{span_type},
        $req_href->{index},
    );

    $self->do_render($json);

}

sub do_render {
    my $self    = shift;
    my $code    = 200;
    my $href    = shift;
    $self->render(
        status  => $code,
        json    => $href,
    );
}

sub get_request_params {
    my $self    = shift;
    my $env     = $self->env;
    my $log     = $env->log;

    my $params  = $self->req->params->to_hash;

    return $params;
}

sub get_seconds {
    my $self    = shift;
    my $d       = shift;
    my $u       = shift;
    my $t       = 0;

    my $s = 60;

    $s = $s * 60 if ( $u eq "hour" );
    $s = $s * 60 * 24 if ( $u eq "day" );
    $s = $s * 60 * 24 * 30 if ( $u eq "month" ); # close enough
    $s = $s * 60 * 24 * 90 if ( $u eq "quarter" ); # for govt. work

    return $s;
}

sub pyramid_json {
    my $self        = shift;
    my $req_href    = $self->get_request_params;
    my $log         = $self->env->log;

    my $span_type   = $req_href->{span_type}; # ... day, month, quarter, year
    my $index       = $req_href->{index}; # ... number of span_types ago to tally

    # pyramid report returns:
    # {
    #   alerts: int,
    #   events: int,
    #   incidents: int,
    # }

    my $nowdt       = DateTime->from_epoch( epoch => $self->env->now );
    my $duration    = DateTime::Duration->new(
        $span_type  => $index,
    );
    $nowdt->subtract_duration($duration);

    $log->debug("Looking for $span_type pyramid $index on ".$nowdt->ymd);

    my $createdre   = qr{created}i;

    my $match   = {
        metric  => $createdre,
    };
    if ($span_type eq "days") {
        $match->{year} = $nowdt->year;
        $match->{month} = $nowdt->month;
        $match->{day} = $nowdt->day;
    }
    if ($span_type eq "months") {
        $match->{year} = $nowdt->year;
        $match->{month} = $nowdt->month;
    }
    if ($span_type eq "quarters") {
        $match->{year} = $nowdt->year;
        $match->{quarter} = $nowdt->quarter;
    }
    if ($span_type eq "years") {
        $match->{year} = $nowdt->year;
    }

    $log->debug("match is ",{ filter=>\&Dumper, value=>$match });

    my $cursor  = $self->env->mongo->collection('Stat')->find($match);
    my $json;

    while ( my $obj = $cursor->next ) {
        my $type    = ( split(/ /,$obj->metric) )[0];
        $json->{$type} += $obj->value;
    }

    $self->do_render($json);

}

# http://bl.ocks.org/tjdecke/5558084
sub day_hour_heatmap_json {
    my $self        = shift
    my $req_href    = shift;
    my $collection  = $req_href->{collection};
    my $type        = $req_href->{type}; # ... created | updated|...
    my $year        = $req_href->{year};
    my $metricre    = qr/$collection $type/;
    my $match   = {
        metric  => $metricre,
        year    => $year,
    };
    my $cursor  = $self->env->mongo->collection('Stat')->find($match);
    my %results = ();
    while ( my $obj = $cursor->next ) {
        $results{$obj->dow}->{$obj->hour} += $obj->value;
    }
    my @resarray = ();
    foreach my $dow (sort keys %results) {
        foreach my $hour (sort keys %{$results{$dow}}) {
            push @resarray, [ $dow, $hour, $results{$dow}{$hour} ];
        }
    }
    $self->do_render(\@resarray);
}

        
1;