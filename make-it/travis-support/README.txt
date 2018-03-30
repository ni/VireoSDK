Needed because Travis container builds will not allow installation of the package.
The package is being checked in because the debian repos are served over HTTP.
Alternatively we could fetch the package during build and verify the integrity on the CI.
When Travis upgrades to Ubuntu Xenial this package will no longer be needed.
