package Scot::Parser::Sourcefire;

use lib '../../../lib';
use Moose;

extends 'Scot::Parser';

sub will_parse {
    my $self    = shift;
    my $href    = shift;
    my $from    = $href->{from};
    my $subject = $href->{subject};

    if ( $subject =~ /auto generated email/i ) {
        return 1;
    }
    return undef;
}

sub parse_message {
    my $self    = shift;
    my $href    = shift;
    my $log     = $self->log;
    my %json    = (
        subject     => $href->{subject},
        message_id  => $href->{message_id},
        body_plain  => $href->{body_plain},
        body        => $href->{body_html},
        data        => [],
        source      => [ qw(email sourcefire) ],
    );

    $log->trace("Parsing Sourcefire email");

    my $regex   = qr{ \[(?<sid>.*?)\] "(?<rule>.*?)" \[Impact: (?<impact>.*?)\] +From "(?<from>.*?)" at (?<when>.*?) +\[Classification: (?<class>.*?)\] \[Priority: (?<pri>.*?)\] {(?<proto>.*)} (?<rest>.*) *};

    my $body    = $href->{body_html} // $href->{body_plain};
       $body    =~ s/[\n\r]/ /g;
       $body    =~ m/$regex/g;

    my $rest    = $+{rest};
    my ($fullsrc, $fulldst) = split(/->/, $rest);
    my ($srcip, $srcport)   = split(/:/, $fullsrc);
    my ($dstip, $dstport)   = Split(/:/, $fulldst);


    $json{data}     = {
        sid         => $+{sid},
        rule        => $+{rule},
        impact      => $+{impact},
        from        => $+{from},
        when        => $+{when},
        class       => $+{class},
        priority    => $+{pri},
        proto       => $+{proto},
        srcip       => $srcip,
        srcport     => $srcport,
        dstip       => $dstip,
        dstport     => $dstport,
    };
    $json{columns}  = keys %{$json{data}};
    return wantarray ? %json : \%json;
}

sub get_sourcename {
    return "sourcefire";
}
1;
