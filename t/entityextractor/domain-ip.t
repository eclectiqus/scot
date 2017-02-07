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
my $extractor   = Scot::Util::EntityExtractor->new({log=>$log});

my @ipaddrs = ( 
    { 
        source  => 'foo.10.com', 
        flair   => '<div><span class="entity domain" data-entity-type="domain" data-entity-value="foo.10.com">foo.10.com</span> </div>',
        plain   => 'foo.10.com',
        entity  => [ { type  => 'domain', value => 'foo.10.com' } ],
    },
);

foreach my $href (@ipaddrs) {

    my $result  = $extractor->process_html($href->{source});
    is($result->{text}, $href->{plain}, "For $href->{source}, plain text is correct");
    is($result->{flair}, $href->{flair}, "For $href->{source}, flair html is corrent");
    cmp_bag($result->{entities}, $href->{entity}, "For $href->{source}, entities are correct");

}

done_testing();
exit 0;
    

    
