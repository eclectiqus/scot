Installing SCOT
===============

Minimum System Requirements
^^^^^^^^^^^^^^^^^^^^^^^^^^^

* Ubuntu 14.04 LTS, 16.04 LTS, or CentOS 7.
* 2 Quad Core CPU
* 16 GB RAM
* 1 TB Disk

Note:  Requirements are for production use.  It is quite possible to run SCOT in 
a small VM for testing or demonstration purposes.  Your VM should have access to
at least 4 GB of RAM in this case.

System Preparation
^^^^^^^^^^^^^^^^^^

Ubuntu 14.04
------------

Only limited testing on 14.04 install has been performed.  16.04 is recommended.

Ubuntu 16.04 and CENT 7
-----------------------

# Install the OS.  Make sure that git is installed.

# Now you are ready to pull the SCOT source from GitHub::

    $ git clone https://github.com/sandialabs/scot.git scot

# cd into the SCOT directory::

    $ cd /home/user/scot

# Are you upgrading from SCOT 3.4?  It is recommended to install on a clean system, however, if that is not possible you should do the following

    * Backup you existing SCOT database::
    
        $ mongodump scotng-prod
        $ tar czvf scotng-backup.tgz ./dump

    * delete SCOT init script and crontab entries::

        # rm /etc/init.d/scot3
        # crontab -e 

# go ahead and become root::

    $ sudo -E bash
    
# Make sure that the http_proxy and https_proxy variables are set if needed::
  
    # echo $http_proxy
    # export http_proxy=http://yourproxy.domain.com:80
    # export https_proxy=https://yourproxy.domain.com:88

# You are now ready to begin the install::

   # ./install.sh 2>&1 | tee ../scot.install.log

Go get a cup of cofee.  Initial install will download and install all the dependencies for SCOT.  At the end of the install, you will be asked for a password for the admin account.  Then the install script will output the status of the following processes:

* mongod
* activemq
* scot
* elasticsearch
* scfd
* scepd

If any of the above are not running, you will need to debug why.  Often, the following will help: (using scfd as an example)

    # systemctl start scfd.service
    # systemctl status -l scfd.service

The messages in the stats call will be useful in determining what is causing the problem.

Once the problem has been fixed.  It is safe to re-run the installer script to make sure all the initialization scripts have run correctly.

install.sh Options
^^^^^^^^^^^^^^^^^^

SCOT's installer, install.sh,  is designed to automate many of the tasks need to install and upgrade SCOT.  The installer takes the following flags to modify its installtion behavior::

    Usage: $0 [-A mode] [-M path] [-dersu]

        -A mode     where mode = (default) "Local", "Ldap", or "Remoteuser" 
        -M path     where to locate installer for scot private modules
        -D          delete target install directory before beginning install
        -d          restart scot daemons (scepd and scfd)
        -e          reset the Elasticsearch DB
        -r          delete existing SCOT Database (DATA LOSS POTENTIAL)
        -s          Install SCOT only, skip prerequisites (upgrade SCOT)
        -u          same as -s

The default install with no options will attempt to install all prerequisites or upgrade them if they are already installed.  Once sucessfully installed, this should be rarely needed.  

Using install.sh to upgrade
^^^^^^^^^^^^^^^^^^^^^^^^^^^

Sometimes you just want to refresh the SCOT software to get the latest fix or new feature.  This is when you should use the -s or -u flag.  If the fix or feature is in the flairing engine (scfd) or the elasticsearch push module (scepd) you will want to give the -d flag to restart those daemons.
