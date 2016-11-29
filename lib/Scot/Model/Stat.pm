package Scot::Model::Stat;

use lib '../../../lib';
use Moose;
use DateTime;
use namespace::autoclean;

=head1 Name

Scot::Model::Stat

=head1 Description

The model of a Stat

=cut

extends 'Scot::Model';
with    qw(
    Meerkat::Role::Document
    Scot::Role::Hashable
);

=head1 Attributes

=over 4

=item B<epoch>

the epoch representation 

=cut

has epch  => (
    is          => 'ro',
    isa         => 'Epoch',
    required    => 1,
    lazy        => 1,
    builder     => '_build_epoch',
);

sub _build_epoch {
    my $self    = shift;
    my $dt      = DateTime->new(
        year    => $self->year,
        month   => $self->month,
        day     => $self->day,
        hour    => $self->hour,
        minute  => 0,
        second  => 0,
    );
    return $dt;
}

has year    => (
    is          => 'ro',
    isa         => 'Int',
    requrired   => 1,
    default     => 1969,
);

has month    => (
    is          => 'ro',
    isa         => 'Int',
    requrired   => 1,
    default     => 1,
);

has day    => (
    is          => 'ro',
    isa         => 'Int',
    requrired   => 1,
    default     => 2,
);

has dow    => (
    is          => 'ro',
    isa         => 'Int',
    requrired   => 1,
    default     => 2,
);

has quarter    => (
    is          => 'ro',
    isa         => 'Int',
    requrired   => 1,
    default     => 1,
);

has hour    => (
    is          => 'ro',
    isa         => 'Int',
    requrired   => 1,
    default     => 1,
);

has metric  => (
    is          => 'ro',
    isa         => 'Str',
    required    => 1,
    default     => 'unknown',
);

has value   => (
    is          => 'ro',
    isa         => 'Num',
    required    => 1,
    default     => 0,
);

1;
