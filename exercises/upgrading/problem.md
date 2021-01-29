# Upgrading Boltzmann

Eventually you'll want to upgrade to a newer version of the Boltzmann
scaffolding, or to turn a particular Boltzmann feature on or off.

This lesson created a scaffold project in "upgrading/" in your current working
directory. You should `cd upgrading/` now.

Let's turn the status endpoint _off_, while turning JWT functionality
_on_. To do so, you can run **either** of the following commands:

```
$ npm run boltzmann:upgrade -- . --jwt --status=off
$ npx boltzmann-cli . --jwt --status=off
```

(We're using `--jwt` and `--status` as examples here. You can see a full
list of features in the CLI reference doc [1].)

Once you've run the command, use `boltzshopper run .` to check your work!
If it looks like it passed, run `boltzshopper verify .`

[1]: https://www.boltzmann.dev/en/docs/latest/reference/cli/#feature-flipping
