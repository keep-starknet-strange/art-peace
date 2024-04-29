pub mod UserNameClaimErrors {
    pub const USERNAME_CLAIMED: felt252 = 'username_claimed';
    pub const USERNAME_CANNOT_BE_TRANSFER: felt252 = 'username_cannot_be_transferred';
}

#[starknet::contract]
pub mod UsernameStore {
    use starknet::{get_caller_address, ContractAddress, contract_address_const};
    use art_peace::username_store::IUsernameStore;
    use super::UserNameClaimErrors;

    #[storage]
    struct Storage {
        usernames: LegacyMap::<felt252, ContractAddress>,
        address_to_username: LegacyMap::<ContractAddress, felt252>
    }
   
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        UserNameChanged {
            old_username: felt252,
            new_username: felt252,
            address: ContractAddress
        }
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
        fn claim_username(ref self: ContractState, username: felt252) {
            let caller_address = get_caller_address();
            let username_address = self.usernames.read(username);
            let existing_username = self.address_to_username.read(caller_address);

            assert(
                username_address == contract_address_const::<0>(),
                UserNameClaimErrors::USERNAME_CLAIMED
            );
            assert(
                existing_username == 0,
                "user_already_has_username"
            );

            self.usernames.write(username, caller_address);
            self.address_to_username.write(caller_address, username);

            self.emit(
                Event::UserNameClaimed {
                    username: username,
                    address: caller_address
                }
            );
        }

        fn change_username(ref self: ContractState, new_username: felt252) {
            let caller_address = get_caller_address();
            let existing_username = self.address_to_username.read(caller_address);

            assert(
                existing_username != 0,
                "user_does_not_have_username_to_change"
            );

            let new_username_address = self.usernames.read(new_username);
            assert(
                new_username_address == contract_address_const::<0>(),
                UserNameClaimErrors::USERNAME_CLAIMED
            );

            self.usernames.write(existing_username, contract_address_const::<0>());
            self.usernames.write(new_username, caller_address);
            self.address_to_username.write(caller_address, new_username);

            self.emit(
                Event::UserNameChanged {
                    old_username: existing_username,
                    new_username: new_username,
                    address: caller_address
                }
            );
        }

        fn get_username(ref self: ContractState, key: felt252) -> ContractAddress {
            self.usernames.read(key)
        }
    }
}
