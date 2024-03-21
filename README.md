# art/peace

Collaborative art canvas on Starknet

----

## Overview

`art/peace` is a collaborative art game where users can place pixels on a large canvas and receive rewards for collaborating. The app will run over X days, and end with a final snapshot of the board. The goal is to give users the feeling of collectively building on a highly responsive art canvas, which they can explore, interact with, and compete on.

Some of the features include :

- **Placing Pixels** : This will be the main interaction type, where every X minutes a user will be allowed to place a pixel onto the canvas. ( on-chain interaction )
- **Color Voting** : In addition to the base colors, there will be a vote to add new colors to the palette every day. ( on-chain interaction )
- **Quests** : Tasks to get extra pixels to place on-top of the one every X minutes. ( on-chain interaction )
- **Templates** : Overlayable artworks to help communities collaborate on an art piece. Bounties can be added to a template to incentivize creation. ( off-chain interaction until settling )

## References

- [r/place technical document](https://www.redditinc.com/blog/how-we-built-rplace)

## Build

To build the project, run:

```bash
scarb build
```

## Test

To test the project, run ( uses `snforge` ):

```bash
scarb test
```
