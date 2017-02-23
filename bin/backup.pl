#!/usr/bin/env perl

use strict;
use warnings;
use v5.18;
use lib '../lib';
#use lib '/opt/scot/lib';

use Scot::Env;
use DateTime;
use Mojo::JSON qw(decode_json);

my $config_file = $ENV{'scot_backup_config_file'} // '/opt/scot/etc/backup.cfg.pl';

my $env  = Scot::Env->new({
    config_file => $config_file,
});

# $env has
#   
#   pidfile  = the pid file for runnign dump
#   location = directory to dump the mongodump
#   tarloc  = directory to place tar file
#   cleanup  = true if you wish to remove the dumped directory
#   user     = if needed, set to user name for db access
#   pass     = if needed, set to the password
#   dbname   = dbname, defaults to scot-prod
#   es_server = the url to the elastic server e.g. http://localhost:9200
#   es_backup_location = the directory to create the repo snapshots
#

my $pidfile = $env->pidfile;
if ( -s $pidfile ) {
    die "$pidfile exists and is non-zero length, implies another backup is running";
}

open my $pidfh, ">", $pidfile or die "Unable to create PID file $pidfile!";
print $pidfh "$$";
close $pidfh;

my $dumpdir = $env->location;
unless ($dumpdir) {
    warn "$dumpdir is missing! Setting to /tmp/dump";
    $dumpdir = "/tmp/dump";
}

unless (-d $dumpdir ) {
    system("mkdir -p $dumpdir");
}


system("rm -rf $dumpdir/mongo");

my $cmd = "/usr/bin/mongodump ";

if ( defined $env->auth->{user} ) {
    if ( $env->auth->{user} and $env->auth->{pass} ) {
        $cmd .= "-u $env->user -p $env->pass ";
    }
}

if ( $env->dbname ) {
    $cmd .= "--db ". $env->dbname." ";
}
else {
    $cmd .= "--db scot-prod ";
}

# $cmd .= "--oplog -o $dumpdir";
$cmd .= "-o $dumpdir";

print "Executing: $cmd\n";

system($cmd);

#system("rm -f $pidfile");
#exit 0;

my $tarloc = "/tmp";
if ( $env->tarloc ) {
    unless ( -d $env->tarloc ) {
        system ("mkdir -p $tarloc" );
    }
    $tarloc = $env->tarloc;
}

# now backup elasticsearch

print "Backing up ElasticSearch...\n";

my $curl    = "curl -s";

my $repo_cmd        = $env->es_server . "/_snapshot/scot_backup";
my $repo_status     = `curl -XGET $repo_cmd`;
my $repo_loc        = "location\": ".$env->es_backup_location;

if ( $repo_status !~ /$repo_loc/ ) {
    print "\nElasticSearch Repo back up is not storing snapshots in ".
          "expected location\nFixing...\n";
    my $stat    = `$curl -XDELETE $repo_cmd`;
}

$repo_status = `curl -XGET $repo_cmd`;

if ( $repo_status =~ /repository_missing_exception/ ) {
    print "Missing Repo, creating scot_backup repo...\n";

    my $create_repo_template = <<'EOF';
%s/_snapshot/scot_backup -d '{
    "type": "fs",
    "settings": {
        "compress": "true",
        "location": "%s"
    }
}'
EOF

    my $create_repo_string = sprintf($create_repo_template, 
                                    $env->es_server,
                                    $env->es_backup_location);

    print "Creating Repo with: $create_repo_string\n";
    my $repocreatestat = `$curl -XPUT $create_repo_string`;
}

my $escmd   = $env->es_server."/_snapshot/scot_backup/snapshot_1";

print "Deleting existing snapshot...\n";
my $del_stat = `$curl -XDELETE $escmd`;

print "Request new snapshot...\n";
my $snap_stat   = `$curl -XPUT $escmd`;

unless ( $snap_stat =~ /accepted\":true/ ) {
    warn "Failed to create a snapshot! $snap_stat";
}
else {
    print "Waiting for Snapshot to complete...\n";
    my $this_stat = `$curl -XGET $escmd`;
    my $count     = 0;
    while ( $this_stat !~ /SUCCESS/ and $count < 100 ) {
        print ".";
        sleep 5;
        $this_stat = `$curl -XGET $escmd`;
        $count++;
    }
}

my $esdir   = $env->es_backup_location;
my $cacheimgdir = $env->cacheimg;
my $dt  = DateTime->now();
# my $ts  = $dt->year . $dt->month . $dt->day . $dt->hour . $dt->minute;
my $ts  = $dt->strftime("%Y%m%d%H%M");

# back up cached images
system("cp -r /opt/scot/public/cached_images $cacheimgdir");

print "TARing up backups to $tarloc.$ts.tgz\n";
system("tar cvzf $tarloc.$ts.tgz $dumpdir $esdir $cachimgdir");

if ( $env->cleanup ) {
    system("rm -rf $dumpdir/*");
    my $status = `curl -XDELETE $escmd`;
    unless ( $status =~ /acknowledged\":true/ ) {
        die "Failed to delete repo snapshot for ES backup: $status\n";
    }
    system("rm -rf $esdir/*");
}
system("find $env->location -ctime 7 -print0 | xargs -0 /bin/rm -f");
system("rm -f $pidfile");

END{
    system("rm -f $pidfile");
}
