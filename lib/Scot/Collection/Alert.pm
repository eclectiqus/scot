package Scot::Collection::Alert;
use lib '../../../lib';
use v5.18;
use Moose 2;
use MooseX::AttributeShortcuts;
use Type::Params qw/compile/;
use Types::Standard qw/slurpy :types/;
use Data::Dumper;

extends 'Scot::Collection';

with    qw(
    Scot::Role::GetByAttr
    Scot::Role::GetTagged
);

sub create_from_handler {
    return {
        error   => "Direct creation of Alerts from Web API not supported",
    };
}

sub api_create {
    my $self    = shift;
    my $href    = shift;
    my $env     = $self->env;
    my $log     = $env->log;

    my $data    = $href->{data};
    if ( ! defined $data ) {
        $log->error("empty data field in api create request!");
        return 0;
    }

    my $agid    = $href->{alertgroup};
    if ( ! defined $agid ) {
        $log->error("alerts must have a parent alertgroup id");
        return 0;
    }

    my $columns = $href->{columns};
    if ( ! defined $columns ) {
        $log->error("alerts must have columns defined");
        return 0;
    }
    if ( ref($columns) ne "ARRAY" ) {
        $log->error("columns must be an array!");
        return 0;
    }

    my $alert = $self->create({
        data        => $data,
        alertgroup  => $agid,
        status      => 'open',
        columns     => $columns,
    });

    if ( ! defined $alert ) {
        $log->error("failed to create alert!");
        return 0;
    }
    return 1;
}

# updating an Alert can cause changes in the alertgroup

override 'update'   => sub {
    state $check    = compile( Object, Object, HashRef );
    my ( $self,
         $obj,
         $update )  = $check->(@_);

    my $data        = $self->_try_mongo_op(
        update  => sub {
            $self->_mongo_collection->find_and_modify({
                query   => { _id    => $obj->_id },
                update  => $update,
                new     => 1,
            });
    },);

    if ( ref $data ) {
        $self->_sync( $data => $obj );
        ## doing this manually in Scot::Collection::Event::build_from_alerts
        # alert has synced to database
        # update the alertgroup data
        $self->update_alertgroup_data($obj);
        return 1;
    }
    else {
        $obj->_set_removed(1);
        return;
    }
};

sub update_alertgroup_data {
    my $self    = shift;
    my $obj     = shift;
    my $mongo   = $self->env->mongo;

    my $alertgroup_id   = $obj->alertgroup;

    my $agcol   = $mongo->collection("Alertgroup");

    $agcol->refresh_data($alertgroup_id);

}

sub get_alerts_in_alertgroup {
    my $self    = shift;
    my $id      = shift;
    $id         += 0;       # argh! otherwise it tries string match
    my $cursor  = $self->find({alertgroup => $id});
    return $cursor;
}

override get_subthing => sub {
    my $self        = shift;
    my $thing       = shift;
    my $id          = shift;
    my $subthing    = shift;

    my $env     = $self->env;
    my $mongo   = $env->mongo;
    my $log     = $env->log;

    $id += 0;

    if ( $subthing eq "entry" ) {
        my $col = $mongo->collection('Entry');
        my $cur = $col->get_entries_by_target({
            id      => $id,
            type    => 'alert'
        });
        return $cur;
    }
    elsif ( $subthing eq "entity" ) {
        my $timer  = $env->get_timer("fetching links");
        my $col    = $mongo->collection('Link');
        my $ft  = $env->get_timer('find actual timer');
        my $cur    = $col->get_links_by_target({ 
            id => $id, type => 'alert' 
        });
        &$ft;
        my @lnk = map { $_->{entity_id} } $cur->all;
        &$timer;

        $timer  = $env->get_timer("generating entity cursor");
        $col    = $mongo->collection('Entity');
        $cur    = $col->find({id => {'$in' => \@lnk }});
        &$timer;
        return $cur;
    }
    elsif ( $subthing eq "tag" ) {
        my $col = $mongo->collection('Appearance');
        my $cur = $col->find({
            type            => 'tag',
            'target.type'   => 'alert',
            'target.id'     => $id,
        });
        my @ids = map { $_->apid } $cur->all;
        $col    = $mongo->collection('Tag');
        $cur    = $col->find({ id => {'$in' => \@ids }});
        return $cur;

    }
    elsif ( $subthing eq "source" ) {
        my $col = $mongo->collection('Appearance');
        my $cur = $col->find({
            type            => 'source',
            'target.type'   => 'alert',
            'target.id'     => $id,
        });
        my @ids = map { $_->apid } $cur->all;
        $col    = $mongo->collection('Source');
        $cur    = $col->find({ id => {'$in' => \@ids }});
        return $cur;

    }
    elsif ( $subthing eq "event" ) {
        my $col = $mongo->collection('Event');
        my $cur = $col->find({ promoted_from => $id });
        return $cur;
    }
    elsif ( $subthing eq "file" ) {
        my $col = $mongo->collection('File');
        my $cur = $col->find({
            'entry_target.type' => 'alert',
            'entry_target.id'   => $id,
        });
        return $cur;
    }
    else {
        $log->error("unsupported subthing $subthing!");
    }
};

