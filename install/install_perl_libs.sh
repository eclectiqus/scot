#!/bin/bash

DISTRO=`../etcsrc/install/determine_os.sh | cut -d ' ' -f 1`;

echo "============== PERL Module Installer ============== "
echo "+ updating apt repositories"
apt-get update 2>&1 > /dev/null
apt-get install --reinstall ca-certificates

if [ $? != 0 ]; then
    echo "! unable to update apt !"
    exit 1
fi

APT='
    make
    gcc
    curl
    perl
    perl-doc
    perl-base
    perl-modules
    perlmagick
    perltidy
    libcurses-perl
    libmagic-dev
    libxml-perl
    libyaml-perl
    libwww-mechanize-perl
    libjson-perl
    librose-db-perl
    libtree-simple-perl
    libtask-weaken-perl
    libtree-simple-visitorfactory-perl
    libalgorithm-c3-perl
    libapparmor-perl
    libarchive-zip-perl
    libauthen-krb5-simple-perl
    libauthen-sasl-perl
    libb-hooks-endofscope-perl
    libb-keywords-perl
    libbit-vector-perl
    libcache-perl
    libcairo-perl
    libcarp-assert-more-perl
    libcarp-assert-perl
    libcarp-clan-perl
    libcgi-simple-perl
    libclass-accessor-perl
    libclass-c3-adopt-next-perl
    libclass-c3-perl
    libclass-c3-xs-perl
    libclass-data-inheritable-perl
    libclass-errorhandler-perl
    libclass-factory-util-perl
    libclass-inspector-perl
    libclass-singleton-perl
    libclone-perl
    libclone-pp-perl
    libcompress-bzip2-perl
    libconfig-tiny-perl
    libdata-dump-perl
    libdata-optlist-perl
    libdate-manip-perl
    libdatetime-format-builder-perl
    libdatetime-format-mysql-perl
    libdatetime-format-pg-perl
    libdatetime-format-strptime-perl
    libdatetime-locale-perl
    libdatetime-perl
    libdatetime-timezone-perl
    libdbd-mysql-perl
    libdbd-pg-perl
    libdbi-perl
    libdevel-globaldestruction-perl
    libdevel-stacktrace-perl
    libdevel-symdump-perl
    liberror-perl
    libexception-class-perl
    libextutils-autoinstall-perl
    libfcgi-perl
    libfile-copy-recursive-perl
    libfile-homedir-perl
    libfile-modified-perl
    libfile-nfslock-perl
    libfile-remove-perl
    libfile-searchpath-perl
    libfile-slurp-perl
    libfile-spec-perl
    libfile-which-perl
    libfont-afm-perl
    libfreezethaw-perl
    libglib-perl
    libgnome2-canvas-perl
    libgnome2-perl
    libgnome2-vfs-perl
    libgtk2-perl
    libheap-perl
    libhtml-clean-perl
    libhtml-format-perl
    libhtml-parser-perl
    libhtml-tagset-perl
    libhtml-template-perl
    libhtml-tree-perl
    libhttp-body-perl
    libhttp-request-ascgi-perl
    libhttp-response-encoding-perl
    libhttp-server-simple-perl
    libio-socket-ssl-perl
    libio-string-perl
    libio-stringy-perl
    libjson-perl
    libjson-xs-perl
    liblingua-stem-snowball-perl
    liblist-moreutils-perl
    liblocale-gettext-perl
    liblwp-authen-wsse-perl
    libmailtools-perl
    libmime-types-perl
    libmldbm-perl
    libmodule-corelist-perl
    libmodule-install-perl
    libmodule-scandeps-perl
    libmro-compat-perl
    libnamespace-autoclean-perl
    libnamespace-clean-perl
    libnet-daemon-perl
    libnet-dbus-perl
    libnet-jabber-perl
    libnet-libidn-perl
    libnet-ssleay-perl
    libnet-xmpp-perl
    libpango-perl
    libpar-dist-perl
    libparams-util-perl
    libparams-validate-perl
    libparse-cpan-meta-perl
    libparse-debianchangelog-perl
    libpath-class-perl
    libperl-critic-perl
    libplrpc-perl
    libpod-coverage-perl
    libpod-spell-perl
    libppi-perl
    libreadonly-perl
    libreadonly-xs-perl
    librose-datetime-perl
    librose-db-object-perl
    librose-db-perl
    librose-object-perl
    librpc-xml-perl
    libscope-guard-perl
    libscope-upper-perl
    libsphinx-search-perl
    libsql-reservedwords-perl
    libstring-format-perl
    libstring-rewriteprefix-perl
    libsub-exporter-perl
    libsub-install-perl
    libsub-name-perl
    libsub-uplevel-perl
    libtask-weaken-perl
    libterm-readkey-perl
    libtest-exception-perl
    libtest-longstring-perl
    libtest-mockobject-perl
    libtest-perl-critic-perl
    libtest-pod-coverage-perl
    libtest-pod-perl
    libtest-www-mechanize-perl
    libtext-charwidth-perl
    libtext-iconv-perl
    libtext-simpletable-perl
    libtext-wrapi18n-perl
    libtie-ixhash-perl
    libtime-clock-perl
    libtimedate-perl
    libtree-simple-perl
    libtree-simple-visitorfactory-perl
    libuniversal-can-perl
    libuniversal-isa-perl
    liburi-fetch-perl
    liburi-perl
    libuuid-perl
    libvariable-magic-perl
    libwww-mechanize-perl
    libwww-perl
    libxml-atom-perl
    libxml-dom-perl
    libxml-libxml-perl
    libxml-libxslt-perl
    libxml-namespacesupport-perl
    libxml-parser-perl
    libxml-perl
    libxml-regexp-perl
    libxml-sax-expat-perl
    libxml-sax-perl
    libxml-stream-perl
    libxml-twig-perl
    libxml-xpath-perl
    libxml-xslt-perl
    libyaml-perl
    libyaml-syck-perl
    libyaml-tiny-perl
    libfile-libmagic-perl
    liblog-log4perl-perl
    libplack-perl
    libcurses-perl
    libfile-libmagic-perl
    libnet-xmpp-perl
