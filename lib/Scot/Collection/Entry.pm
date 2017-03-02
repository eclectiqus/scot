package Scot::Collection::Entry;

use lib '../../../lib';
use Moose 2;
use Data::Dumper;

extends 'Scot::Collection';

with    qw(
    Scot::Role::GetTargeted
    Scot::Role::GetByAttr
    Scot::Role::GetTagged
);


sub create_from_promoted_alert {
    my $self    = shift;
    my $alert   = shift;
    my $event   = shift;
    my $env     = $self->env;
    my $log     = $env->log;
    my $mongo   = $env->mongo;
    my $mq      = $env->mq;
    my $json;

    $log->debug("Creating/Adding to Alert Entry from promoted Alert");

    $json->{groups}->{read}    = $alert->groups->{read} // 
                                 $env->default_groups->{read};
    $json->{groups}->{modify}  = $alert->groups->{modify} // 
                                 $env->default_groups->{modify};
    $json->{target}            = {
        type                  => 'event',
        id                    => $event->id,
    };
    my $id  = $alert->id;
    $json->{body}              = 
        qq|<h3>From Alert <a href="/#/alert/$id">$id</h3>|.
        $self->build_table($alert);
    $log->debug("Using : ",{filter=>\&Dumper, value => $json});

    my $existing_entry = $self->find_existing_alert_entry("event", $event->id);

    if ( $existing_entry ) {
        # use this as the parent so that all additional alert promoted to this event
        # will be "enclosed" in on "alert" class entry.
        $json->{parent} = $existing_entry->id;
    }
    else {
        # create the "alert" type entry
        $log->debug("creating a new alert type entry");
        my $aentry  = $self->create({
            class   => "alert",
            parent  => 0,
            target  => {
                type    => 'event',
                id      => $event->id,
            },
        });
        $json->{parent} = $aentry->id;
    }

    $log->debug("creating the promoted alert entry");
    my $entry_obj              = $self->create($json);

    $log->debug("Created Entry : ".$entry_obj->id);
    return $entry_obj;
}

sub find_existing_alert_entry {
    my $self    = shift;
    my $type    = shift;
    my $id      = shift;
    my $log     = $self->env->log;

    my $col     = $self->env->mongo->collection('Entry');
    my $obj     = $col->find_one({
        'target.type'   => $type,
        'target.id'     => $id,
        class           => "alert",
    });

    if ( defined $obj and ref($obj) eq "Scot::Model::Entry" ) {
        $log->debug("Found an existing alert entry type for $type $id");
        return $obj;
    }
    $log->warn("Target of Alert promotion does not have an existing alert entry");
    return undef;
}

sub find_existing_file_entry {
    my $self    = shift;
    my $type    = shift;
    my $id      = shift;
    my $log     = $self->env->log;
    my $col     = $self->mongo->collection('Entry');
    my $obj     = $col->find_one({
        'target.type'   => $type,
        'target.id'     => $id,
        class           => 'file',
    });
    if ( defined $obj and ref($obj) eq "Scot::Model::Entry" ) {
        $log->debug("found an existing file entry type for $type $id");
        return $obj;
    }
    $log->warn("Target of File upload does not have an existing file entry");
    return undef;
}


sub build_table {
    my $self    = shift;
    my $alert   = shift;
    my $env     = $self->env;
    my $log     = $env->log;
    my $data    = $alert->data;
    my $html    = qq|<table class="tablesorter alertTableHorizontal">\n|;

    $log->debug("BUILDING ALERT TABLE");
    my $alerthref = $alert->as_hash;
    $log->debug({filter=>\&Dumper, value=>$alerthref});

    # some confusion as to where columns should actually be
    my $columns = $alert->columns;
    $log->debug("columns are ",{filter=>\&Dumper, $columns});

    if ( ! defined $columns or scalar(@$columns) == 0) { 
        $log->debug("Columns not in the right place!");
        $columns    = $data->{columns};
        $log->debug("columns are ",{filter=>\&Dumper, value => $columns});
    }
    else {
        $log->debug("columns ok? ",{filter=>\&Dumper, value => $columns});
    }

    if  ( ! defined $columns or scalar(@$columns) == 0) {
        $log->debug("Columns still unset!");
    }
    else {
        $log->debug("columns ok? ",{filter=>\&Dumper, value => $columns});
    }

    $html .= "<tr>\n";
    foreach my $key ( @{$columns} ) {
        next if ($key eq "columns");
        $html .= "<th>$key</th>";
    }
    $html .= "\n</tr>\n<tr>\n";

    foreach my $key ( @{$columns} ) {
        next if ($key eq "columns");
        my $value   = $data->{$key};
        $html .= qq|<td>$value</td>|;
    }
    $html .= qq|\n</tr>\n</table>\n|;
    return $html;
}

