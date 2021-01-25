# Upgrading Boltzmann

Eventually you'll want to upgrade to a newer version of the Boltzmann
scaffolding, or to turn a particular Boltzmann feature on or off.

Let's turn the status endpoint _off_, while turning JWT functionality
_on_. To do so, you can run **either** of the following commands:

```
$ npm run boltzmann:upgrade -- . --jwt --status=off
$ npx boltzmann-cli . --jwt --status=off
```

Once you've run the command, use `boltzshopper run .` to check your work!
If it looks like it passed, run `boltzshopper verify .`.
