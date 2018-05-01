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
With the above completed you have now taken the ni/VireoSDK repository (the **upstream** repository) and made a fork on GitHub as YOUR_USER_NAME/VireoSDK (the **origin** repository).

In order to do development in your fork you need to make a [clone of the fork](https://help.github.com/articles/fork-a-repo/#step-2-create-a-local-clone-of-your-fork) on your development machine.

An example would be to navigate to a folder on disk and run:

```console
git clone https://github.com/YOUR_USER_NAME/VireoSDK.git
```

This will create a folder named VireoSDK with the associated Vireo source code.

## Verifying the clone
Once the source has been cloned into the VireoSDK folder you can navigate into the folder and run:

```console
> git remote -v
origin  https://github.com/YOUR_USER_NAME/VireoSDK.git (fetch)
origin  https://github.com/YOUR_USER_NAME/VireoSDK.git (push)
upstream https://github.com/ni/VireoSDK.git (fetch)
upstream https://github.com/ni/VireoSDK.git (push)
```

If you used GitHub Desktop to clone the fork you should see both the remotes listed above.

If you used the git commandline tool to clone the fork you may need to [add the upstream remote](https://help.github.com/articles/fork-a-repo/#step-3-configure-git-to-sync-your-fork-with-the-original-spoon-knife-repository) to your local clone:

```console
git remote add upstream https://github.com/ni/VireoSDK.git
```

# Development workflow
In the fork-pull workflow new development is performed in small short-lived branches in your fork and a pull request is submitted to have those changes pulled in upstream. Generally you should not work directly in master of your fork but instead create a branch from master for development.

When changes are pulled in to upstream from your branch they can be either merged directly or modified (squashed or rebased). The ability for pull request merges to modify commits is one reason for long-lived branches to be undesireable as maintenance is required to avoid diverging from master.

## Creating a branch
To create a branch first check the branch you are currently on by running:

```console
> git status
On branch master
Your branch is up to date with 'origin/master'.

nothing to commit, working tree clean
```

It is recommended that new work be performed by branching from master. To change branches to the master branch run:

```console
> git checkout master
Switched to branch 'master'
Your branch is up to date with 'origin/master'.
```

Then make a branch from the current branch named `awesome_branch`:

```console
> git checkout -b awesome_branch
Switched to a new branch 'awesome_branch'
```

And push the branch to your fork (**first-time**):

```console
> git push -u origin awesome_branch
Total 0 (delta 0), reused 0 (delta 0)
To https://github.com/YOUR_USER_NAME/VireoSDK.git
 * [new branch]      awesome_branch -> awesome_branch
Branch 'awesome_branch' set up to track remote branch 'awesome_branch' from 'origin'.
```

You are encouraged to push changes frequently (at least once a day if not more often) to your fork. This allows other developers to see your code as well as backs up the code on the GitHub servers. In addition, pushing code to a fork allows the CI servers to run tests on your code potentially helping find breaking changes sooner.

Feel free to create branches for new features, fixing issues, experiments, etc and have them in your fork. Your fork is your workspace to develop freely and experiment. Just make sure to use **descriptive and concise** names for your branches so others can identify them.

## Bringing branches up to date
Changes that happen upstream are not automatically pulled into your fork or your local clone.

One concept to be aware of is that git stores a pool of all the changes (git objects) from the remotes that you are connected to. This pool of objects are not kept up to date automatically. To fetch all the latest objects from all of your remotes (while also deleting branches that are deleted in remotes) run:

```console
git remote update -p
```

### Bringing master up to date
Based on the recommended workflow the master branch of your local clone should not have any commits that diverge from upstream. Because there are not commits that diverge from upstream it is possible to fast forward merge your local master.

To do this first verify you are on master with `git status` or change to master with `git checkout master`.

Then bring your local master up to date by running:

```console
git merge --ff-only upstream/master
```

If you get an error that means you have unexpected commits on your master branch that should be removed.

If everything succeeds then you can go ahead and push your updated local master to your fork:

```console
git push
```

### Rebasing your branch on top of latest changes
If you have a branch that was previously created from master you may want to bring the latest changes from master into your branch. If you performed a simple `git pull` you will end up with merge commits in your history. To avoid the merge commits, the recommended workflow is to instead rebase your local commits in your branch on top of master.

Conceptually, the rebase operation will remove your current commits, bring your branch up to date with master, and then replay your commits one at a time on top of the latest changes. You will have the chance to resolve merge conflicts that may occur or safely cancel the rebase operation if desired.

To rebase your current branch on the upstream master branch run:
```console
git rebase -p upstream/master
```

**NOTICE**: Be aware that performing the rebase will cause your local clone of a your branch and the fork version of your branch to diverge. In order to push the branch to your clone you have to rewrite the history of the branch in your clone:
```console
git push --force-with-lease
```

The `--force-with-lease` option will make sure that your clone's branch does not have any changes that are missing locally. This can happen if for instance you perform development on a different machine, pushed them to your clone, and have not synced those changes locally.

**DO NOT REWRITE HISTORY IN SHARED BRANCHES**: Your fork is your playground for development and as long as you are the only developer contributing to a branch it is safe to rewrite the history of the branch. It is encouraged before submission to rebase your changes on top of master and to remove extraneous commits to improve the commit history. However, if multiple developers are doing development in a branch it requires coordination before rewriting history using rebase.

## Adding a Feature or Fixing a Bug
1. Make your changes
* Run the tests (see the README for more information about testing)
* Add any additional tests if needed to test your fix or feature
* Submit a pull request to the proper branch (see below)
* The [TravisCI Build](https://travis-ci.org/ni/VireoSDK/pull_requests) will pull your changes and validate that all of the tests pass before allowing the pull request to be merged.
* If the CI build passes, your pull request can now be merged. If not, the request will not be merged until the CI passes.
