<div align="center">
  <img src="resources/art-peace-logo/art-peace.jpg" alt="art_canvas" height="300"/>

  ***Collaborative art canvas on Starknet***

  [![Check Workflow Status](https://github.com/keep-starknet-strange/art-peace/actions/workflows/check.yml/badge.svg)](https://github.com/keep-starknet-strange/art-peace/actions/workflows/check.yml)
  [![Build Workflow Status](https://github.com/keep-starknet-strange/art-peace/actions/workflows/build.yml/badge.svg)](https://github.com/keep-starknet-strange/art-peace/actions/workflows/build.yml)

  [![Exploration_Team](https://img.shields.io/badge/Exploration_Team-29296E.svg?&style=for-the-badge&logo=data:image/svg%2bxml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJhIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODEgMTgxIj48ZGVmcz48c3R5bGU+LmJ7ZmlsbDojZmZmO308L3N0eWxlPjwvZGVmcz48cGF0aCBjbGFzcz0iYiIgZD0iTTE3Ni43Niw4OC4xOGwtMzYtMzcuNDNjLTEuMzMtMS40OC0zLjQxLTIuMDQtNS4zMS0xLjQybC0xMC42MiwyLjk4LTEyLjk1LDMuNjNoLjc4YzUuMTQtNC41Nyw5LjktOS41NSwxNC4yNS0xNC44OSwxLjY4LTEuNjgsMS44MS0yLjcyLDAtNC4yN0w5Mi40NSwuNzZxLTEuOTQtMS4wNC00LjAxLC4xM2MtMTIuMDQsMTIuNDMtMjMuODMsMjQuNzQtMzYsMzcuNjktMS4yLDEuNDUtMS41LDMuNDQtLjc4LDUuMThsNC4yNywxNi41OGMwLDIuNzIsMS40Miw1LjU3LDIuMDcsOC4yOS00LjczLTUuNjEtOS43NC0xMC45Ny0xNS4wMi0xNi4wNi0xLjY4LTEuODEtMi41OS0xLjgxLTQuNCwwTDQuMzksODguMDVjLTEuNjgsMi4zMy0xLjgxLDIuMzMsMCw0LjUzbDM1Ljg3LDM3LjNjMS4zNiwxLjUzLDMuNSwyLjEsNS40NCwxLjQybDExLjQtMy4xMSwxMi45NS0zLjYzdi45MWMtNS4yOSw0LjE3LTEwLjIyLDguNzYtMTQuNzYsMTMuNzNxLTMuNjMsMi45OC0uNzgsNS4zMWwzMy40MSwzNC44NGMyLjIsMi4yLDIuOTgsMi4yLDUuMTgsMGwzNS40OC0zNy4xN2MxLjU5LTEuMzgsMi4xNi0zLjYsMS40Mi01LjU3LTEuNjgtNi4wOS0zLjI0LTEyLjMtNC43OS0xOC4zOS0uNzQtMi4yNy0xLjIyLTQuNjItMS40Mi02Ljk5LDQuMyw1LjkzLDkuMDcsMTEuNTIsMTQuMjUsMTYuNzEsMS42OCwxLjY4LDIuNzIsMS42OCw0LjQsMGwzNC4zMi0zNS43NHExLjU1LTEuODEsMC00LjAxWm0tNzIuMjYsMTUuMTVjLTMuMTEtLjc4LTYuMDktMS41NS05LjE5LTIuNTktMS43OC0uMzQtMy42MSwuMy00Ljc5LDEuNjhsLTEyLjk1LDEzLjg2Yy0uNzYsLjg1LTEuNDUsMS43Ni0yLjA3LDIuNzJoLS42NWMxLjMtNS4zMSwyLjcyLTEwLjYyLDQuMDEtMTUuOGwxLjY4LTYuNzNjLjg0LTIuMTgsLjE1LTQuNjUtMS42OC02LjA5bC0xMi45NS0xNC4xMmMtLjY0LS40NS0xLjE0LTEuMDgtMS40Mi0xLjgxbDE5LjA0LDUuMTgsMi41OSwuNzhjMi4wNCwuNzYsNC4zMywuMTQsNS43LTEuNTVsMTIuOTUtMTQuMzhzLjc4LTEuMDQsMS42OC0xLjE3Yy0xLjgxLDYuNi0yLjk4LDE0LjEyLTUuNDQsMjAuNDYtMS4wOCwyLjk2LS4wOCw2LjI4LDIuNDYsOC4xNiw0LjI3LDQuMTQsOC4yOSw4LjU1LDEyLjk1LDEyLjk1LDAsMCwxLjMsLjkxLDEuNDIsMi4wN2wtMTMuMzQtMy42M1oiLz48L3N2Zz4=)](https://github.com/keep-starknet-strange)

</div>

## Overview

`art/peace` is a collaborative art game where users can place pixels on a large shared canvas and receive rewards for collaborating to build art. The game will run over X days, and end with a final snapshot of the board. The goal is to give users the feeling of collectively building on a highly responsive art canvas, which they can explore, interact with, and compete on.

Some of the features include :

- **Placing Pixels** : This will be the main user interaction, where every X minutes a user will be allowed to place a pixel onto the canvas.
- **Quests** : Tasks to get extra pixels to place on-top of the one every X minutes.
- **Voting** : In addition to the base colors, there will be a vote to add new colors to the palette every day.
- **Templates** : Artwork templates used to help communities collaborate on an art piece. Bounties can be added to a template to incentivize creation.
- **NFTs** : Mint NFTs from the canvas.

## Running

### Docker Run ( Recommended )

```bash
docker compose up
```

To stop the run use `Ctrl-C`.

For a complete reset of the state and rebuild of the containers use :

```bash
# WARNING! This will clear the state (volumes) of all the DBs and the Devnet
docker compose down --volumes
docker compose build
```

### Local Run

```bash
# Must install all the dependencies first
# Use npm install inside the `frontend` directory
# Change the user on `configs/database.config.json` for postgres
make integration-test-local
```

To stop the run use `Ctrl-C`.

### Component Run

Each component can also be run individually, check the [Components](#Components) section below for more details.

## Build

### Docker Build ( Recommended )

```bash
docker compose build
```

### Local Build

```bash
make build
```

### Component Build

Use the `make build-X` command for each corresponding component `X`. See the [Components](#Components) section below for more details.

## Components

- **Onchain:** [Starknet contract(s)](./onchain/) for trustless onchain interactions.
- **Backend:** [Monolithic Go backend](./backend/) for managing requests, interactions, and DBs.
- **Frontend:** [Reactjs application](./frontend/) for users to interact with.
- **Indexer:** [Apibara indexer](./indexer/) for monitoring Starknet events and forwarding to the DBs.
- **Postgres:** DB for storing general data used for analytics, frontend, and backend.
- **Redis:** In memory DB used to store the compressed `Canvas` data for fast retrieval
- **tests:** Integration tests for local, docker, ...

![art/peace diagram](./docs/diagrams/art-peace-diagram.png)

## Dependencies

Its recommended to use `docker compose` when building and running, so the only dependencies would be [docker](https://docs.docker.com/desktop/) and [docker compose](https://docs.docker.com/compose/install/linux/)

However, it might be worth running only certain components for development/testing sometimes. Each component has various dependencies, check [dependencies.txt](./dependencies.txt) for more details.

## References

- [Diagrams](./docs/diagrams/)
- [r/place technical document](https://www.redditinc.com/blog/how-we-built-rplace)
- [Telegram](https://t.me/art_peace_starknet)
- [OnlyDust](https://app.onlydust.com/p/artpeace)

## Contributors ✨

Thanks goes to these wonderful people. Follow the [contributors guide](https://github.com/keep-starknet-strange/art-peace/blob/main/CONTRIBUTING.md) if you'd like to take part.

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/b-j-roberts"><img src="https://avatars.githubusercontent.com/u/54774639?v=4?s=100" width="100px;" alt="Brandon R"/><br /><sub><b>Brandon R</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=b-j-roberts" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://adeyemi.vercel.app/"><img src="https://avatars.githubusercontent.com/u/47580934?v=4?s=100" width="100px;" alt="Adeyemi Gbenga"/><br /><sub><b>Adeyemi Gbenga</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=addegbenga" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://nodeguardians.io/character/98995858fd55"><img src="https://avatars.githubusercontent.com/u/122918260?v=4?s=100" width="100px;" alt="Tristan"/><br /><sub><b>Tristan</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=TAdev0" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ayoazeez26"><img src="https://avatars.githubusercontent.com/u/44169294?v=4?s=100" width="100px;" alt="Abdulhakeem Abdulazeez Ayodeji"/><br /><sub><b>Abdulhakeem Abdulazeez Ayodeji</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=Ayoazeez26" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tekkac"><img src="https://avatars.githubusercontent.com/u/98529704?v=4?s=100" width="100px;" alt="Trunks @ Carbonable"/><br /><sub><b>Trunks @ Carbonable</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=tekkac" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ptisserand"><img src="https://avatars.githubusercontent.com/u/544314?v=4?s=100" width="100px;" alt="ptisserand"/><br /><sub><b>ptisserand</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=ptisserand" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://mubarak23.github.io/"><img src="https://avatars.githubusercontent.com/u/7858376?v=4?s=100" width="100px;" alt="Mubarak Muhammad Aminu"/><br /><sub><b>Mubarak Muhammad Aminu</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=mubarak23" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/thomas192"><img src="https://avatars.githubusercontent.com/u/65908739?v=4?s=100" width="100px;" alt="0xK2"/><br /><sub><b>0xK2</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=thomas192" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://fishonsnote.medium.com/"><img src="https://avatars.githubusercontent.com/u/43862685?v=4?s=100" width="100px;" alt="Fishon Amos"/><br /><sub><b>Fishon Amos</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=fishonamos" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Xaxxoo"><img src="https://avatars.githubusercontent.com/u/51526246?v=4?s=100" width="100px;" alt="Xaxxoo"/><br /><sub><b>Xaxxoo</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=Xaxxoo" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/manoahLinks"><img src="https://avatars.githubusercontent.com/u/100848212?v=4?s=100" width="100px;" alt="Mano.dev"/><br /><sub><b>Mano.dev</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=manoahLinks" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Otaiki1"><img src="https://avatars.githubusercontent.com/u/38711713?v=4?s=100" width="100px;" alt="Abdulsamad sadiq"/><br /><sub><b>Abdulsamad sadiq</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=Otaiki1" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/raizo07"><img src="https://avatars.githubusercontent.com/u/81079370?v=4?s=100" width="100px;" alt="Agada Gabriel"/><br /><sub><b>Agada Gabriel</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=raizo07" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/abdulqaharu"><img src="https://avatars.githubusercontent.com/u/21007582?v=4?s=100" width="100px;" alt="Abdulqahar Usman"/><br /><sub><b>Abdulqahar Usman</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=abdulqaharu" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aweolumidedavid"><img src="https://avatars.githubusercontent.com/u/49573727?v=4?s=100" width="100px;" alt="Awe Olumide David"/><br /><sub><b>Awe Olumide David</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=aweolumidedavid" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kateberryd"><img src="https://avatars.githubusercontent.com/u/35270183?v=4?s=100" width="100px;" alt="Catherine Jonathan"/><br /><sub><b>Catherine Jonathan</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=kateberryd" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/EjembiEmmanuel"><img src="https://avatars.githubusercontent.com/u/83036156?v=4?s=100" width="100px;" alt="Emmaunuel Ejembi"/><br /><sub><b>Emmaunuel Ejembi</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=EjembiEmmanuel" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/CollinsC1O"><img src="https://avatars.githubusercontent.com/u/101604886?v=4?s=100" width="100px;" alt="CollinsC1O"/><br /><sub><b>CollinsC1O</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=CollinsC1O" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://codefred.me/"><img src="https://avatars.githubusercontent.com/u/118021171?v=4?s=100" width="100px;" alt="Alfred Emmanuel"/><br /><sub><b>Alfred Emmanuel</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=Pycomet" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/princeibs"><img src="https://avatars.githubusercontent.com/u/64266194?v=4?s=100" width="100px;" alt="princeibs"/><br /><sub><b>princeibs</b></sub></a><br /><a href="https://github.com/keep-starknet-strange/art-peace/commits?author=princeibs" title="Code">💻</a></td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <td align="center" size="13px" colspan="7">
        <img src="https://raw.githubusercontent.com/all-contributors/all-contributors-cli/1b8533af435da9854653492b1327a23a4dbd0a10/assets/logo-small.svg">
          <a href="https://all-contributors.js.org/docs/en/bot/usage">Add your contributions</a>
        </img>
      </td>
    </tr>
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