'
echo "########## Installing Perl Debian packages #############"
for i in $APT
do
    echo "+++++++++++++++ installing $i +++++++++++++++++++"
    apt-get install $i -y
    echo ""
done


if [ $DISTRO != "RedHat" ]; then
    echo "- removing old ubuntu version of cpanm"
    apt-get remove cpanminus -y
else 
    yum -y remove perl-App-cpanminus
fi

echo "+ getting latest cpanminus"
curl -L http://cpanmin.us | perl - --sudo App::cpanminus

WCPP=`which cpanm`

if [ "$WCPP" == "/usr/bin/cpanm" ]; 
then
    echo "! WRONG CPAN !";
    exit 1
fi

export PERL_LWP_SSL_VERIFY_HOSTNAME=0
CPANOPTS="--verbose"
# CPANOPTS="--verbose --no-check-certificate --mirror-only"
# CPANMIRROR="--mirror https://stratopan.com/toddbruner/Scot-deps/master"
CPANMIRROR=""
CPAN="/usr/local/bin/cpanm $CPANOPTS $CPANMIRROR"

echo "= using $CPAN"

LIBS='
    Moose
    Moose::Role
    Moose::Util::TypeConstraints
    MooseX::MetaDescription::Meta::Attribute
    MooseX::Singleton
    MooseX::Emulate::Class::Access
    MooseX::Types
    MooseX::Types::Common
    MooseX::MethodAttributes
    Server::Starter
    PSGI
    Plack
    CGI::PSGI
    CGI::Emulate::PSGI
    CGI::Compile
    HTTP::Server::Simple::PSGI
    JSON
    Number::Bytes::Human
    Sys::RunAlone
    Parallel::ForkManager
    DBI
    Encode
    FileHandle
    File::Slurp
    File::Temp
    File::Type
    GeoIP2
    HTML::Entities
    HTML::Scrubber
    HTML::Strip
    HTML::StripTags
    JSON
    Log::Log4perl
    Mail::IMAPClient
    Mail::IMAPClient::BodyStructure
    MongoDB@1.2.3
    MongoDB::GridFS@1.2.3
    MongoDB::GridFS::File@1.2.3
    MongoDB::OID@1.2.3
    Meerkat
    Net::Jabber::Bot
    Net::LDAP
    Net::SMTP::TLS
    Readonly
    Time::HiRes
    Mojo
    MojoX::Log::Log4perl
    DateTime::Format::Natural
    Net::STOMP::Client
    IPC::Run
    XML::Smart
    Config::Auto
    Data::GUID
    Redis
    File::LibMagic
    List::Uniq
    Domain::PublicSuffix
    Crypt::PBKDF2
    Config::Crontab
    HTML::TreeBuilder
    HTML::FromText
    DateTime::Cron::Simple
    DateTime::Format::Strptime
    HTML::FromText
    IO::Prompt
    Proc::PID::File
    Test::Mojo
    Log::Log4perl
    File::Slurp
    AnyEvent
    AnyEvent::STOMP::Client
    AnyEvent::ForkManager;
    Mozilla::PublicSuffix
    Net::IDN::Encode
    MIME::Base64
    Net::Stomp
    Proc::InvokeEditor
    Test::JSON
    Math::Int128
    Net::Works::Network
    MaxMind::DB::Reader::XS
    Data::Dumper
    Data::Dumper::HTML
    Data::Dumper::Concise
    Safe
    Search::Elasticsearch
    Data::Clean::FromJSON
    Term::ANSIColor
    Courriel
    Daemon::Control
'

for i in $LIBS
do
    echo "----------- Attempting Install of $i -------------"
    $CPAN $i
    if [ $? == 1 ]; then
        echo "!!! ERROR installing $i !!!";
        echo "+ pushing onto retry list";
        RETRY="$RETRY $i"
    fi
    echo ""
done

for i in $RETRY
do
    echo "===== RETRYING $i =====";
    $CPAN $i
    if [ $? == 1 ]; then
        echo "!!! FAILED RETRY of $i !!!";
        FAILED="$FAILED $i"
    fi
    echo ""
done

echo "~~~~~~~~~~~ Failed Perl Modules ~~~~~~~~~~~~~~";
for i in $FAILED
do
    echo "- $i"
done
