package Scot::Collection::Link;

use lib '../../../lib';
use Data::Dumper;
use Moose 2;

extends 'Scot::Collection';
with    qw(
    Scot::Role::GetByAttr
);

sub create_from_api {
    my $self    = shift;
    return $self->create_link(@_);
}

# link creation or update
sub create_link {
    my $self    = shift;
    my $entity  = shift; # expecting $entity object or HREF { id =>x, value=>y }
    my $target  = shift; # href { id => x, type => y }
    my $when    = shift // $self->env->now();
    my $eid;
    my $value;

    if ( ref($entity) eq 'Scot::Model::Entity') {
        $eid    = $entity->id;
        $value  = $entity->value;
    }
    elsif ( ref($entity) eq "HASH" ) {
        $eid    = $entity->{id};
        $value  = $entity->{value};
    }
    else {
        $self->env->log->error("param 1 (entity) invalid!");
        return undef;
    }

    if ( ref($target) ne "HASH" ) {
        $self->env->log->error("param 2 (target) is not HashRef!");
        return undef;
    }

    unless ( $target->{id} or $target->{type} ) {
        $self->env->log->error("param 2 (target) is not valid!");
        return undef;
    }

    my $link    = $self->create({
        when        => $when,
        entity_id   => $eid,
        value       => $value,
        target      => $target,
    });

    return $link;
}

sub get_links_by_value {
    my $self    = shift;
    my $value   = shift;
    my $cursor  = $self->find({value => $value});
    return $cursor;
}

sub get_links_by_entity_id {
    my $self    = shift;
    my $id      = shift;
    my $cursor  = $self->find({ entity_id => $id });
    return $cursor;
}

sub get_links_by_target {
    my $self    = shift;
    my $target  = shift;
    my $id      = $target->{id};
    my $type    = $target->{type};

    $self->env->log->debug("Finding Links to $type $id");
    my $cursor = $self->find({
        'target.type'   => $type,
        'target.id'     => $id + 0,
    });
    # weird unpredictable results
    #my $cursor  = $self->find({
    #    target  => {
    #        id     => $id,
    #        type   => $type,
    #    }
    #});
    $self->env->log->debug("found ".$cursor->count." links");
    return $cursor;
}

sub get_total_appearances {
    my $self    = shift;
    my $entity  = shift;
    my $cursor  = $self->find({ entity_id => $entity->id });

    return $cursor->count;
}

sub get_display_count_slow {
    my $self    = shift;
    my $entity  = shift;
    my $cursor  = $self->find({
        'entity_id'   => $entity->id,
        'target.type' => {
            # '$in'  => [ 'alert', 'incident', 'intel', 'event' ]
            '$nin'  => [ 'alertgroup', 'entry' ]
        }
    });
    my %seen;
    while (my $link = $cursor->next) {
        my $key = $link->target->{type} . $link->target->{id};
        $seen{$key}++;
    }
    return scalar(keys %seen);
}

sub get_display_count {
    my $self    = shift;
    my $entity  = shift;
    my $collection  = $self->collection_name;
    my %command;
    my $tie = tie(%command, "Tie::IxHash");
    %command = (
        'distinct'  => 'entity',
        'key'       => 'value',
        'query'     => { value => $entity->value },
    );
    my $mongo   = $self->meerkat;
    my $result  = $self->_try_mongo_op(
        get_distinct    => sub {
            my $dbn  = $mongo->database_name;
            my $db   = $mongo->_mongo_database($dbn);
            my $job  = $db->run_command(\%command);
            return $job->{value};
        }
    );
    $self->env->log->debug("got result: ",{filter=>\&Dumper, value=>$result});
    return scalar(@$result);
}

1;
