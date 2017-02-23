#!/usr/bin/env perl
use lib '../../lib';

use Test::More;
use Test::Deep;
use Data::Dumper;
use Scot::Util::EntityExtractor;
use Scot::Util::Config;
use Scot::Util::LoggerFactory;
my $logfactory = Scot::Util::LoggerFactory->new({
    config_file => 'logger_test.cfg',
    paths       => [ '../../../Scot-Internal-Modules/etc' ],
});
my $log = $logfactory->get_logger;
my $extractor   = Scot::Util::EntityExtractor->new({log => $log});

my $source      = <<'EOF';
https://cbase.som.sunysb.edu/soap/bss.cfm
https://freeinternetpress.com/cache/player.php (not sure if the ":" is a typo there
https://hades.inf.ufg.br/captcha/
https://hosting.umons.ac.be/php/dpphys/sites/index.php
https://myscheduleronline.us/cstone/reports/ajax.cfm
https://workinstitute.com/modules/index.php
https://www.afu.rwth-aachen.de/cacti/plugins/monitor/online.php
https://www.trade-courses-online.com/widgets/online.php
EOF

my $flair   = <<'EOF';
EOF

chomp($flair);

my $plain = <<'EOF';
EOF

chomp($plain);

my $result  = $extractor->process_html($source);

print Dumper($result);
done_testing();
exit 0;

my @entities = (
);

ok(defined($result), "We have a result");
is(ref($result), "HASH", "and its a hash");
cmp_bag(\@entities, $result->{entities}, "entities correct");
is($result->{flair}, $flair, "Flair correct");


