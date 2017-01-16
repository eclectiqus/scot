#!/usr/bin/env perl

use strict;
use warnings;
use v5.18;

use lib '/opt/scot/lib';
use lib '../lib';
use lib '../../Scot-Internal-Modules/lib';
use Scot::App::Mail;
use Scot::Env;
use Data::Dumper;
use DateTime;

# Sample code on how to mark a certain number of days of email messages as unread

say "--- Starting Mail Ingester ---";

my $processor   = Scot::App::Mail->new({
    configuration_file         => "mail.app.cfg",
    interactive                 => "no",
});

# $processor->mark_all_read();



$processor->mark_some_unread({'day', 3});