sub create_from_file_upload {
    my $self        = shift;
    my $fileobj     = shift;
    my $entry_id    = shift;
    my $target_type = shift;
    my $target_id   = shift;
    my $fid         = $fileobj->id;
    my $env         = $self->env;
    my $mongo       = $env->mongo;
    my $log         = $env->log;
    my $htmlsrc     = <<EOF;
<div class="fileinfo">
    <table>
        <tr>
            <th align="left">File Id</th> <td>%d</td>
        </tr><tr>
            <th align="left">Filename</th><td>%s</td>
        </tr><tr>
            <th align="left">Size</th>    <td>%s</td>
        </tr><tr>
            <th align="left">md5</th>     <td>%s</td>
        </tr><tr>
            <th align="left">sha1</th>    <td>%s</td>
        </tr><tr>
            <th align="left">sha256</th>  <td>%s</td>
        </tr><tr>
            <th align="left">notes</th>   <td>%s</td>
        </tr>
    </table>
    <a href="/scot/api/v2/file/%d?download=1">
        Download
    </a>
</div>
EOF
    my $html = sprintf( $htmlsrc,
        $fileobj->id,
        $fileobj->filename,
        $fileobj->size,
        $fileobj->md5,
        $fileobj->sha1,
        $fileobj->sha256,
        $fileobj->notes,
        $fileobj->id);
    
    my $entry_href  = {
        parent     => $entry_id,
        body       => $html,
        target     => {
            id     => $target_id,
            type   => $target_type,
        },
        groups     => {
            read   => $fileobj->groups->{read} // $env->default_groups->{read},
            modify => $fileobj->groups->{modify} // $env->default_groups->{modify},
        },
    };

    $log->debug("creating file upload entry with ", {filter=>\&Dumper, value=>$entry_href});

    my $existing_entry = $self->find_existing_alert_entry($target_type, $target_id);

    if ( $existing_entry ) {
        # use this as the parent so that all additional file uploads
        # will be "enclosed" in on "file" class entry.
        $entry_href->{parent} = $existing_entry->id;
    }
    else {
        # create the "alert" type entry
        $log->debug("creating a new alert type entry");
        my $aentry  = $self->create({
            class   => "file",
            parent  => 0,
            target  => {
                type    => $target_type,
                id      => $target_id
            },
        });
        $entry_href->{parent} = $aentry->id;
    }

    my $entry_obj   = $self->create($entry_href);

    unless ( defined $entry_obj  and ref($entry_obj) eq "Scot::Model::Entry") {
        $log->error("Failed to create entry object!");
    }

    # TODO: need to actually update the updated time in the target

    return $entry_obj;

}

sub create_from_api {
    my $self    = shift;
    my $request = shift;

    my $env     = $self->env;
    my $log     = $env->log;
    my $mongo   = $env->mongo;
    my $mq      = $env->mq;

    $log->trace("Custom create in Scot::Collection::Entry");

    my $user    = $request->{user};

    my $json    = $request->{request}->{json};

    my $target_type = delete $json->{target_type};
    my $target_id   = delete $json->{target_id};

    unless ( defined $target_type ) {
        $log->error("Error: Must provide a target type");
        return {
            error_msg   => "Entries must have target_type defined",
        };
    }

    unless ( defined $target_id ) {
        $log->error("Error: Must provide a target id");
        return {
            error_msg   => "Entries must have target_id defined",
        };
    }

    my $task = $self->validate_task($request);
    if ( $task ) {
        $json->{class}      = "task";
        $json->{metadata}   = $task;
    }

    my $default_permitted_groups = $self->get_default_permissions(
        $target_type, $target_id
    );

    unless ( $request->{readgroups} ) {
        $json->{groups}->{read} = $default_permitted_groups->{read};
    }
    unless ( $request->{modifygroups} ) {
        $json->{groups}->{modify} = $default_permitted_groups->{modify};
    }

    $json->{target} = {
        type    => $target_type,
        id      => $target_id,
    };

    $json->{owner}  = $user;

    $log->debug("Creating entry with: ", { filter=>\&Dumper, value => $json});

    my $entry_obj   = $self->create($json);

    return $entry_obj;
}


