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

my @domains = ( 
    { 
        source  => 'www.google.com', 
        flair   => '<div><span class="entity domain" data-entity-type="domain" data-entity-value="www.google.com">www.google.com</span> </div>',
        plain   => 'www.google.com',
        entity  => [ { type  => 'domain', value => 'www.google.com' } ],
    },
    {
        source  => 'www(.)google(.)com', 
        flair   => '<div><span class="entity domain" data-entity-type="domain" data-entity-value="www.google.com">www.google.com</span> </div>',
        plain   => 'www.google.com',
        entity  => [ { type  => 'domain', value => 'www.google.com' } ],
    },
    {
        source  => 'www[.]google[.]com', 
        flair   => '<div><span class="entity domain" data-entity-type="domain" data-entity-value="www.google.com">www.google.com</span> </div>',
        plain   => 'www.google.com',
        entity  => [ { type  => 'domain', value => 'www.google.com' } ],
    },
    {
        source  => 'www{.}google{.}com', 
        flair   => '<div><span class="entity domain" data-entity-type="domain" data-entity-value="www.google.com">www.google.com</span> </div>',
        plain   => 'www.google.com',
        entity  => [ { type  => 'domain', value => 'www.google.com' } ],
    },
    {
        source  => 'https://cbase.som.sunysb.edu/foo/bar',
        flair   => '<div>https://<span class="entity domain" data-entity-type="domain" data-entity-value="cbase.som.sunysb.edu">cbase.som.sunysb.edu</span>/foo/bar </div>',
        plain   => 'https://cbase.som.sunysb.edu/foo/bar',
        entity  => [ { type => 'domain', value => 'cbase.som.sunysb.edu' } ],
    },
    {
        source  => 'https://cbase(.)som[.]sunysb{.}edu/foo/bar',
        flair   => '<div>https://<span class="entity domain" data-entity-type="domain" data-entity-value="cbase.som.sunysb.edu">cbase.som.sunysb.edu</span>/foo/bar </div>',
        plain   => 'https://cbase.som.sunysb.edu/foo/bar',
        entity  => [ { type => 'domain', value => 'cbase.som.sunysb.edu' } ],
    },
    {
        source  => 'https://support.online',
        flair   => '<div>https://support.online </div>',
        plain   => 'https://support.online',
        entity  => undef,
    },
    {
        source  => '8a.93.8c.99.8d.61.62.86.97.88.86.91.91.8e.4e.97.8a.99',
        flair   => '<div>8a.93.8c.99.8d.61.62.86.97.88.86.91.91.8e.4e.97.8a.99 </div>',
        plain   => '8a.93.8c.99.8d.61.62.86.97.88.86.91.91.8e.4e.97.8a.99',
        entity  => undef,
    },

);

foreach my $href (@domains) {

    my $result  = $extractor->process_html($href->{source});
    is($result->{text}, $href->{plain}, "For $href->{source}, plain text is correct");
    is($result->{flair}, $href->{flair}, "For $href->{source}, flair html is corrent");
    if (defined($result->{entities}) and defined ($href->{entity}) ) {
        cmp_bag($result->{entities}, $href->{entity}, "For $href->{source}, entities are correct");
    }

}

done_testing();
exit 0;
    

    
