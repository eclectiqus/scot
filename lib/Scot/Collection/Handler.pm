package Scot::Collection::Handler;
use lib '../../../lib';
use Data::Dumper;
use Moose 2;
extends 'Scot::Collection';
with    qw(
    Scot::Role::GetByAttr
);

=head1 Name

Scot::Collection::File

=head1 Description

Custom collection operations for Files

=head1 Methods

=over 4

=item B<create_from_api($request)>

Create an handler and from a POST to the handler

=cut

override api_create => sub {
    my $self    = shift;
    my $href    = shift;
    my $env     = $self->env;
    my $log     = $env->log;
    my $mongo   = $env->mongo;

    $log->trace("Custom create in Scot::Collection::Handler");

    my $json    = $href->{request}->{json};
    my $params  = $href->{request}->{params};

    my $build_href  = $json // $params;

    $log->debug("creating handler with ",{filter=>\&Dumper, value=>$build_href});

    my $handler   = $self->create($build_href);

    return $handler;
};

override api_list => sub {
    my $self    = shift;
    my $href    = shift;
    my $user    = shift;
    my $groups  = shift;

    my $match   = $self->build_match_ref($href->{request});
    my $current = $href->{request}->{params}->{current};

    if ( defined $current ) {
        my @records;
        my $cursor  = $self->get_handler($current);
        return ($cursor, $cursor->count);
    }

    $self->env->log->debug("match is ",{filter=>\&Dumper, value=>$match});

    my $cursor  = $self->find($match);
    my $total   = $cursor->count;

    if ( my $limit   = $self->build_limit($href) ) {
        $cursor->limit($limit);
    }
    else {
        # TODO: accept a default out of env/config?
        $cursor->limit(50);
    }

    if ( my $sort   = $self->build_sort($href) ) {
        $cursor->sort($sort);
    }
    else {
        $cursor->sort({id   => -1});
    }

    if ( my $offset  = $self->build_offset($href) ) {
        $cursor->skip($offset);
    }

    return ($cursor,$total);

};



sub create_from_api {
    my $self    = shift;
    my $href    = shift;
    my $env     = $self->env;
    my $log     = $env->log;
    my $mongo   = $env->mongo;

    $log->trace("Custom create in Scot::Collection::Handler");

    my $json    = $href->{request}->{json};
    my $params  = $href->{request}->{params};

    my $build_href  = $json // $params;

    $log->debug("creating handler with ",{filter=>\&Dumper, value=>$build_href});

    my $handler   = $self->create($build_href);

    return $handler;
}

sub get_handler {
    my $self    = shift;
    my $env     = $self->env;
    my $when    = shift // $env->now();
    
    $when = $env->now() if ($when == 1);

    my $match   = {
        start   => { '$lte' => $when },
        end     => { '$gte' => $when },
    };

    my $cursor = $self->find($match);

    return $cursor;
}


1;
