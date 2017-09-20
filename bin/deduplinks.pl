#!/usr/bin/env perl

use MongoDB;
use Data::Dumper;
use v5.18;

my $mongo           = MongoDB->connect->db('scot-prod');
my $collection      = $mongo->get_collection('link');
my $cursor          = $collection->find();
my %seen            = ();
my $duplicates      = 0;

LINK:
while (my $link = $cursor->next) {
    my $v0  = $link->{vertices}->[0];
    my $v1  = $link->{vertices}->[1];

    my $m0  = join('-',$v0->{type},$v0->{id},$v1->{type},$v1->{id});
    my $m1  = join('-',$v1->{type},$v1->{id},$v0->{type},$v0->{id});
    my $id  = $link->{id};

    if ( defined $seen{$m0} ) {
        say "Link $id is a duplicate of ".$seen{$m0};
        $duplicates++;
        next LINK;
    }
    if ( defined $seen{$m1} ) {
        say "Link $id is a duplicate of ".$seen{$m1}." (inv)";
        $duplicates++;
        next LINK;
    }
    say "Link $id is first occurrence of $m0";
    $seen{$m0} = $id;
}

say "$duplicates Duplicates found";

