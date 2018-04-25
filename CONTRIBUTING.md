# Contributing to Vireo

This guide will walkthrough the different workflows recommended for developing Vireo.
It covers setting up your own fork with continuous integration (CI) server connections as well as commands for developing locally, keeping up to date, and submitting changes.

# Getting Started

## Create a fork
Vireo relies on the [fork-pull model](https://help.github.com/articles/about-collaborative-development-models/) for developer contributions.
To begin development on Vireo make a GitHub account and [fork the ni/VireoSDK repository](https://help.github.com/fork-a-repo/).

Your fork will be available online at github.com/YOUR_USER_NAME/VireoSDK

## Connect fork to CI servers
Vireo uses Travis and AppVeyor to build and test the Vireo source code automatically when changes are made. You are encouraged to push changes to your fork when you have changes and to make branches for experiments. The fork is your playground for development and experimentation.

By default when you create a new fork the Travis and AppVeyor services are not enabled until you give them permission to build. The following describes how to enable the services for your fork:

### Travis CI
1. Go to [Travis-CI](https://travis-ci.org/first_sync) website and login with the github account associated with your Vireo fork
2. (If this is your first time logging in, you can skip this step) On the left side of the page that appears click on the + sign, right next to My repositories
3. On the page that appears, click on the repository switch by your fork to enable it

### AppVeyor CI
1. Go to the [AppVeyor](https://www.appveyor.com/) website and login with the github account associated with your Vireo fork
2. At the top of the page, click on "add a new project".
3. On the page that appears, select your fork.

## Clone fork
With the above completed you have now taken the ni/VireoSDK repository (the upstream repository) and made a fork on GitHub as YOUR_USER_NAME/VireoSDK (the origin repository).

In order to do development in your fork you need to make a [clone of the fork](https://help.github.com/articles/fork-a-repo/#step-2-create-a-local-clone-of-your-fork) on your development machine.

# Development workflow
In the fork-pull workflow new development is performed in small short-lived branches in your fork and a pull request is submitted to have those changes pulled in upstream.

When changes are pulled in they can be either merged directly or modified (squashed or rebased) when they are pulled into the mainline. This makes long-lived branches undesireable as there is maintenance required to keep them in sync with master.

### Verifying your cloned fork configuration

## Adding a Feature or Fixing a Bug
1. Make your changes
* Run the tests (see the README for more information about testing)
* Add any additional tests if needed to test your fix or feature
* Submit a pull request to the proper branch (see below)
* The [TravisCI Build](https://travis-ci.org/ni/VireoSDK/pull_requests) will pull your changes and validate that all of the tests pass before allowing the pull request to be merged.
* If the CI build passes, your pull request can now be merged. If not, the request will not be merged until the CI passes.
