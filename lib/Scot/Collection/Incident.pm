package Scot::Collection::Incident;
use lib '../../../lib';
use Moose 2;
use Data::Dumper;

extends 'Scot::Collection';
with    qw(
    Scot::Role::GetByAttr
    Scot::Role::GetTagged
);

=head1 Name

Scot::Collection::File

=head1 Description

Custom collection operations for Files

=head1 Methods

=over 4

=item B<create_from_api($handler_ref)>

Create an event and from a POST to the handler

=cut

override api_create => sub {
    my $self    = shift;
    my $request = shift;
    my $env     = $self->env;
    my $log     = $env->log;
    my $mongo   = $env->mongo;

    $log->trace("Custom create in Scot::Collection::Incident");

    my $user    = $request->{user};
    my $json    = $request->{request}->{json};

    my @tags    = $env->get_req_array($json, "tags");

    my $incident    = $self->create($json);

    unless ($incident) {
        $log->error("ERROR creating Incident from ",
                    { filter => \&Dumper, value => $request});
        return undef;
    }

    my $id  = $incident->id;

    if ( scalar(@tags) > 0 ) {
        $self->upssert_links("Tag", "incident", $id, @tags);
    }
    return $incident;
};


sub create_from_api {
    my $self    = shift;
    my $request = shift;
    my $env     = $self->env;
    my $log     = $env->log;
    my $mongo   = $env->mongo;

    $log->trace("Custom create in Scot::Collection::Incident");

    my $user    = $request->{user};
    my $json    = $request->{request}->{json};

    my @tags    = $env->get_req_array($json, "tags");

    my $incident    = $self->create($json);

    unless ($incident) {
        $log->error("ERROR creating Incident from ",
                    { filter => \&Dumper, value => $request});
        return undef;
    }

    my $id  = $incident->id;

    if ( scalar(@tags) > 0 ) {
        $self->upssert_links("Tag", "incident", $id, @tags);
    }
    return $incident;
}

sub create_promotion {
    my $self    = shift;
    my $object  = shift;
    my $req     = shift;
    my $user    = $req->{user};

    my $reportable      = $self->get_value_from_request($req, "reportable");
    my $subject         = $object->subject // 
                            $self->get_value_from_request($req, "subject");
    my $href    = {
        reportable  => $reportable ? 1 : 0,
        subject     => $subject,
        owner       => $user,
    };
    my $category        = $self->get_value_from_request($req, "category");
    $href->{category}   = $category if (defined($category));
    my $sensitivity     = $self->get_value_from_request($req, "sensitivity");
    $href->{sensitivity} = $sensitivity if (defined $sensitivity);
    my $occurred        = $self->get_value_from_request($req, "occurred");
    $href->{occurred}   = $occurred if (defined $occurred);
    my $discovered      = $self->get_value_from_request($req, "discovered");
    $href->{discovered} = $occurred if (defined $discovered);

    my $incident = $self->create($href);
    return $incident;
}

sub get_promotion_obj {
    my $self    = shift;
    my $object  = shift;
    my $req     = shift;
    my $promotion_id    = $req->{request}->{json}->{promote}
                          // $req->{request}->{params}->{promote};
    my $incident;

    if ( $promotion_id =~ /\d+/ ) {
        $incident = $self->find_iid($promotion_id);
    }
    if ( ! defined $incident ) {
        $incident = $self->create_promotion($object, $req);
    }
    return $incident;
}

override get_subthing => sub {
    my $self        = shift;
    my $thing       = shift;
    my $id          = shift;
    my $subthing    = shift;
    my $env         = $self->env;
    my $mongo       = $env->mongo;
    my $log         = $env->log;

    $id += 0;

    if ( $subthing eq "entry" ) {
        my $col = $mongo->collection('Entry');
        my $cur = $col->get_entries_by_target({
            id      => $id,
            type    => 'incident'
        });
        return $cur;
    }
    elsif ( $subthing eq "event" ) {
        my $inc = $self->find_iid($id);
        my $col = $mongo->collection('Event');
        my $cur = $col->find({ id => { '$in' => $inc->promoted_from } });
        return $cur;
    }
    elsif ( $subthing eq "entity" ) {
        my $timer  = $env->get_timer("fetching links");
        my $col    = $mongo->collection('Link');
        my $ft  = $env->get_timer('find actual timer');
        my $cur    = $col->get_links_by_target({ 
            id => $id, type => 'incident' 
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
            'target.type'   => 'incident',
            'target.id'     => $id,
        });
        my @ids = map { $_->{apid} } $cur->all;
        $col    = $mongo->collection('Tag');
        $cur    = $col->find({ id => {'$in' => \@ids }});
        return $cur;
    }
    elsif ( $subthing eq "source" ) {
        my $col = $mongo->collection('Appearance');
        my $cur = $col->find({
            type            => 'source',
            'target.type'   => 'incident',
            'target.id'     => $id,
        });
        my @ids = map { $_->{apid} } $cur->all;
        $col    = $mongo->collection('Source');
        $cur    = $col->find({ id => {'$in' => \@ids }});
        return $cur;
    }
    elsif ( $subthing eq "history" ) {
        my $col = $mongo->collection('History');
        my $cur = $col->find({'target.id'   => $id,
                              'target.type' => 'incident',});
        return $cur;
    }
    elsif ( $subthing eq "file" ) {
        my $col = $mongo->collection('File');
        my $cur = $col->find({
            'entry_target.type' => 'incident',
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
    my $log     = $self->env->log;

    my $thing       = $req->{collection};
    my $subthing    = $req->{subthing};
    my $id          = $req->{id}+0;

    if ( $subthing eq "event" ) {
        return $mongo->collection('Event')->find({
            promotion_id    => $id
        });
    }

    if ( $subthing eq "entry" ) {
        return $mongo->collection('Entry')->get_entries_by_target({
            id      => $id,
            type    => 'incident',
        });
    }

    if ( $subthing eq "entity" ) {
        my @links   = map { $_->{entity_id} }
            $mongo->collection('Link')->get_links_by_target({
                id      => $id,
                type    => 'event',
            })->all;
        return $mongo->collection('Entity')->find({
            id => { '$in' => \@links }
        });
    }

    if ( $subthing eq "tag" ) {
        my @appearances = map { $_->{apid} }
            $mongo->collection('Appearance')->find({
                type            => 'tag',
                'target.type'   => 'event',
                'target.id'     => $id,
            })->all;
        return $mongo->collection('Tag')->find({
            id  => { '$in' => \@appearances }
        });
    }
    if ( $subthing eq "source" ) {
        my @appearances = map { $_->{apid} }
            $mongo->collection('Appearance')->find({
                type            => 'source',
                'target.type'   => 'event',
                'target.id'     => $id,
            })->all;
        return $mongo->collection('Source')->find({
            id  => { '$in' => \@appearances }
        });
    }

    if ( $subthing eq "history" ) {
        return $mongo->collection('History')->find({
            'target.id'   => $id,
            'target.type' => 'event'
        });
    }

    if ( $subthing eq "file" ) {
        return $mongo->collection('File')->find({
            'entry_target.id'     => $id,
            'entry_target.type'   => 'event',
        });
    }

    die "Unsupported subthing $subthing";

}

sub autocomplete {
    my $self    = shift;
    my $frag    = shift;
    my $cursor  = $self->find({
        subject => /$frag/
    });
    my @records = map { {
        id  => $_->{id}, key => $_->{subject}
    } } $cursor->all;
    return wantarray ? @records : \@records;
}


1;
