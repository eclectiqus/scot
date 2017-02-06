#!/usr/bin/env perl

use lib '../lib';
use lib '../../lib';

use Test::More;
use Test::Mojo;
use Data::Dumper;
use Mojo::JSON qw(decode_json encode_json);

$ENV{'scot_mode'}           = "testing";
$ENV{'scot_auth_type'}      = "Testing";
$ENV{'scot_logfile'}        = "/var/log/scot/scot.test.log";
$ENV{'scot_config_paths'}   = '../../../Scot-Internal-Modules/etc';
$ENV{'scot_config_file'}    = 'scot_env_test.cfg';

print "Resetting test db...\n";
system("mongo scot-testing <../../etcsrc/database/reset.js 2>&1 > /dev/null");

my @defgroups       = ( 'wg-scot-ir', 'testing' );

my $t   = Test::Mojo->new('Scot');

$t  ->post_ok  ('/scot/api/v2/intel'  => json => {
        subject => "Test Intel 1",
        source  => ["Guy in Fedora"],
    })
    ->status_is(200)
    ->json_is('/status' => 'ok');

my $intel1 = $t->tx->res->json->{id};

$t  ->get_ok("/scot/api/v2/intel/$intel1")
    ->status_is(200);



#  print Dumper($t->tx->res->json);
 done_testing();
 exit 0;



