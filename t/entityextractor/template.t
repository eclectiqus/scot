#!/usr/bin/env perl
use lib '../../lib';

use Test::More;
use Test::Deep;
use Data::Dumper;
use Scot::Util::EntityExtractor;
use Scot::Util::Config;
use Scot::Util::Logger;
my $confobj = Scot::Util::Config->new({
    paths   => ['../../../Scot-Internal-Modules/etc/'],
    file    => 'logger_test.cfg',
});
my $loghref = $confobj->get_config();
my $log     = Scot::Util::Logger->new($loghref);

my $extractor   = Scot::Util::EntityExtractor->new({log=>$log});
my $source      = <<'EOF';
EOF

my $flair   = <<'EOF';
EOF

my $plain = <<'EOF';
EOF

chomp($plain);

my $result  = $extractor->process_html($source);

my @entities = (
);

ok(defined($result), "We have a result");
is(ref($result), "HASH", "and its a hash");
cmp_bag(@entities, $result->{entities}, "Entities Correct");
is($flair, $result->{flair}, "Flair Correct");

my @plainwords  = split(/\s+/,$plain);
my @gotwords    = split(/\s+/,$result->{text});

foreach my $pw (@plainwords) {
    is ( $pw, shift @gotwords, "$pw Matches in plaintext");
}

print Dumper($result);
done_testing();
exit 0;


