# Contributing to Vireo

This guide will walk through the different workflows recommended for developing Vireo.
It covers setting up your own fork with continuous integration (CI) server connections as well as commands for developing locally, keeping up to date, and submitting changes.

# Getting started

## Create a fork
Vireo relies on the [fork-pull model](https://help.github.com/articles/about-collaborative-development-models/) for developer contributions.
To begin development on Vireo make a GitHub account and [fork the ni/VireoSDK repository](https://help.github.com/fork-a-repo/).

Your fork will be available online at github.com/YOUR_USER_NAME/VireoSDK

## Connect fork to CI servers
Vireo uses Travis and AppVeyor to build and test the Vireo source code automatically when changes are made.
You are encouraged to push changes to your fork when you have changes and to make branches for experiments.
The fork is your playground for development and experimentation.

By default, when you create a new fork the Travis and AppVeyor services are not enabled until you give them permission to build.
The following describes how to enable the services for your fork:

### Travis CI
1. Go to [Travis-CI](https://travis-ci.org/first_sync) website and login with the github account associated with your Vireo fork
2. (If this is your first time logging in, you can skip this step) On the left side of the page that appears click on the + sign, right next to My repositories
3. On the page that appears, click on the repository switch by your fork to enable it

### AppVeyor CI
1. Go to the [AppVeyor](https://www.appveyor.com/) website and log in with the github account associated with your Vireo fork
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

If you used the git command-line tool to clone the fork you may need to [add the upstream remote](https://help.github.com/articles/fork-a-repo/#step-3-configure-git-to-sync-your-fork-with-the-original-spoon-knife-repository) to your local clone:

```console
git remote add upstream https://github.com/ni/VireoSDK.git
```

# Development workflow
In the fork-pull workflow new development is performed in small short-lived branches in your fork and a pull request is submitted to have those changes pulled in upstream.
Generally, you should not work directly in the master branch of your fork but instead create a branch from master for development.

When changes are pulled into upstream from your branch they can be either merged directly or modified (squashed or rebased).
The ability of pull request merges to modify commits is one reason long-lived branches are undesireable as maintenance is required to avoid diverging from master.

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

To push the new branch and any local changes to your fork the **first-time**:

```console
> git push -u origin awesome_branch
Total 0 (delta 0), reused 0 (delta 0)
To https://github.com/YOUR_USER_NAME/VireoSDK.git
 * [new branch]      awesome_branch -> awesome_branch
Branch 'awesome_branch' set up to track remote branch 'awesome_branch' from 'origin'.
```

To push local changes in subsequent updates:

```console
git push
```

You are encouraged to push changes frequently (at least once a day if not more often) to your fork.
This allows other developers to see your code as well as backs up the code on the GitHub servers.
In addition, pushing code to a fork allows the CI servers to run tests on your code, potentially helping find breaking changes sooner.

Feel free to create branches for new features, fixing issues, experiments, etc. and have them in your fork.
Your fork is your workspace to develop freely and experiment.
Just make sure to use **descriptive and concise** names for your branches so others can identify them.

## Bringing branches up to date
Changes that happen upstream are not automatically pulled into your fork or your local clone.

One concept to be aware of is that git stores a pool of all the changes (git objects) from the remotes that you are connected to.
This pool of objects are not kept up to date automatically.
To fetch all the latest objects from all of your remotes (while also deleting branches that are deleted in remotes) run:

```console
git remote update -p
```

### Bringing master up to date
Based on the recommended workflow the master branch of your local clone should not have any commits that diverge from upstream.
Because there are no commits that diverge from upstream it is possible to fast forward merge your local master.

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
If you have a branch that was previously created from master you may want to bring the latest changes from master into your branch.
If you performed a simple `git pull` you will end up with merge commits in your history.
To avoid the merge commits, the recommended workflow is to instead rebase your local commits in your branch on top of master.

Conceptually, the rebase operation will remove your current commits, bring your branch up to date with master, and then replay your commits one at a time on top of the latest changes.
You will have the chance to resolve merge conflicts that may occur or safely cancel the rebase operation if desired.

To rebase your current branch on the upstream master branch run:
```console
git rebase -p upstream/master
```

**NOTICE**: Be aware that performing the rebase will cause your local clone of a your branch and the fork version of your branch to diverge.
In order to push the local branch to your fork you have to rewrite the history of the branch in your fork:
```console
git push --force-with-lease
```

The `--force-with-lease` option will make sure that your fork's branch does not have any changes that are missing locally.
This can happen if you perform development on a different machine, pushed them to your fork, and have not synced those changes locally.

**DO NOT REWRITE HISTORY IN SHARED BRANCHES**: Your fork is your playground for development and as long as you are the only developer contributing to a branch it is safe to rewrite the history of the branch.
It is encouraged before submission to rebase your changes on top of master and to remove extraneous commits to improve the commit history.
However, if multiple developers are doing development in a branch it requires coordination before rewriting history using rebase.

# Testing local Vireo changes
The [README.md](README.md) describes how to test your Vireo changes locally on your development machine with the tests in VireoSDK.
This section will instead focus on testing your local Vireo changes in other applications that consume Vireo.

## Testing vireo.js in a JavaScript application
The vireo.js build is packaged as an npm package to make it consumeable in JavaScript applications.
There are two primary workflows for testing your local Vireo changes in other npm based applications:

### Testing on your local machine
If you have a JavaScript application on your local machine that relies on vireo as a dependency you can do the following:
- Checkout / make sure the package.json and package-lock.json are editable
- In the directory with the package.json file run:
  ```console
  npm install <PATH_TO_VIREO_SDK_DIRECTORY>
  ```
This will modify your package.json and package-lock.json to resolve the "vireo" dependency to a local path on disk instead of to a version number published in the npm repository.
The VireoSDK directory will be symlinked to the `node_modules` folder of your application.
This allows you to make changes to your local vireo and have them be instantly available to the consuming application.

**WARNING** Since the local VireoSDK is symlinked to the JavaScript application be aware of tooling that could accidently delete or modify your local development files unexpectedly.

### Testing on a different machine / CI
If you want to test your local vireo changes on a separate machine from your local machine (a CI or test machine) without publishing to the npm registry you can do the following:
- In your local VireoSDK directory run: `npm pack`
- This will create a `vireo-<VERSION>.tgz` file
- Move the tgz file to a location that can be bundled with your app. A good location would be next to the package.json and package-lock.json file
- With the package.json and package-lock.json files checked out / editable run:
  ```console
  npm install <PATH_TO_TGZ_FILE>
  ```

This will update the package.json and package-lock.json to point to the tgz file location.
You can now share the application or if running in a CI environment create a changeset, etc, that has the tgz file and updated package.json and package-lock.json to test.
