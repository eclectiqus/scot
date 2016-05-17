#!/usr/bin/env perl

use lib '../lib';
use Scot::Env;

my $env = Scot::Env->new();

my $mongo = $env->mongo;

foreach my $colname (qw(appearance alertgroup alert checklist config entity entry event guide history incident intel source tag user audit)) {

    print "Getting Max Id of $colname\n";
    my $collection  = $mongo->collection(ucfirst($colname));

    my $cursor  = $collection->find({});
    $cursor->sort({id=>-1});
    my $object  = $cursor->next;

    unless ($object) {
        print "! No object returned !\n";
        next;
    }

    my $max     = $object->id;
    print "Got max id of $max\n";

    $collection->set_next_id($max);
}



