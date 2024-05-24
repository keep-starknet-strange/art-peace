use core::num::traits::Zero;
use starknet::{ContractAddress, contract_address_const};

pub(crate) fn ART_PEACE_CONTRACT() -> ContractAddress {
    contract_address_const::<'ArtPeace'>()
}

pub(crate) fn ERC20_MOCK_CONTRACT() -> ContractAddress {
    contract_address_const::<'erc20mock'>()
}

pub(crate) fn EMPTY_CALLDATA() -> Span<felt252> {
    array![].span()
}

pub(crate) fn EMPTY_QUEST_CONTRACT() -> ContractAddress {
    contract_address_const::<'EmptyQuest'>()
}

pub(crate) fn NFT_CONTRACT() -> ContractAddress {
    contract_address_const::<'CanvasNFT'>()
}

pub(crate) fn HOST() -> ContractAddress {
    contract_address_const::<'Host'>()
}

pub(crate) fn PLAYER1() -> ContractAddress {
    contract_address_const::<'Player1'>()
}

pub(crate) fn PLAYER2() -> ContractAddress {
    contract_address_const::<'Player2'>()
}

pub(crate) fn PLAYER3() -> ContractAddress {
    contract_address_const::<'Player3'>()
}

pub(crate) fn PLAYER4() -> ContractAddress {
    contract_address_const::<'Player4'>()
}

// Math
pub(crate) fn pow_256(self: u256, mut exponent: u8) -> u256 {
    if self.is_zero() {
        return 0;
    }
    let mut result = 1;
    let mut base = self;

    loop {
        if exponent & 1 == 1 {
            result = result * base;
        }

        exponent = exponent / 2;
        if exponent == 0 {
            break result;
        }

        base = base * base;
    }
}
