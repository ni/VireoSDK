# Contributing to Vireo

## Getting Started
To begin development on Vireo, make sure to start by [forking the repository](https://help.github.com/fork-a-repo/).

## Setting up Vireo CI builds in a fork
When you create a Vireo fork, Travis and AppVeyor CIs are not enabled in your fork by default. They are helpful because they validate your work and ensure there are not breaking changes when you do a pull request to Vireo master.

Here are the steps to enable the CIs on your fork:

### Travis-CI
1. Go to [Travis-CI](https://travis-ci.org/first_sync) website and login with the github account associated with your Vireo fork
2. (If this is your first time logging in, you can skip this step) On the left side of the page that appears click on the + sign, right next to My repositories
3. On the page that appears, click on the repository switch to enable it

### AppVeyor-CI
1. Go to the [AppVeyor](https://www.appveyor.com/) website and login with the github account associated with your Vireo fork
2. At the top of the page, click on "add a new project".
3. On the page that appears, select your repository.

## Adding a Feature or Fixing a Bug

1. Make your changes
* Run the tests (see the README for more information about testing)
* Add any additional tests if needed to test your fix or feature
* Submit a pull request to the proper branch (see below)
* The [TravisCI Build](https://travis-ci.org/ni/VireoSDK/pull_requests) will pull your changes and validate that all of the tests pass before allowing the pull request to be merged.
* If the CI build passes, your pull request can now be merged. If not, the request will not be merged until the CI passes.

## Updating your current branch/fork with upstream/master
If your branch is behind the master branch (and you have no local changes that conflict), you can merge the upstream changes into your branch:

```shell
git pull upstream master
```