sub api_subthing {
    my $self    = shift;
    my $req     = shift;
    my $mongo   = $self->env->mongo;

    my $thing       = $req->{collection};
    my $id          = $req->{id}+0;
    my $subthing    = $req->{subthing};

    $self->env->log->debug("api_subthing: /$thing/$id/$subthing");

    if ( $subthing eq "entry" ) {
        return $mongo->collection('Entry')->get_entries_by_target({
            id      => $id,
            type    => 'alert',
        });
    }

    if ( $subthing eq "entity" ) {
        my @links = map { $_->{entity_id} }
            $mongo->collection('Link')->get_links_by_target({
                id  => $id, type => 'alert'
            })->all;
        return $mongo->collection('Entity')->find({
            id => { '$in' => \@links }
        });
    }
    if ( $subthing eq "event" ) {
        return $mongo->collection('Event')->find({promoted_from => $id});
    }
    if ( $subthing eq "file" ) {
        return $mongo->collection('File')->find({
            'entry_target.type' => 'alert',
            'entry_target.id'   => $id,
        });
    }
    if ( $subthing eq "tag" ) {
        my @appearances = map { $_->{apid} } 
            $mongo->collection('Appearance')->find({
                type    => 'tag', 
                'target.type'   => 'alert',
                'target.id'     => $id,
            })->all;
        return $mongo->collection('Tag')->find({
            id => {'$in' => \@appearances}
        });
    }

    if ( $subthing eq "source" ) {
        my @appearances = map { $_->{apid} } 
            $mongo->collection('Appearance')->find({
                type    => 'source', 
                'target.type'   => 'alert',
                'target.id'     => $id,
            })->all;
        return $mongo->collection('Source')->find({
            id => {'$in' => \@appearances}
        });
    }

    die "Unsupported alert subthing: $subthing";

}

sub update_alert_status {
    my $self    = shift;
    my $id      = shift;
    my $status  = shift;
    my $targets = shift;
    my $env     = $self->env;
    my $log     = $env->log;
    my @ids     = ();

    $log->debug("attempting updating alert status");

    unless ( grep { /$status/ } (qw(open closed promoted)) ) {
        $log->error("Invalid Alert Status set attempt: $status");
        return;
    }

    my $cur = $self->find({ alertgroup  => $id + 0 });

    unless ( $cur ) {
        $log->error("failed to find any alerts for alertgroup $id");
        return;
    }

    my @aidlist = ();
    if ( defined($targets) ) {
        @aidlist = map { $_ + 0 } @$targets;
    }

    $log->debug("updating alert status");

    ALERT:
    while ( my $alert = $cur->next ) {
        my $aid = $alert->id + 0;
        if ( defined($targets) ) {
            unless ( grep { $_ == $aid } @aidlist ) {
                next ALERT;
            }
        }
        $alert->update_set( status => $status );
        push @ids, $alert->id +0;
    }
    return wantarray ? @ids : \@ids;
}
sub update_alert_parsed {
    my $self    = shift;
    my $id      = shift;
    my $status  = shift;
    my $targets = shift;
    my $env     = $self->env;
    my $log     = $env->log;
    $status     += 0;
    my @ids     = ();

    $log->debug("attempting updating alert status");

    unless ( $status == 0 or $status == 1 ) {
        $log->error("Invalid Alert parsed set attempt: $status");
        return;
    }

    my $cur = $self->find({ alertgroup  => $id + 0 });

    unless ( $cur ) {
        $log->error("failed to find any alerts for alertgroup $id");
        return;
    }

    my @aidlist = ();
    if ( defined($targets) ) {
        @aidlist = map { $_ + 0 } @$targets;
    }

    $log->debug("updating alert parsed status");

    ALERT:
    while ( my $alert = $cur->next ) {
        my $aid = $alert->id + 0;
        if ( defined($targets) ) {
            unless ( grep { $_ == $aid } @aidlist ) {
                next ALERT;
            }
        }
        $alert->update_set( parsed => $status );
        $log->debug("reset parsed on alert $aid");
        push @ids, $aid;
    }
    return wantarray ? @ids : \@ids;
}

# override get_subthing => sub {
#     my $self    = shift;
#     my $thing   = shift;
#     my $id      = shift;
#     my $subthing    = shift;
#     my $env     = $self->env;
#     my $mongo   = $env->mongo;
#     my $log     = $env->log;
# 
#     $id += 0;
# 
#     if ( $subthing eq "alertgroup" ) {
#         my $col   = $mongo->collection('Alert');
#         my $alert = $col->find_iid($id);
#         my $agid  = $alert->alertgroup;
#         $col      = $mongo->collection('Alertgroup');
#         my $cur   = $col->find({id => $agid});
#         return $cur;
#     }
#     else {
#         $log->error("unsupported subthing $subthing!");
#     }
# };

1;