sub validate_task {
    my $self    = shift;
    my $href    = shift;
    my $json    = $href->{request}->{json};

    unless ( defined $json->{task} ) {
        # if task isn't set that is ok and valid
        return undef; 
    }

    # however, if it is set, we need to make sure it has 
    # { when => x, who => user, status => y }

    unless ( defined $json->{task}->{when} ) {
        $href->{when} = $self->env->now();
    }

    unless ( defined $json->{task}->{who} ) {
        $href->{who}    = $href->{user};
    }
    unless ( defined $json->{task}->{status} ) {
        $href->{status} = "open";
    }
    return $href;
}


sub get_entries {
    my $self    = shift;
    my %params  = @_;
    my $id      = $params{target_id};
    my $thing   = $params{target_type};
    $id         +=0;

    my $cursor  = $self->find({
        'target.type' => $thing,
        'target.id'   => $id,
    });
    return $cursor;
}

sub get_tasks   {
    my $self    = shift;
    my $cursor  = $self->find({
        'task.status'   => { '$exists' => 1}
    });
    return $cursor;
}

sub create_file_entry {
    my $self    = shift;
    my $fileobj = shift;
    my $entryid = shift;
    my $env     = $self->env;
    my $log     = $env->log;

    $entryid += 0;

    my $fid     = $fileobj->id;
    my $htmlsrc = <<EOF;

<div class="fileinfo">
    <table>
        <tr>
            <th>File Id</th>%d</td>
            <th>Filename</th><td>%s</td>
            <th>Size</th><td>%s</td>
            <th>md5</th><td>%s</td>
            <th>sha1</th><td>%s</td>
            <th>sha256</th><td>%s<d>
            <th>notes</th><td>%s</td>
    </table>
    <a href="/scot/file/%d?download=1">
        Download
    </a>
</div>
EOF
    my $html = sprintf(
        $htmlsrc,
        $fileobj->id,
        $fileobj->filename,
        $fileobj->size,
        $fileobj->md5,
        $fileobj->sha1,
        $fileobj->sha256,
        $fileobj->notes,
        $fileobj->id);

    my $newentry;
    my $parententry = $self->find_iid($entryid);

    # TODO: potential problem here that needs more thought
    #  groups is being set to default_groups and probably should inherit from parent
    # entry_id or target's permissions

    my $href    = {
        body    => $html,
        parent  => $entryid,
        groups  => $self->get_default_permissions($parententry->target->{type}, $parententry->target->{id}),
        target  => {
            type    => $parententry->target->{type},
            id      => $parententry->target->{id},
        },
    };

    $log->debug("Creating Entry with ", {filter=>\&Dumper, value => $href});

#    try {
        $newentry = $self->create($href);
#    }
#    catch {
#        $log->error("Failed to create Entry!: $_");
#    };

    return $newentry;
}

sub get_entries_on_alertgroups_alerts {
    my $self        = shift;
    my $alertgroup  = shift;
    my $env         = $self->env;
    my $mongo       = $env->mongo;

    my $id  = $alertgroup->id;
    my $ac  = $mongo->collection('Alert')->find({alertgroup => $id});

    return undef unless ( $ac );

    my @aids = map { $_->{id} } $ac->all;

    my $cursor = $self->find({
        'target.id'   => { '$in' => \@aids },
        'target.type' => 'alert',
    });
    return $cursor;
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

    if ( $subthing eq "history" ) {
        my $col = $mongo->collection('History');
        my $cur = $col->find({'target.id'   => $id,
                              'target.type' => 'entry',});
        return $cur;
    }
    elsif ( $subthing eq "entity" ) {
        my $timer  = $env->get_timer("fetching links");
        my $col    = $mongo->collection('Link');
        my $ft  = $env->get_timer('find actual timer');
        my $cur    = $col->get_links_by_target({ 
            id => $id, type => 'entry' 
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
    elsif ( $subthing eq "file" ) {
        my $col = $mongo->collection('File');
        my $cur = $col->find({entry => $id});
        return $cur;
    }
    else {
        $log->error("unsupported subthing $subthing!");
    }
};

sub get_entries_by_target {
    my $self    = shift;
    my $target  = shift; # { id => , type =>  }
    my $cursor  = $self->find({
        'target.id' => $target->{id},
        'target.type'   => $target->{type},
    });
    return $cursor;
}




1;
