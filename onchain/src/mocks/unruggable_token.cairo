//
// https://github.com/OpenZeppelin/cairo-contracts/blob/main/src/tests/mocks/erc20_mocks.cairo
//

#[starknet::contract]
pub(crate) mod UnruggableMock {
    use art_peace::quests::interfaces::IUnruggableMemecoin;
    use openzeppelin::token::erc20::ERC20Component;
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    impl InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        is_launched: bool,
        owner: ContractAddress,
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, name: ByteArray, symbol: ByteArray, owner: ContractAddress
    ) {
        self.erc20.initializer(name, symbol);
        self.owner.write(owner);
        self.is_launched.write(true);
    }

    #[abi(embed_v0)]
    impl UnruggableImpl of IUnruggableMemecoin<ContractState> {
        fn owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }
        fn is_launched(self: @ContractState) -> bool {
            self.is_launched.read()
        }
    }
}
