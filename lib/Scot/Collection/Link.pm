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
    my $cursor  = $self->find({
        'target.id'     => $target->{id},
        'target.type'   => $target->{type},
    });
    return $cursor;
}

1;
