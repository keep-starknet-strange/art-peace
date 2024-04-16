use starknet::ContractAddress;

#[starknet::interface]
pub trait IUsernameStore<TContractState> {
    fn claim_username(ref self: TContractState, key: felt252);
    fn transfer_username(ref self: TContractState, key: felt252, new_Address: ContractAddress);
    fn get_username(ref self: TContractState,  key: felt252) -> ContractAddress;
}

pub mod UserNameClaimErrors {
    pub const USERNAME_CLAIMED: felt252 = 'username_claimed';
    pub const USERNAME_CANNOT_BE_TRANSFER: felt252 = 'username_cannot_be_transferred';
}


#[starknet::contract]
pub mod UsernameStore {
    use starknet::{get_caller_address, ContractAddress, contract_address_const};

    use super::{IUsernameStore, UserNameClaimErrors};

    #[storage]
    struct Storage {
        usernames: LegacyMap::<felt252, ContractAddress>
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        UserNameClaimed: UserNameClaimed,
        UserNameTransferred: UserNameTransferred
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameClaimed {
        #[key]
        username: felt252,
        address: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameTransferred {
        #[key]
        username: felt252,
        address: ContractAddress
    }

    #[abi(embed_v0)]
   pub impl UsernameStore of IUsernameStore<ContractState> {
       fn claim_username(ref self: ContractState, key: felt252) {
            let mut username_address = self.usernames.read(key);

           

        assert(username_address == contract_address_const::<0>(), UserNameClaimErrors::USERNAME_CLAIMED);

            self.usernames.write(key, get_caller_address());

            self
                .emit(
                    Event::UserNameClaimed(
                        UserNameClaimed { username: key, address: get_caller_address() }
                    )
                )
        }

        fn transfer_username(ref self: ContractState, key: felt252, new_Address: ContractAddress) {
            let username_address = self.usernames.read(key);

            if username_address != get_caller_address() {
                core::panic_with_felt252(UserNameClaimErrors::USERNAME_CANNOT_BE_TRANSFER);
            }

            self.usernames.write(key, new_Address);

            self
                .emit(
                    Event::UserNameTransferred(
                        UserNameTransferred { username: key, address: new_Address }
                    )
                )
        }
        fn get_username(ref self: ContractState, key: felt252) -> ContractAddress {
            let username_address = self.usernames.read(key);
            return username_address;
        }
    }
}
