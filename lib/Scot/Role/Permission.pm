package Scot::Role::Permission;

use Moose::Role;
use namespace::autoclean;

# everything that has permissions should have an owner
# default owner is  a configuration item in env

has owner   => (
    is          => 'ro',
    isa         => 'Str',
    required    => 1,
    builder     => '_get_default_owner',
);

# groups control who can read and modify the object
# {
#   read    => [ group1, group2,..., groupn ],
#   modify  => [ group3, group4,..., groupx ],
# }

has groups  => (
    is          => 'ro',
    isa         => 'HashRef',
    required    => 1,
    builder     => '_get_default_groups',
);

sub _get_default_owner {
    my $self    = shift;
    my $env     = Scot::Env->instance;
    return $env->default_owner;
}

sub _get_default_groups {
    my $self    = shift;
    my $env     = Scot::Env->instance;
    return  $env->default_groups;
}

sub is_permitted {
    my $self            = shift;
    my $operation       = shift;
    my $users_groups    = shift;
    my $env             = Scot::Env->instance;
    my $log             = $env->log;

    my $perm_href   = $self->groups;
    my $perm_aref   = $perm_href->{$operation};

    $log->debug("Permitted groups for $operation: " . 
                join(',', @{$perm_aref}) );

    # $log->debug("Users groups are ". join(',', @{$users_groups}));

    foreach my $group ( @$users_groups ) {
        if ( grep { /^$group$/i } @{$self->groups->{$operation}} ) {
            return 1;
        }
    }
    return undef;
}

sub is_readable {
    my $self                = shift;
    my $users_groups        = shift;
    return $self->is_permitted("read", $users_groups);
    
}

sub is_modifiable {
    my $self            = shift;
    my $users_groups    = shift;
    return $self->is_permitted("modify", $users_groups);
}

1;

