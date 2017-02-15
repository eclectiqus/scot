package Scot::Util::ElasticSearch;

use lib '../../../lib';
use strict;
use warnings;
use v5.18;

use Mojo::JSON qw/decode_json encode_json/;
use Search::Elasticsearch;
# use Search::Elasticsearch::Client::1_0::Direct::Snapshot;
use Scot::Env;
use Data::Dumper;
use Try::Tiny;
use Try::Tiny::Retry;
use namespace::autoclean;

use Moose;
extends 'Scot::Util';

has nodes   => (
    is          => 'ro',
    isa         => 'ArrayRef',
    required    => 1,
    lazy        => 1,
    builder     => '_build_nodes',
    predicate   => 'has_nodes',
);

sub _build_nodes {
    my $self    = shift;
    my $attr    = "nodes";
    my $default = [ qw(localhost:9200) ];
    my $envname = "scot_util_elasticsearch_nodes";
    return $self->get_config_value($attr, $default, $envname);
}

has es   => (
    is          => 'ro',
    isa         => 'Object',
    required    => 1,
    lazy        => 1,
    builder     => '_build_es',
);

sub _build_es {
    my $self    = shift;
    my $log     = $self->log;
    my $es;

    $log->debug("Creating ES client");

    my @noproxy = map { m/^(.*):\d+$/ } @{$self->config->{nodes}};
    $ENV{'no_proxy'} = join ',', @noproxy;

    say "NODES : ", Dumper($self->config->{nodes});

    my %conparams   = (
        nodes   => $self->config->{nodes},
        cxn_pool    => 'Static',
        log_to  => 'Stderr',
    );

    try {
        $es  = Search::Elasticsearch->new(%conparams);
        $es->ping;
    }
    catch {
        $log->error("Error creating Elasticsearch client: $_");
        return undef;
    };
    $log->debug("ES is ",{filter=>\&Dumper, value=>$es});
    return $es;
}


sub index {
    my $self    = shift;
    my $type    = shift;    # collection
    my $href    = shift;    # the mongo json document
    my $index   = shift // 'scot'; # allow for submitting to a test index
    my $log     = $self->log;
    my $es      = $self->es;
    
    my %msg = (
        index   => $index,
        type    => $type,
        id      => $href->{id},
        body    => $href,
    );

    $log->debug("Sending ES INDEX message: ",{filter=>\&Dumper, value=>\%msg});

    $es->index(%msg);

}

sub delete {
    my $self    = shift;
    my $type    = shift;
    my $id      = shift;
    my $index   = shift // 'scot';
    my $log     = $self->log;
    my $es      = $self->es;

    $log->debug("Deleting $type $id from $index");

    my %msg = (
        index   => $index,
        type    => $type,
        id      => $id,
    );

    $es->delete(%msg);
}

sub search {
    my $self    = shift;
    my $body    = shift;    # elastic search query doc
    my $index   = shift // 'scot';
    my $es      = $self->es;
    my $log     = $self->log;

    my %msg = (
        index   => $index,
        body    => $body,
    );

    $log->debug("Searching ES for ", {filter=>\&Dumper, value => \%msg});

    my $results = $es->search(%msg);
    return $results;
}

sub delete_index {
    my $self    = shift;
    my $index   = shift;
    my $es      = $self->es;
    $es->indices->delete(index=>$index);
}

sub start_snapshot {
    my $self    = shift;
    my $conf    = $self->config;

    my $repo    = $conf->{repository};

}

sub get_snapshot_status {

}

sub delete_repo {

}

sub delete_snapshot {

}

sub close_index {

}

sub restore_snapsot {

}

sub restore_status {

}


__PACKAGE__->meta->make_immutable;
1;        

__END__
=back

=head1 COPYRIGHT

Copyright (c) 2013.  Sandia National Laboratories

=cut

=head1 AUTHOR

Todd Bruner.  tbruner@sandia.gov.  505-844-9997.

=cut

