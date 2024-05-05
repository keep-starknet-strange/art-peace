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
        user_to_username: LegacyMap::<
            ContractAddress, felt252
        > // New mapping to store user to username relationship
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        UserNameClaimed: UserNameClaimed,
        UserNameChanged: UserNameChanged // Changed event name to reflect username change
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameClaimed {
        #[key]
        username: felt252,
        address: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct UserNameChanged {
        #[key]
        old_username: felt252, // Added old_username field
        new_username: felt252,
        address: ContractAddress
    }

    #[abi(embed_v0)]
    pub impl UsernameStore of IUsernameStore<ContractState> {
        fn claim_username(ref self: ContractState, key: felt252) {
            let caller_address = get_caller_address();

            assert!(
                self
                    .user_to_username
                    .read(caller_address) == 0, // Check if user already has a username
                "user_already_has_username"
            );

            let username_address = self.usernames.read(key);

            assert(
                username_address == contract_address_const::<0>(),
                UserNameClaimErrors::USERNAME_CLAIMED
            );

            self.usernames.write(key, caller_address);
            self
                .user_to_username
                .write(caller_address, key); // Record the user to username relationship

            self
                .emit(
                    Event::UserNameClaimed(
                        UserNameClaimed { username: key, address: caller_address }
                    )
                );
        }

        fn change_username(ref self: ContractState, new_username: felt252) {
            let caller_address = get_caller_address();
            let old_username = self.user_to_username.read(caller_address);

            assert!(
                old_username != 0, // Check if user has an existing username to change
                "user_does_not_have_username"
            );

            let new_username_address = self.usernames.read(new_username);

            assert(
                new_username_address == contract_address_const::<0>(),
                UserNameClaimErrors::USERNAME_CLAIMED
            );

            self.usernames.write(old_username, contract_address_const::<0>());
            self.usernames.write(new_username, caller_address);
            self
                .user_to_username
                .write(caller_address, new_username); // Update the user to username relationship

            self
                .emit(
                    Event::UserNameChanged(
                        UserNameChanged {
                            old_username: old_username,
                            new_username: new_username,
                            address: caller_address
                        }
                    )
                );
        }

        fn get_username(ref self: ContractState, key: felt252) -> ContractAddress {
            self.usernames.read(key)
        }
    }
}
